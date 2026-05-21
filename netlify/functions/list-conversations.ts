import type { Handler } from "@netlify/functions";
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

export const handler: Handler = async (event) => {
  const expected = process.env.TALK_TO_ME_LOGS_KEY;
  const got = event.queryStringParameters?.key;
  if (!expected || got !== expected) {
    return { statusCode: 401, body: "unauthorized" };
  }

  const store = getStore("conversations");
  const items: StoredConversation[] = [];

  for await (const entry of store.list()) {
    const data = await store.get(entry.key, { type: "json" });
    if (data) items.push(data as StoredConversation);
  }

  items.sort((a, b) => (a.started_at < b.started_at ? 1 : -1));

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ conversations: items }),
  };
};
