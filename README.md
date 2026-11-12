# NearSignal for Real Estate — NEAR HACKATHON

**Know which buyers and renters to call first.** NearSignal helps real estate agents prioritize buyer, renter, and seller inquiries with a hot, warm, or cold score, evidence-based reasons, and a friendly first message.

## The problem

Agents receive leads through forms, spreadsheets, email, WhatsApp, and DMs. It takes time to work out who is ready to move and what a useful first response should be. NearSignal turns that scattered context into a practical next step.

## How NEAR AI Cloud is used

The app sends qualification and paste-extraction requests from server routes to the OpenAI-compatible NEAR AI Cloud API at `https://cloud-api.near.ai/v1`. NEAR AI Cloud is the only model provider used for scoring and extraction. The default model is `zai-org/GLM-5.1-FP8`; `NEAR_AI_MODEL` can override it.

`NEAR_AI_API_KEY` is read only by server-side routes. It is never included in client code. Pasted text and lead fields are processed in memory for the request only: there is no database, server-side lead list, or disk persistence. The scored pipeline exists only in the current browser tab and clears on refresh. `GET /api/leads` deliberately returns 405.

## Run locally

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and set `NEAR_AI_API_KEY` to your NEAR AI Cloud key. Keep `.env.local` private; it is git-ignored.
3. Start with `pnpm dev` and open `http://localhost:3000`.

Get a key and review available models in the [NEAR AI Cloud quickstart](https://docs.near.ai/cloud/quickstart).

## Judge demo: do X, see Y

1. Click **Hot buyer**, **Warm renter**, or **Cold browser** to load a realistic example, or paste a lead message and choose **Fill from paste**.
2. Review and edit the extracted or sample fields; no scoring happens until you submit.
3. Click **Score this lead**. See the hot/warm/cold result, the short explanation and reasons, and a tailored first message.
4. Choose **Copy message** to copy the draft. The scored lead appears in the in-tab pipeline table.
5. To import a sheet, paste a Google Forms CSV with a header row or a single Sheets row into the same paste box, then choose **Paste a row from Sheets / CSV**. The first data row is filled for review.

Scoring and extraction can take up to a minute. A valid `NEAR_AI_API_KEY` is required; there is no mock scoring fallback.

## NEAR HACKATHON tracks

- **Autonomous Business** — prioritize real estate follow-up.
- **Agent Economy** — an AI agent extracts, qualifies, and drafts the next step.
- **Privacy & Private AI** — lead information is sent only to NEAR AI Cloud for inference; the app does not retain it on its server.

## Stack

Next.js App Router, TypeScript, and the OpenAI-compatible Node SDK pointed exclusively at NEAR AI Cloud. Input is validated on the server, prompt-injection content is treated as untrusted data, and the API key remains server-only.
