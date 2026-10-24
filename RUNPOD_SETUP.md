# Runpod setup

CV skill extraction uses the Qwen/Qwen3-8B model on a Runpod Serverless vLLM
endpoint. The API server reads credentials from environment variables; the
browser never receives the API key.

## Required configuration

- `RUNPOD_API_KEY`: the actual generated API-key token, not a URL, key name,
  or key ID. The key must be enabled and have access to your endpoint.
- `RUNPOD_ENDPOINT_ID`: the Serverless endpoint ID. The app also accepts a
  Runpod API URL beginning with `https://api.runpod.ai/v2/`.

Deploy the vLLM worker with model `Qwen/Qwen3-8B`. The app uses the endpoint's
OpenAI-compatible chat API. It requests structured skills JSON with thinking
disabled and validates returned names against the site's skill catalogue.

## In Replit

Add both names in **Tools → Secrets**, then restart the API server.
Existing Replit Secrets are not included in the downloaded source ZIP.
Never use a `VITE_` prefix for the API key or place it in frontend code.

## Local configuration

Copy `.env.example` to `.env` at the project root and fill in both values.
The API server's start command loads this root `.env` file. Keep it private;
the source archive contains only the blank example.

This is a Node/pnpm monorepo, not a static HTML website. Run the API and web
services together. Outside Replit, configure a same-origin reverse proxy
that sends `/api` to the API server and other paths to the web server;
Replit's shared proxy provides this routing in the workspace.
The workspace's platform-specific dependency overrides target Replit's Linux
environment; other operating systems may need those binary exclusions adjusted.

## CV privacy and limits

PDF, DOCX, and TXT files up to 5 MB are accepted. PDFs must contain selectable
text; scanned images are not OCR-processed. Only after the user opts in, the API
extracts text and sends up to 20,000 characters to Runpod. MatchyKan does not
persist the CV or extracted text. Users review suggestions before adding skills.

## Troubleshooting

- **401/403**: check the token and its endpoint permissions.
- **404**: check the endpoint, vLLM worker, and deployed model name.
- **Timeout**: inspect worker startup, queue, and GPU availability in Runpod.
  Avoid repeated uploads while a job may still be running.
- **Unreadable result**: inspect response metadata, never CV text or model
  content in logs. The API includes parser tests under `artifacts/api-server/tests`.

Runpod inference can incur usage charges. Never share keys in chat or source files.
