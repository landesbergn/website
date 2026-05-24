import { getStore } from "@netlify/blobs";

type Turn = { role: "user" | "noah"; ts: number; text: string };
type StoredConversation = {
  conversation_id: string;
  started_at: string;
  duration_s: number;
  transcript: Turn[];
  ended_by: string;
  ip_hash: string | null;
};

export default async (req: Request): Promise<Response> => {
  const expected = process.env.TALK_TO_ME_LOGS_KEY;
  const url = new URL(req.url);
  const got = url.searchParams.get("key");
  if (!expected || got !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  const store = getStore("conversations");
  const { blobs } = await store.list();
  const items: StoredConversation[] = [];
  for (const entry of blobs) {
    const data = await store.get(entry.key, { type: "json" });
    if (data) items.push(data as StoredConversation);
  }

  items.sort((a, b) => (a.started_at < b.started_at ? 1 : -1));

  return new Response(JSON.stringify({ conversations: items }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const config = { path: "/api/list-conversations" };
