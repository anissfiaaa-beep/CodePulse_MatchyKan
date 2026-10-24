> [!IMPORTANT]
> ## Submission Documents & Templates
> Download the required submission templates before preparing your submission.
>
> 👉 [Open the Google Drive folder](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef)

---

# MatchyKan FutureReady

> MatchyKan FutureReady helps learners and early-career professionals explore career options, understand skill signals, and get practical, AI-supported career guidance.

---

## Team Information

| Field | Details |
| --- | --- |
| **Team Name** | CodePulse |
| **Team Domain** | 1 |
| **SDG Track (1–17)** | 4,8 |
| **Team Leader** | Anis Sofia |
| **University** |Universiti Teknologi Malaysia UTM |
| **Number of Members** | 5|

## Links

| Resource | Link |
| --- | --- |
| GitHub Repository | To be added |
| Live Demo | To be added |
| RunPod Endpoint | Configured privately; do not publish credentials or private endpoint details |
| Slide Deck | To be added |
| Demo Video | To be added |

---

## Overview

### Problem

Learners and early-career professionals can find it difficult to connect their current skills with realistic career options and changing job-market needs. Career advice is often scattered across job listings, articles, and personal research, making it hard to decide what to learn or do next.

### Solution

MatchyKan FutureReady brings career exploration, skill signals, resume-based skill suggestions, and an AI career coach together in one web app. It helps users explore possible roles and practical next steps while keeping AI-generated suggestions reviewable by the user.

### Key Features

- **Career matches** — Explore role suggestions and open related LinkedIn and JobStreet searches.
- **Skills radar and job-market signals** — Review current and moderate-scenario signal indices, matched feed items, and supporting references. Curated references are kept separate from measured feed evidence.
- **Resume skill suggestions** — Upload a PDF, DOCX, or TXT CV and, after consent, review suggested skills before adding them to a profile.
- **AI career coach** — Chat about career options, CV experience, strengths, and possible next steps. CV attachment is optional.
- **English and Bahasa Melayu guidance** — The app includes Malay interface and guidance translations.

### Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| AI / Compute | RunPod Serverless endpoint using `Qwen/Qwen3-8B` |
| Career signals | RSS feeds and saved trend snapshots |
| Hosting / Development | Replit |

---

## Project Structure

```text
.
├── artifacts/
│   ├── matchykan-futureready/   # React/Vite web application
│   ├── api-server/              # Express API, resume parsing, AI and signal endpoints
│   └── mockup-sandbox/          # Component preview workspace
├── lib/                         # Shared workspace packages and API contracts
├── attached_assets/             # App images and other assets
├── test-assets/                 # Synthetic test CV
├── .env.example                 # Blank local environment-variable template
├── RUNPOD_SETUP.md              # RunPod setup, privacy, and troubleshooting
└── README.md
```

### Architecture

```text
User's browser
      │
      ├──► MatchyKan web app (React/Vite)
      │
      └──► MatchyKan API (Node/Express)
                  ├──► RSS feeds and career-signal snapshots
                  └──► RunPod Serverless (Qwen3-8B) for consented AI requests
```

---

## How to Run

### Option 1 — Run on Replit 

1. Open the MatchyKan FutureReady Replit.
2. Add `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID` under Tools -> Secrets to enable RunPod-powered resume suggestions and AI chat.
3. Start the configured API and web workflows.

Do not put API credentials in frontend code or in a `VITE_` variable. See [`RUNPOD_SETUP.md`](RUNPOD_SETUP.md) for configuration and privacy details.

### Option 2 — Run Locally

Requirements: Node.js 22.18 or newer and pnpm 10.

```bash
# Install dependencies from the project root
pnpm install

# Optional: create a local environment file and fill in RunPod settings
cp .env.example .env
```

Start the API server in one terminal:

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

Start the web app in a second terminal:

```bash
PORT=23563 BASE_PATH=/ pnpm --filter @workspace/matchykan-futureready run dev
```

Outside Replit, configure a same-origin reverse proxy: route `/api` to the API server on port `8080` and other requests to the frontend on port `23563`.

### Build and Check

From the project root:

```bash
pnpm run typecheck
pnpm run build
node --experimental-strip-types --test artifacts/api-server/tests/runpod-skills.test.mjs
```

---

## How We Use Replit *(Required)*

Complete this section with your team's actual Replit usage before submission:

- **Development:** Describe how the team used the Replit workspace.
- **Hosting:** Add the published app URL and describe the deployment setup.
- **Secrets:** RunPod credentials are configured as Replit Secrets and are not stored in source code.

📄 Proof of use: Add the completed Replit proof-of-use document to your submission materials.

## How We Use RunPod *(Required)*

RunPod Serverless hosts the `Qwen/Qwen3-8B` model used for CV skill suggestions and AI career-coach responses. Requests are sent by the backend API; the RunPod API key is not exposed to the browser.

📄 Proof of use: Add the completed RunPod proof-of-use document to your submission materials.

---

## Challenges & Learnings

Complete this section with the team's actual project experience:

- What challenges did the team face, and how were they addressed?
- What did the team learn from building and testing MatchyKan?

## Future Improvements

- [ ] Add more Malaysia-specific career references and continue checking the quality of source evidence.
- [ ] Improve career guidance and CV review based on feedback from learners.
- [ ] Add team and submission information, demo links, and proof-of-use documents.

## Team

| Name | Role | GitHub |
| --- | --- | --- |
| To be completed | To be completed | To be added |

---

## Submission Checklist

- [ ] Team name, domain, and SDG track filled in
- [ ] GitHub repository and live demo links added
- [ ] Slide deck and demo video links added
- [ ] Replit use described and proof-of-use document included
- [ ] RunPod use described and proof-of-use document included
- [ ] Required preliminary submission and technology declaration completed
- [ ] Submission files renamed with the team name
- [ ] Local setup steps verified
- [ ] No API keys or secrets committed to the repository

## License

No root-level `LICENSE` file is currently included. Add the appropriate license before distributing this project publicly.
