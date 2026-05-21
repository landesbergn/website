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
| Allowed origins (if available) | `noahlandesberg.com`, `*.netlify.app` |

## Webhook

In the agent's webhook settings:

- Type: post-call
- URL: `https://www.noahlandesberg.com/api/log-conversation`
- Custom header: `X-Webhook-Secret: <random string, save it>`

## Save these values for the Netlify env vars

After setup, add three secrets in Netlify → Site settings →
Build & deploy → Environment:

| Netlify env var | Value | Public? |
|---|---|---|
| `PUBLIC_ELEVENLABS_AGENT_ID` | agent ID | yes (shipped in HTML) |
| `ELEVENLABS_WEBHOOK_SECRET` | random string above | no |
| `TALK_TO_ME_LOGS_KEY` | random string of your choice | no |

`PUBLIC_*` is exposed to the client. The other two are server-only.
