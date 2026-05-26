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
(visible in the ElevenLabs dashboard under the conversation's Analysis):

| Identifier | Type | Description |
|---|---|---|
| `caller_name` | String | The name the caller gave when introducing themselves or when leaving a message. Leave empty if they did not share it. |
| `caller_email` | String | The email address the caller provided so Noah can follow up. Should look like a valid email (something@something.tld). Leave empty if not shared. |
| `caller_reason` | String | A one-sentence summary of why the caller wants Noah to reach out (recruiting, project, journalism, intro, etc.). Leave empty if no reason was given. |

These come back in the conversation's `analysis.data_collection_results`
field via the conversations API and are shown alongside the transcript in
the ElevenLabs dashboard.

## (Optional) Evaluation criteria

You can also add evaluation criteria under the same Analysis tab if you
want the agent to self-score calls (e.g. "Did the caller leave their
contact info?"). Not required.

## Save these values for the Netlify env vars

After setup, add this secret in Netlify → Site settings →
Build & deploy → Environment, scoped to **Production** AND
**Deploy Previews**:

| Netlify env var | Value | Public? |
|---|---|---|
| `PUBLIC_ELEVENLABS_AGENT_ID` | agent ID | yes (shipped in HTML) |

`PUBLIC_*` is exposed to the client.

## Reviewing calls

Transcripts, durations, and extracted data-collection fields all live in
the ElevenLabs dashboard under the agent's Conversations tab. There is
no in-site logs page or webhook receiver — review happens directly in
ElevenLabs.
