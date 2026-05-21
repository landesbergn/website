import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

type Turn = { role: "user" | "noah"; ts: number; text: string };

type StoredConversation = {
  conversation_id: string;
  started_at: string;
  duration_s: number;
  transcript: Turn[];
  ended_by: "user" | "time_cap" | "error" | "unknown";
  ip_hash: string | null;
  raw: unknown;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "method not allowed" };
  }

  const expected = process.env.ELEVENLABS_WEBHOOK_SECRET;
  const got = event.headers["x-webhook-secret"];
  if (!expected || got !== expected) {
    return { statusCode: 401, body: "unauthorized" };
  }

  let payload: any;
  try {
    payload = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: "invalid json" };
  }

  const conversation_id: string =
    payload.conversation_id ?? payload.id ?? `unknown-${Date.now()}`;
  const started_at: string =
    payload.start_time ?? payload.started_at ?? new Date().toISOString();
  const duration_s: number =
    payload.duration_seconds ?? payload.duration_s ?? 0;
  const ended_by: StoredConversation["ended_by"] =
    payload.ended_reason === "user_ended"
      ? "user"
      : payload.ended_reason === "time_limit"
        ? "time_cap"
        : payload.ended_reason === "error"
          ? "error"
          : "unknown";

  const rawTranscript: any[] = payload.transcript ?? payload.messages ?? [];
  const transcript: Turn[] = rawTranscript.map((t: any) => ({
    role: t.role === "agent" || t.role === "assistant" ? "noah" : "user",
    ts: typeof t.time_in_call_secs === "number" ? t.time_in_call_secs : (t.ts ?? 0),
    text: t.message ?? t.text ?? "",
  }));

  const ip =
    event.headers["x-nf-client-connection-ip"] ??
    event.headers["x-forwarded-for"]?.split(",")[0] ??
    null;
  const ip_hash = ip
    ? createHash("sha256").update(ip).digest("hex").slice(0, 16)
    : null;

  const day = started_at.slice(0, 10);
  const key = `${day}/${conversation_id}.json`;

  const stored: StoredConversation = {
    conversation_id,
    started_at,
    duration_s,
    transcript,
    ended_by,
    ip_hash,
    raw: payload,
  };

  const store = getStore("conversations");
  await store.setJSON(key, stored);

  return { statusCode: 204, body: "" };
};
