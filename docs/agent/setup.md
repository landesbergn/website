# ElevenLabs Agent setup — Noah's checklist

## Knowledge base files to upload

From this repo, upload these files to the agent's knowledge base
(ElevenLabs dashboard → Agent → Knowledge):

- `src/content/blog/*.md` (all markdown blog posts)
- `src/legacy/*.html` (the three frozen R posts — upload as plain text;
  the LLM ignores HTML markup around the body)
- `docs/agent/persona.md` itself, as a fallback grounding doc

Total corpus is small (under ~20k tokens), well within free-tier KB limits.

## Agent settings

| Setting | Value |
|---|---|
| Voice | Your Instant Voice Clone (from the ~1 min sample) |
| LLM | Anthropic Claude — latest sonnet |
| First message | Paste from `docs/agent/persona.md` "First message" section |
| System prompt | Paste from `docs/agent/persona.md` "System prompt" section |
| Max session duration | 5 minutes |
| Monthly minute cap | 100 minutes (raise later if usage justifies) |
| Allowed origins | `noahlandesberg.com`, `www.noahlandesberg.com`, `*.netlify.app` |

## Data Collection (interview message-taking)

In the agent's **Analysis** tab → **Data collection**, add these three
data points so the agent can extract caller info during the conversation
and we can surface it on `/talk-to-me-logs`:

| Identifier | Type | Description |
|---|---|---|
| `caller_name` | String | The name the caller gave when introducing themselves or when leaving a message. Leave empty if they did not share it. |
| `caller_email` | String | The email address the caller provided so Noah can follow up. Should look like a valid email (something@something.tld). Leave empty if not shared. |
| `caller_reason` | String | A one-sentence summary of why the caller wants Noah to reach out (recruiting, project, journalism, intro, etc.). Leave empty if no reason was given. |

These come back in the conversation's `analysis.data_collection_results`
field via the conversations API and are read by `list-conversations.ts`.

## (Optional) Evaluation criteria

You can also add evaluation criteria under the same Analysis tab if you
want the agent to self-score calls (e.g. "Did the caller leave their
contact info?"). Not required.

## Save these values for the Netlify env vars

After setup, add these secrets in Netlify → Site settings →
Build & deploy → Environment, scoped to **Production** AND
**Deploy Previews**:

| Netlify env var | Value | Public? |
|---|---|---|
| `PUBLIC_ELEVENLABS_AGENT_ID` | agent ID | yes (shipped in HTML) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key with ElevenAgents Read scope | no |
| `TALK_TO_ME_LOGS_KEY` | random string of your choice | no |
| `ELEVENLABS_WEBHOOK_SECRET` | (unused, leave for now) | no |

`PUBLIC_*` is exposed to the client. The others are server-only.

## Webhook note

The post-call webhook is currently unused — we poll the conversations
API on every admin-page load instead. The webhook config in ElevenLabs
can stay in place harmlessly, or be deleted.
