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
| **SDG Track (1–17)** | 4,5,8,10 |
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

- **Development:
  1. We used the Replit to generate our website ideas completely after we do it in VS code by sending the zip file via chatbox.
  2. We ask for suggestions to improve our website interface design and ask it to provide the sources/evidences needed.
  3. We ask replit for suggestion on what RunPod models it recommend that are suitable for our AI system in the website. 
- **Hosting:** Add the published app URL and describe the deployment setup.
- **Secrets:** RunPod credentials are configured as Replit Secrets and are not stored in source code.

📄 Proof of use: Add the completed Replit proof-of-use document to your submission materials.
<img width="1901" height="942" alt="Screenshot 2026-10-24 223223" src="https://github.com/user-attachments/assets/b9c9dd6c-f8d0-4664-9945-caa4bc84939c" />
<img width="566" height="437" alt="Screenshot 2026-10-24 223258" src="https://github.com/user-attachments/assets/ac6590ee-e54a-459b-8dc6-31a52d08b923" />



## How We Use RunPod *(Required)*

RunPod Serverless hosts the `Qwen/Qwen3-8B` model used for CV skill suggestions and AI career-coach responses. 
📄 Proof of use: Add the completed RunPod proof-of-use document to your submission materials.
<img width="1902" height="922" alt="Screenshot 2026-10-24 223539" src="https://github.com/user-attachments/assets/3005ff2b-000d-49df-ae13-f4dbd1617e3a" />

---

## Challenges & Learnings

Complete this section with the team's actual project experience:

- What challenges did the team face, and how were they addressed?
  1.We have problem to connect the RunPod to the Replit to run our AI, after a few try with multiple models, we are able to run our AI services.
  2.Our team have done two prototypes and the hardest part is to combine both website's feature into one to achieve the one we all satisfied.
  
- What did the team learn from building and testing MatchyKan?
  1.Our team learned that building a product is not just about developing features, it is about solving a real problem for users. Understanding users' needs and   expectations helped the team determine which features were useful and which needed improvement.
  2.We learned that ideas often need to change during development. Our team learned that an initial idea might not work exactly as expected once it is implemented and tested. Being willing to adjust the design, improve features, and respond to feedback helped make the product more practical and user-friendly.
  3.Teamwork and communication matter. Our team manages to meet in face-to-face to discuss and work together on the website. We learned that clear communication and collaboration were important for keeping development on track and ensuring that different components worked together as meeting in online does not work as expected.

## Future Improvements

- Add more Malaysia-specific career references and continue checking the quality of source evidence.(got salary ranges, entry requirements)
- Improve career guidance and CV review based on feedback from learners.
- Improve the AI system, using more advance GPU in the RunPod so the reply and CV skills detection can be done faster.
- Improve AI coach (AI chatbox), allow the AI to help create CV based on their skills. 
- More personal career matches , not only based on their skills but based on their education , location and interests.
- Improve our Learning Path interface that allow the users to track their daily learning hours and able to collect badges to encourage them to learn more(like duolingo badges).

## Team

| Name | Role | GitHub |
| --- | --- | --- |
| Lim Sze Yip| 1.Design the finalize structure of the website 2.Adding the CV reader AI , learning path and career matches(LinkedIn and Jobstreet) features| jeremylim00 |
| Tan Zhen Kai|...|...|
| Ong Szien Ping| Configure CV reader AI and prepare pitch deck|shaneong700|
| Anis Sofia|Team leader, design the base and distribute the works|anissfiaaa|
| Ummul Salmah |prepare pitch deck|ummulsalmahh|

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
