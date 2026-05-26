type Turn = { role: "user" | "noah"; ts: number; text: string };
type Extracted = {
  caller_name?: string;
  caller_email?: string;
  caller_reason?: string;
};
type StoredConversation = {
  conversation_id: string;
  started_at: string;
  duration_s: number;
  transcript: Turn[];
  ended_by: string;
  ip_hash: string | null;
  extracted: Extracted;
};

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1/convai/conversations";

export default async (req: Request): Promise<Response> => {
  const expected = process.env.TALK_TO_ME_LOGS_KEY;
  const url = new URL(req.url);
  const got = url.searchParams.get("key");
  if (!expected || got !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.PUBLIC_ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return new Response(
      JSON.stringify({ error: "server misconfigured: missing API key or agent id" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const headers = { "xi-api-key": apiKey, accept: "application/json" };

  const listRes = await fetch(
    `${ELEVENLABS_BASE}?agent_id=${encodeURIComponent(agentId)}&page_size=30`,
    { headers },
  );
  if (!listRes.ok) {
    const text = await listRes.text();
    return new Response(
      JSON.stringify({ error: "elevenlabs list failed", status: listRes.status, body: text.slice(0, 500) }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
  const listJson = (await listRes.json()) as { conversations?: ConvSummary[] };
  const summaries = listJson.conversations ?? [];

  const details = await Promise.all(summaries.map(async (m) => {
    const r = await fetch(`${ELEVENLABS_BASE}/${encodeURIComponent(m.conversation_id)}`, { headers });
    if (!r.ok) return null;
    const det = (await r.json()) as ConvDetail;
    return toStored(m, det);
  }));

  const items = details.filter((x): x is StoredConversation => x !== null);
  items.sort((a, b) => (a.started_at < b.started_at ? 1 : -1));

  return new Response(JSON.stringify({ conversations: items }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};

export const config = { path: "/api/list-conversations" };

type ConvSummary = {
  conversation_id: string;
  start_time_unix_secs?: number;
  call_duration_secs?: number;
  status?: string;
  call_successful?: string;
};

type DataCollectionResult = { value?: unknown; rationale?: string } | string | null;

type ConvDetail = {
  transcript?: { role?: string; message?: string; time_in_call_secs?: number }[];
  metadata?: { start_time_unix_secs?: number; call_duration_secs?: number };
  status?: string;
  analysis?: {
    data_collection_results?: Record<string, DataCollectionResult>;
  };
  data_collection_results?: Record<string, DataCollectionResult>;
};

function readDataPoint(
  results: Record<string, DataCollectionResult> | undefined,
  key: string,
): string | undefined {
  if (!results) return undefined;
  const raw = results[key];
  if (raw == null) return undefined;
  if (typeof raw === "string") return raw.trim() || undefined;
  if (typeof raw === "object" && "value" in raw) {
    const v = raw.value;
    if (typeof v === "string") return v.trim() || undefined;
    if (v != null) return String(v);
  }
  return undefined;
}

function toStored(meta: ConvSummary, det: ConvDetail): StoredConversation {
  const start = meta.start_time_unix_secs ?? det.metadata?.start_time_unix_secs ?? 0;
  const duration = meta.call_duration_secs ?? det.metadata?.call_duration_secs ?? 0;
  const transcript: Turn[] = (det.transcript ?? []).map((t) => ({
    role: t.role === "agent" || t.role === "assistant" ? "noah" : "user",
    ts: t.time_in_call_secs ?? 0,
    text: t.message ?? "",
  }));
  const results = det.analysis?.data_collection_results ?? det.data_collection_results;
  const extracted: Extracted = {
    caller_name: readDataPoint(results, "caller_name"),
    caller_email: readDataPoint(results, "caller_email"),
    caller_reason: readDataPoint(results, "caller_reason"),
  };
  return {
    conversation_id: meta.conversation_id,
    started_at: new Date(start * 1000).toISOString(),
    duration_s: duration,
    transcript,
    ended_by: meta.call_successful === "success" ? "user" : (meta.status ?? "unknown"),
    ip_hash: null,
    extracted,
  };
}
