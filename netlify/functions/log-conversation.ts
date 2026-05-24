import { getStore } from "@netlify/blobs";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

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

const MAX_AGE_SECONDS = 5 * 60;

function verifySvixSignature(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
): { ok: boolean; reason?: string } {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) {
    return { ok: false, reason: "missing svix headers" };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad timestamp" };
  const ageSec = Math.abs(Date.now() / 1000 - ts);
  if (ageSec > MAX_AGE_SECONDS) return { ok: false, reason: `stale (age=${ageSec}s)` };

  const keyB64 = secret.replace(/^wsec_/, "");
  const key = Buffer.from(keyB64, "base64");

  const signedPayload = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", key).update(signedPayload).digest("base64");

  for (const part of signature.split(" ")) {
    const [, sig] = part.split(",");
    if (!sig) continue;
    if (sig.length !== expected.length) continue;
    if (timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return { ok: true };
    }
  }
  return { ok: false, reason: "no signature matched" };
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) return new Response("server misconfigured", { status: 500 });

  const rawBody = await req.text();
  const sigHeaders = {
    id: req.headers.get("svix-id") ?? req.headers.get("webhook-id"),
    timestamp: req.headers.get("svix-timestamp") ?? req.headers.get("webhook-timestamp"),
    signature: req.headers.get("svix-signature") ?? req.headers.get("webhook-signature"),
  };

  const verified = verifySvixSignature(rawBody, sigHeaders, secret);
  if (!verified.ok) {
    console.warn("webhook verification failed:", verified.reason);
    return new Response("unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("invalid json", { status: 400 });
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
    req.headers.get("x-nf-client-connection-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
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

  return new Response(null, { status: 204 });
};

export const config = { path: "/api/log-conversation" };
