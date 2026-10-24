# MatchyKan FutureReady — website source

This ZIP contains the latest website frontend, API server, shared libraries,
Runpod integration fixes, PDF worker build fix, response-parser tests, and
the synthetic CV sample.

## Included

- `artifacts/matchykan-futureready`: React/Vite website.
- `artifacts/api-server`: Node API, PDF/DOCX/TXT parsing, and Runpod integration.
- `lib`: API contracts, generated clients, validation, and workspace libraries.
- `test-assets/synthetic-cv.txt`: the successful synthetic Runpod sample.
- `.env.example`: blank configuration template.
- `RUNPOD_SETUP.md`: credential setup, privacy, and troubleshooting.

## Not included

Actual API keys, completed `.env` files, Replit Secrets, uploaded CVs, Git/chat
history, installed dependencies, generated builds, and the design sandbox.

## Setup notes

Use Node.js 22.18 or newer and pnpm 10. Run `pnpm install` from the extracted
project root, then `pnpm run typecheck` to build shared-library declarations
and check the source.

Configure Runpod using `RUNPOD_SETUP.md`. Secrets must be entered again in
the destination environment; they never travel with this ZIP.

The two application services are:

- `pnpm --filter @workspace/api-server run dev`
- `pnpm --filter @workspace/matchykan-futureready run dev`

Use the existing artifact-managed workflows in Replit. For local use,
provide `PORT=8080` to the API service and `PORT=23563` plus `BASE_PATH=/`
to the web service, and set up the same-origin reverse proxy described in
`RUNPOD_SETUP.md`. The API development command uses POSIX shell syntax.

This is source code: do not open `index.html` directly expecting the API
or CV analysis to work, and do not upload this ZIP into the CV form.

## Parser checks

From the project root:

```sh
node --experimental-strip-types --test artifacts/api-server/tests/runpod-skills.test.mjs
```
