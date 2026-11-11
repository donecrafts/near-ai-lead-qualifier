# Signal — NEAR HACKATHON

A focused lead qualification agent built for **NEAR HACKATHON**. Signal turns basic lead context into a hot, warm, or cold score, a concise explanation, and a suggested first message.

## The problem

Teams collect leads from forms, spreadsheets, and conversations, then spend time figuring out who to contact first and what to say. Signal gives each lead a quick, actionable first read so a small team can prioritize follow-up.

## How NEAR AI Cloud is used

Every qualification request is sent server-side to **NEAR AI Cloud** using its OpenAI-compatible API (`https://cloud-api.near.ai/v1`). The app uses a NEAR AI Cloud model (default: `zai-org/GLM-5.1-FP8`) for all scoring. Lead details are not sent to OpenAI or another AI provider. The API key stays on the server and must never be exposed in client code or committed.

The first version keeps scored leads in process memory, not on disk or in a hosted database. That makes it easy to demo; the list clears when the server restarts and is not shared across deployed instances.

## Run locally

1. Install dependencies with `pnpm install`.
2. Create `.env.local` from `.env.example` and replace the placeholder with your NEAR AI Cloud key. Keep `.env.local` private; it is git-ignored.
3. Start the app with `pnpm dev` and open `http://localhost:3000`.

Get a key and check available models in the [NEAR AI Cloud quickstart](https://docs.near.ai/cloud/quickstart). Optional `NEAR_AI_MODEL` overrides the default model.

## Judge demo: do X, see Y

1. Click **TRY SAMPLE** to load a realistic lead from Northstar Health.
2. Click **QUALIFY LEAD**. The app sends that lead to NEAR AI Cloud.
3. See the hot/warm/cold temperature, the AI's short rationale, and a tailored first message in the readout.
4. Click **COPY MESSAGE** to copy the draft, or select a scored lead from the pipeline to revisit its result.

The first scoring request requires a valid `NEAR_AI_API_KEY` in `.env.local`. If the key is missing, the app explains how to configure it; it never silently substitutes a mock score.

## Tracks

- **Autonomous Business** — prioritize and move sales conversations forward.
- **Agent Economy** — an AI agent that turns lead context into a next action.
- **Privacy & Private AI** — sensitive lead data is scored through NEAR AI Cloud private inference.

## Tech

Next.js App Router, TypeScript, and the OpenAI-compatible Node SDK pointed exclusively at NEAR AI Cloud. The API key is only accessed in the server route. Input fields and server-side validation are bounded; lead notes are treated as untrusted data in the model instructions.
