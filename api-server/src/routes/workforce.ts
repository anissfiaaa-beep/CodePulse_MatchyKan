import { Router, type IRouter, type Request, type Response } from "express";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import multer from "multer";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import Parser from "rss-parser";
import {
  BuildWorkforcePathwayBody,
  ExtractProfileSkillsResponse,
  GetWorkforceDashboardResponse,
  MatchWorkforceRolesBody,
  MatchWorkforceRolesResponse,
  RefreshWorkforceSignalsResponse,
} from "@workspace/api-zod";
import type {
  CareerRole,
  EvidenceItem,
  LearningPathway,
  LearnerProfile,
  RoleForecast,
  SkillSignal,
  WorkforceDashboard,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { normalizeRunpodEndpointId } from "../lib/runpod-config";
import {
  buildRunpodCareerChatRequest,
  buildRunpodSkillRequest,
  parseRunpodSkills,
  readRunpodChatResponse,
  type CareerChatMessage,
} from "../lib/runpod-skills";

const router: IRouter = Router();
const rss = new Parser({ timeout: 12_000 });
const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const skillCatalog = [
  {
    name: "Artificial Intelligence",
    searchQuery: '"artificial intelligence" OR "machine learning" OR "generative AI"',
    terms: ["artificial intelligence", "machine learning", "generative ai", " ai ", "llm"],
  },
  {
    name: "Data Analytics",
    searchQuery: '"data analytics" OR "data analysis" OR "data analyst"',
    terms: ["data analytics", "data analysis", "data analyst", "business intelligence", "power bi", "sql", "excel", "statistics", "python"],
  },
  {
    name: "Cybersecurity",
    searchQuery: 'cybersecurity OR "cyber security" OR "information security"',
    terms: ["cybersecurity", "cyber security", "security analyst", "threat detection"],
  },
  {
    name: "Cloud Computing",
    searchQuery: '"cloud computing" OR "cloud engineer" OR "cloud services"',
    terms: ["cloud computing", "cloud engineer", "aws", "azure", "kubernetes"],
  },
  {
    name: "Embedded Systems",
    searchQuery: '"embedded systems" OR "embedded software" OR firmware OR microcontroller',
    terms: ["embedded systems", "embedded engineer", "firmware", "microcontroller", "stm32"],
  },
  {
    name: "Industrial Automation",
    searchQuery: '"industrial automation" OR "factory automation" OR robotics OR PLC',
    terms: ["industrial automation", " plc ", "robotics", "automation engineer", "scada"],
  },
  {
    name: "Renewable Energy",
    searchQuery: '"renewable energy" OR solar energy OR wind energy OR "energy storage"',
    terms: ["renewable energy", "solar energy", "wind energy", "energy storage", "battery storage"],
  },
  {
    name: "Communication Skills",
    searchQuery: '"communication skills" OR "workplace communication" OR teamwork',
    terms: ["communication skills", "communication", "stakeholder management", "teamwork", "presentation skills", "problem solving"],
  },
  {
    name: "Software Development",
    searchQuery: '"software development" OR "software developer" OR "software engineer"',
    terms: ["software developer", "software engineer", "javascript", "python developer", "python", "coding", "programming", "full stack"],
  },
  {
    name: "Project Management",
    searchQuery: '"project management" OR "project manager" OR "project management skills"',
    terms: ["project management", "project manager", "agile", "scrum"],
  },
];

const roles: CareerRole[] = [
  {
    id: "ai-ml-engineer",
    title: "AI / Machine Learning Engineer",
    summary: "Build and evaluate AI systems, data pipelines, and model-powered products.",
    skills: ["Artificial Intelligence", "Data Analytics", "Software Development", "Cloud Computing"],
    sdgs: [
      { id: 4, title: "Quality Education" },
      { id: 8, title: "Decent Work and Economic Growth" },
      { id: 9, title: "Industry, Innovation and Infrastructure" },
    ],
    category: "AI & Data",
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    summary: "Turn data into clear insights that help teams make better decisions.",
    skills: ["Data Analytics", "Communication Skills", "Software Development", "Artificial Intelligence"],
    sdgs: [
      { id: 4, title: "Quality Education" },
      { id: 8, title: "Decent Work and Economic Growth" },
      { id: 9, title: "Industry, Innovation and Infrastructure" },
    ],
    category: "AI & Data",
  },
  {
    id: "cybersecurity-analyst",
    title: "Cybersecurity Analyst",
    summary: "Monitor systems, investigate threats, and improve organisational security.",
    skills: ["Cybersecurity", "Cloud Computing", "Communication Skills", "Software Development"],
    sdgs: [
      { id: 8, title: "Decent Work and Economic Growth" },
      { id: 9, title: "Industry, Innovation and Infrastructure" },
      { id: 16, title: "Peace, Justice and Strong Institutions" },
    ],
    category: "Digital",
  },
  {
    id: "cloud-devops-engineer",
    title: "Cloud / DevOps Engineer",
    summary: "Deploy reliable software and infrastructure using automation and cloud services.",
    skills: ["Cloud Computing", "Software Development", "Cybersecurity", "Project Management"],
    sdgs: [
      { id: 8, title: "Decent Work and Economic Growth" },
      { id: 9, title: "Industry, Innovation and Infrastructure" },
    ],
    category: "Digital",
  },
  {
    id: "embedded-systems-engineer",
    title: "Embedded Systems Engineer",
    summary: "Develop firmware and hardware-connected systems for products and devices.",
    skills: ["Embedded Systems", "Software Development", "Industrial Automation", "Communication Skills"],
    sdgs: [
      { id: 4, title: "Quality Education" },
      { id: 8, title: "Decent Work and Economic Growth" },
      { id: 9, title: "Industry, Innovation and Infrastructure" },
    ],
    category: "Engineering",
  },
  {
    id: "industrial-automation-engineer",
    title: "Industrial Automation Engineer",
    summary: "Design and maintain automated production, control, and monitoring systems.",
    skills: ["Industrial Automation", "Embedded Systems", "Software Development", "Cybersecurity"],
    sdgs: [
      { id: 8, title: "Decent Work and Economic Growth" },
      { id: 9, title: "Industry, Innovation and Infrastructure" },
    ],
    category: "Engineering",
  },
  {
    id: "renewable-energy-engineer",
    title: "Renewable Energy Systems Engineer",
    summary: "Help design, monitor, or improve clean-energy generation and storage systems.",
    skills: ["Renewable Energy", "Embedded Systems", "Data Analytics", "Industrial Automation"],
    sdgs: [
      { id: 7, title: "Affordable and Clean Energy" },
      { id: 9, title: "Industry, Innovation and Infrastructure" },
      { id: 13, title: "Climate Action" },
    ],
    category: "Sustainability",
  },
  {
    id: "technical-project-coordinator",
    title: "Technical Project Coordinator",
    summary: "Coordinate people, delivery plans, risks, and technical project outcomes.",
    skills: ["Project Management", "Communication Skills", "Data Analytics", "Cloud Computing"],
    sdgs: [
      { id: 4, title: "Quality Education" },
      { id: 8, title: "Decent Work and Economic Growth" },
      { id: 9, title: "Industry, Innovation and Infrastructure" },
    ],
    category: "Human Skills",
  },
];

const demoEvidence: EvidenceItem[] = [
  {
    title: "Employers increasingly explore generative AI skills",
    source: "FutureReady demo dataset",
    url: "https://news.google.com/search?q=generative+AI+skills",
    publishedAt: "2026-10-20T00:00:00.000Z",
    summary: "Illustrative sample mentioning generative AI, machine learning, analytics, and software development.",
  },
  {
    title: "Cybersecurity remains a key digital capability",
    source: "FutureReady demo dataset",
    url: "https://news.google.com/search?q=cybersecurity+jobs",
    publishedAt: "2026-10-18T00:00:00.000Z",
    summary: "Illustrative sample covering cybersecurity, threat detection, and cloud infrastructure.",
  },
  {
    title: "Clean energy and energy storage investment",
    source: "FutureReady demo dataset",
    url: "https://news.google.com/search?q=renewable+energy+jobs",
    publishedAt: "2026-10-16T00:00:00.000Z",
    summary: "Illustrative sample about renewable energy systems, storage, and industrial automation.",
  },
  {
    title: "Embedded systems and automation in connected products",
    source: "FutureReady demo dataset",
    url: "https://news.google.com/search?q=embedded+systems+automation+jobs",
    publishedAt: "2026-10-14T00:00:00.000Z",
    summary: "Illustrative sample mentioning firmware, microcontrollers, robotics, and automation.",
  },
  {
    title: "Teams need communication and project delivery skills",
    source: "FutureReady demo dataset",
    url: "https://news.google.com/search?q=project+management+skills",
    publishedAt: "2026-10-12T00:00:00.000Z",
    summary: "Illustrative sample mentioning teamwork, communication, and project management.",
  },
];

type Snapshot = {
  capturedAt: string;
  sourceMode: "demo" | "public-rss";
  evidence: EvidenceItem[];
  collectionVersion?: string;
};

const snapshotFile = path.join(process.cwd(), "data", "trend-snapshots.json");
const demoSnapshot: Snapshot = {
  capturedAt: "2026-10-20T08:00:00.000Z",
  sourceMode: "demo",
  evidence: demoEvidence,
};

function loadSnapshots(): Snapshot[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(snapshotFile, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("Snapshot history must be an array.");
    const valid = parsed.filter(
      (item): item is Snapshot =>
        !!item &&
        typeof item === "object" &&
        typeof item.capturedAt === "string" &&
        (item.sourceMode === "demo" || item.sourceMode === "public-rss") &&
        Array.isArray(item.evidence),
    );
    if (!valid.length) throw new Error("Snapshot history contains no valid entries.");
    return valid.slice(-6);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.error({ err: error }, "Unable to load stored workforce snapshot history.");
    }
    return [demoSnapshot];
  }
}

const snapshots = loadSnapshots();

function persistSnapshots() {
  mkdirSync(path.dirname(snapshotFile), { recursive: true });
  writeFileSync(snapshotFile, JSON.stringify(snapshots.slice(-6), null, 2), "utf8");
}

function countSkillMentions(skillName: string, evidence: EvidenceItem[]) {
  const skill = skillCatalog.find((entry) => entry.name === skillName);
  if (!skill) return 0;
  const text = evidence.map((item) => `${item.title} ${item.summary}`).join(" ").toLowerCase();
  return skill.terms.reduce((total, rawTerm) => {
    const term = rawTerm.trim().toLowerCase();
    if (term === "ai" || term === "plc") {
      return total + (text.match(new RegExp(`\\b${term}\\b`, "g"))?.length ?? 0);
    }
    return total + (text.split(term).length - 1);
  }, 0);
}

function calculateSkillSignals(): SkillSignal[] {
  const current = snapshots.at(-1);
  const precedingSnapshot = snapshots.at(-2);
  const previous =
    current &&
    precedingSnapshot &&
    current.collectionVersion === precedingSnapshot.collectionVersion
      ? precedingSnapshot
      : undefined;
  const currentCounts = skillCatalog.map((skill) => ({
    name: skill.name,
    mentions: countSkillMentions(skill.name, current?.evidence ?? []),
  }));
  const previousCounts = new Map(
    skillCatalog.map((skill) => [
      skill.name,
      countSkillMentions(skill.name, previous?.evidence ?? []),
    ]),
  );
  const maxCount = Math.max(1, ...currentCounts.map((item) => item.mentions));

  return currentCounts
    .map(({ name, mentions }) => {
      const change = previous ? mentions - (previousCounts.get(name) ?? 0) : 0;
      return {
        name,
        mentions,
        index: Math.round((mentions / maxCount) * 100),
        change,
        evidence: (current?.evidence ?? []).filter(
          (item) => countSkillMentions(name, [item]) > 0,
        ),
        direction: (previous
          ? change > 0
            ? "rising"
            : change < 0
              ? "declining"
              : "steady"
          : "baseline") as SkillSignal["direction"],
      };
    })
    .sort((a, b) => b.mentions - a.mentions);
}

function forecastRoles(skills: SkillSignal[]): RoleForecast[] {
  const currentCollectionVersion = snapshots.at(-1)?.collectionVersion;
  const comparableSnapshots = snapshots.filter(
    (snapshot) => snapshot.collectionVersion === currentCollectionVersion,
  );
  const history = comparableSnapshots.map((snapshot) => {
    const counts = skillCatalog.map((skill) => ({
      name: skill.name,
      mentions: countSkillMentions(skill.name, snapshot.evidence),
    }));
    const maxCount = Math.max(1, ...counts.map((item) => item.mentions));
    return new Map(
      counts.map((item) => [item.name, Math.round((item.mentions / maxCount) * 100)]),
    );
  });

  return roles.map((role) => {
    const roleHistory = history.map((snapshotSignals) =>
      role.skills.length
        ? Math.round(
            role.skills.reduce(
              (total, name) => total + (snapshotSignals.get(name) ?? 0),
              0,
            ) / role.skills.length,
          )
        : 0,
    );
    const index = roleHistory.at(-1) ?? 0;
    const recent = roleHistory.slice(-6);
    let projectedIndex = index;
    if (recent.length > 1) {
      const meanX = (recent.length - 1) / 2;
      const meanY = recent.reduce((sum, value) => sum + value, 0) / recent.length;
      const numerator = recent.reduce(
        (sum, value, i) => sum + (i - meanX) * (value - meanY),
        0,
      );
      const denominator =
        recent.reduce((sum, _value, i) => sum + (i - meanX) ** 2, 0) || 1;
      const slope = numerator / denominator;
      projectedIndex = Math.max(0, Math.min(100, Math.round(index + slope)));
    }
    const change = projectedIndex - index;
    return {
      roleId: role.id,
      title: role.title,
      index,
      change,
      direction: (history.length < 2
        ? "baseline"
        : change > 0
          ? "rising"
          : change < 0
            ? "declining"
            : "steady") as RoleForecast["direction"],
    };
  });
}

function makeDashboard(): WorkforceDashboard {
  const latest = snapshots.at(-1);
  const skills = calculateSkillSignals();
  return GetWorkforceDashboardResponse.parse({
    capturedAt: latest?.capturedAt ?? new Date().toISOString(),
    sourceMode: latest?.sourceMode ?? "demo",
    snapshotCount: snapshots.length,
    skills,
    evidence: latest?.evidence ?? demoEvidence,
    roles,
    forecasts: forecastRoles(skills),
  });
}

router.get("/workforce/dashboard", (_req, res) => {
  res.json(makeDashboard());
});

router.post("/workforce/refresh", async (req, res) => {
  try {
    const searchResults = await Promise.allSettled(
      skillCatalog.map(async (skill) => {
        const query = encodeURIComponent(skill.searchQuery);
        const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-MY&gl=MY&ceid=MY:en`;
        const feed = await rss.parseURL(feedUrl);
        return feed.items
          .filter((item) => item.title && item.link)
          .slice(0, 4)
          .map((item) => ({
            title: item.title ?? "Untitled technology news item",
            source: "Google News RSS",
            url: item.link ?? feedUrl,
            publishedAt: item.isoDate ?? item.pubDate ?? null,
            summary: item.contentSnippet ?? item.content ?? item.title ?? "",
          }));
      }),
    );
    const collectedItems = searchResults.flatMap((result, index) => {
      if (result.status === "rejected") {
        req.log.warn(
          { skill: skillCatalog[index].name, err: result.reason },
          "A skill-specific RSS search failed; continuing with the other results.",
        );
        return [];
      }
      return result.value;
    });
    const evidence: EvidenceItem[] = [
      ...new Map(collectedItems.map((item) => [item.url, item])).values(),
    ];

    if (!evidence.length) {
      res.status(502).json({ error: "The public news feed returned no usable evidence. Your current snapshot is unchanged." });
      return;
    }

    const previousHistory = snapshots.slice();
    // The demo baseline is not presented as a real prior news snapshot.
    if (snapshots.at(-1)?.sourceMode === "demo") snapshots.length = 0;
    snapshots.push({
      capturedAt: new Date().toISOString(),
      sourceMode: "public-rss",
      collectionVersion: "skill-targeted-v1",
      evidence,
    });
    if (snapshots.length > 6) snapshots.splice(0, snapshots.length - 6);
    try {
      persistSnapshots();
    } catch (error) {
      req.log.error({ err: error }, "Unable to persist workforce snapshot history.");
      snapshots.splice(0, snapshots.length, ...previousHistory);
      res.status(500).json({ error: "The feed was collected, but its snapshot could not be saved. The previous snapshot is unchanged." });
      return;
    }

    const dashboard = RefreshWorkforceSignalsResponse.parse(makeDashboard());
    res.json(dashboard);
  } catch (error) {
    res.status(502).json({
      error: "The public news feed is temporarily unavailable. Your current snapshot is unchanged.",
    });
  }
});

router.post("/workforce/matches", (req, res) => {
  const parsed = MatchWorkforceRolesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a valid learner profile." });
    return;
  }
  const profile: LearnerProfile = parsed.data;
  const knownSkills = new Set(profile.skills.map((skill) => skill.toLowerCase()));
  const normalizedInputs = profile.skills.map((skill) => skill.trim().toLowerCase());
  for (const skill of skillCatalog) {
    const hasAlias = skill.terms.some((rawTerm) => {
      const term = rawTerm.trim().toLowerCase();
      return normalizedInputs.some((input) =>
        /^[a-z0-9]+$/.test(term)
          ? new RegExp(`\\b${term}\\b`).test(input)
          : input.includes(term),
      );
    });
    if (hasAlias) knownSkills.add(skill.name.toLowerCase());
  }
  const preferredSdgs = new Set(profile.sdgs);
  const trendMap = new Map(makeDashboard().skills.map((skill) => [skill.name, skill]));

  const matches = roles.map((role) => {
    const matchedSkills = role.skills.filter((skill) => knownSkills.has(skill.toLowerCase()));
    const missingSkills = role.skills.filter((skill) => !knownSkills.has(skill.toLowerCase()));
    const alignedSdgs = role.sdgs.filter((sdg) => preferredSdgs.has(sdg.id));
    const matchPercent = matchedSkills.length / role.skills.length;
    const interestText = (profile.interests ?? "").toLowerCase();
    const interestBonus =
      interestText && role.skills.some((skill) => interestText.includes(skill.toLowerCase().split(" ")[0]))
        ? 8
        : 0;
    const sdgBonus = alignedSdgs.length ? Math.min(6, alignedSdgs.length * 2) : 0;
    const positiveChange = role.skills.reduce(
      (sum, skill) => sum + Math.max(0, trendMap.get(skill)?.change ?? 0),
      0,
    );
    const signalBonus =
      profile.scenario === "moderate"
        ? Math.min(3, Math.round(positiveChange / 2))
        : Math.min(1, Math.round(positiveChange / 3));
    const score = Math.min(
      97,
      Math.max(
        28,
        Math.round(34 + matchPercent * 50 + interestBonus + sdgBonus + signalBonus),
      ),
    );
    return {
      role,
      score,
      matchedSkills,
      missingSkills,
      alignedSdgs,
      explanation: `${matchedSkills.length} of ${role.skills.length} mapped skills match your profile. Interest and SDG alignment add small, disclosed bonuses.`,
    };
  }).sort((a, b) => b.score - a.score);

  res.json(MatchWorkforceRolesResponse.parse(matches));
});

const learningResources: Record<string, { url: string; deliverable: string; hours: number }> = {
  "Artificial Intelligence": {
    url: "https://developers.google.com/machine-learning/crash-course",
    deliverable: "Write a short model evaluation note covering strengths, risks, and limitations.",
    hours: 8,
  },
  "Data Analytics": {
    url: "https://www.kaggle.com/learn",
    deliverable: "Create a small analysis with a chart and a plain-language finding.",
    hours: 7,
  },
  Cybersecurity: {
    url: "https://skillsforall.com/",
    deliverable: "Document a defensive security checklist for a sample system.",
    hours: 8,
  },
  "Cloud Computing": {
    url: "https://learn.microsoft.com/training/",
    deliverable: "Draw and explain a secure cloud architecture for a small app.",
    hours: 7,
  },
  "Embedded Systems": {
    url: "https://docs.arduino.cc/",
    deliverable: "Document a small sensor prototype, its inputs, and observed output.",
    hours: 8,
  },
  "Industrial Automation": {
    url: "https://www.open.edu/openlearn/",
    deliverable: "Sketch a safe automation workflow with sensors and control steps.",
    hours: 8,
  },
  "Renewable Energy": {
    url: "https://www.nrel.gov/education/",
    deliverable: "Summarise a clean-energy case study using one public dataset.",
    hours: 7,
  },
  "Communication Skills": {
    url: "https://www.atlassian.com/team-playbook",
    deliverable: "Prepare a one-page stakeholder update for a technical project.",
    hours: 4,
  },
  "Software Development": {
    url: "https://www.freecodecamp.org/learn/",
    deliverable: "Publish a small, documented coding project in a portfolio.",
    hours: 9,
  },
  "Project Management": {
    url: "https://www.atlassian.com/agile",
    deliverable: "Create a project plan with milestones, risks, and a review point.",
    hours: 5,
  },
};

router.post("/workforce/pathway", (req, res) => {
  const parsed = BuildWorkforcePathwayBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please choose a role and enter weekly study hours between 1 and 40." });
    return;
  }
  const { roleId, skills, hoursPerWeek } = parsed.data;
  const role = roles.find((item) => item.id === roleId);
  if (!role) {
    res.status(404).json({ error: "That career role is not in the current catalogue." });
    return;
  }
  const normalizedInputs = skills.map((skill) => skill.trim().toLowerCase());
  const existing = new Set(normalizedInputs);
  for (const catalogSkill of skillCatalog) {
    const hasAlias = catalogSkill.terms.some((rawTerm) => {
      const term = rawTerm.trim().toLowerCase();
      return normalizedInputs.some((input) =>
        /^[a-z0-9]+$/.test(term)
          ? new RegExp(`\\b${term}\\b`).test(input)
          : input.includes(term),
      );
    });
    if (hasAlias) existing.add(catalogSkill.name.toLowerCase());
  }
  const missing = role.skills.filter((skill) => !existing.has(skill.toLowerCase()));
  const makeStep = (
    id: string,
    title: string,
    description: string,
    deliverable: string,
    hours: number,
    resourceUrl: string,
  ) => {
    const weeks = Math.max(1, Math.ceil(hours / hoursPerWeek));
    return {
      id,
      title,
      description,
      duration: `${weeks} ${weeks === 1 ? "week" : "weeks"}`,
      hours,
      resourceUrl,
      deliverable,
      completed: false,
    };
  };
  const slug = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const steps = missing.flatMap((skill) => {
    const resource = learningResources[skill] ?? {
      url: "https://www.kaggle.com/learn",
      deliverable: "Build and explain a short project that demonstrates this skill.",
      hours: 6,
    };
    const totalHours = Math.max(4, resource.hours);
    const foundationHours = Math.max(1, Math.round(totalHours * 0.25));
    const practiceHours = Math.max(1, Math.round(totalHours * 0.35));
    const projectHours = totalHours - foundationHours - practiceHours;
    const skillSlug = slug(skill);
    return [
      makeStep(
        `${role.id}-${skillSlug}-foundation`,
        `Learn the foundations: ${skill}`,
        `Start with the core ideas behind ${skill} and connect them to the work of a ${role.title}.`,
        `Write a short set of notes defining three important concepts in ${skill}.`,
        foundationHours,
        resource.url,
      ),
      makeStep(
        `${role.id}-${skillSlug}-practice`,
        `Practise ${skill}`,
        `Work through a guided exercise, then check your result and note what you would improve.`,
        `Complete one exercise and record the result, one challenge, and one question.`,
        practiceHours,
        resource.url,
      ),
      makeStep(
        `${role.id}-${skillSlug}-project`,
        `Apply ${skill} in a small project`,
        `Use ${skill} to create something relevant to a ${role.title}; keep the scope small enough to finish.`,
        resource.deliverable,
        projectHours,
        resource.url,
      ),
    ];
  });
  const showcaseResource =
    learningResources[missing[0] ?? role.skills[0]] ?? {
      url: "https://www.kaggle.com/learn",
      deliverable: "Build and explain a short project that demonstrates this skill.",
      hours: 6,
    };
  steps.push(
    makeStep(
      `${role.id}-capstone`,
      `Build a ${role.title} portfolio project`,
      "Bring your learning together in one practical example. Explain the problem, your approach, and what you learned.",
      `Complete a small project using at least two mapped skills: ${role.skills.slice(0, 2).join(" and ")}.`,
      3,
      showcaseResource.url,
    ),
    makeStep(
      `${role.id}-portfolio`,
      "Document and present your work",
      "Make your project easy to understand and review. Include the context, your contribution, and a short reflection.",
      "Create a one-page project summary with a link to your work and three lessons learned.",
      2,
      showcaseResource.url,
    ),
  );
  const response: LearningPathway = {
    role,
    totalHours: steps.reduce((total, step) => total + step.hours, 0),
    steps,
  };
  res.json(response);
});

async function extractCvText(
  file: Express.Multer.File,
): Promise<string> {
  const extension = file.originalname.toLowerCase().split(".").pop();
  if (extension === "txt") return file.buffer.toString("utf8").slice(0, 100_000);
  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value.slice(0, 100_000);
  }
  if (extension === "pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const result = await parser.getText();
      return result.text.slice(0, 100_000);
    } finally {
      await parser.destroy();
    }
  }
  throw new Error("Upload a PDF, DOCX, or TXT file.");
}

router.post("/workforce/profile/extract", (req: Request, res: Response) => {
  cvUpload.single("cv")(req, res, (uploadError) => {
    if (uploadError) {
      res.status(400).json({ error: "The CV must be one PDF, DOCX, or TXT file no larger than 5 MB." });
      return;
    }
    const file = req.file;
    if (req.body.consent !== "true") {
      res.status(400).json({ error: "Please confirm consent before extracting CV skills." });
      return;
    }
    if (!file) {
      res.status(400).json({ error: "Choose a CV file to continue." });
      return;
    }

    void (async () => {
      let text: string;
      try {
        text = await extractCvText(file);
      } catch (error) {
        res.status(400).json({
          error:
            error instanceof Error
              ? error.message
              : "This CV could not be read. Try a text-based PDF, DOCX, or TXT file.",
        });
        return;
      }

      if (!text.trim()) {
        res.status(400).json({
          error: "No readable text was found. Scanned-image PDFs are not supported; you can add skills manually.",
        });
        return;
      }

      const apiKey = process.env.RUNPOD_API_KEY?.trim();
      const endpointId = normalizeRunpodEndpointId(process.env.RUNPOD_ENDPOINT_ID);
      if (!apiKey || !endpointId) {
        res.status(503).json({
          error: "Runpod skill extraction is not configured. You can enter skills manually.",
        });
        return;
      }
      if (/^https?:\/\//i.test(apiKey)) {
        res.status(503).json({
          error: "RUNPOD_API_KEY contains a URL, not an API-key token. Replace its value in Replit Secrets with the actual key generated by Runpod.",
        });
        return;
      }

      try {
        const response = await fetch(
          `https://api.runpod.ai/v2/${encodeURIComponent(endpointId)}/openai/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildRunpodSkillRequest(text, skillCatalog.map((skill) => skill.name))),
            signal: AbortSignal.timeout(120_000),
          },
        );

        if (!response.ok) {
          req.log.warn({ statusCode: response.status }, "Runpod CV skill extraction request failed");
          res.status(502).json({
            error: response.status === 404
              ? "Runpod could not find the endpoint or model. Check the Serverless endpoint ID and that it uses the Qwen/Qwen3-8B vLLM worker."
              : response.status === 401 || response.status === 403
                ? "Runpod rejected access. Check that the API key has permission to use this endpoint."
                : "Runpod could not analyze this CV right now. Please try again or enter skills manually.",
          });
          return;
        }

        const responsePayload: unknown = await response.json();
        const { text: content, finishReason, completionTokens } = readRunpodChatResponse(responsePayload);
        if (finishReason === "length") {
          req.log.warn({ finishReason, completionTokens }, "Runpod CV skill extraction output was truncated");
          res.status(502).json({
            error: "Runpod stopped before completing the skills list. Please try again or enter skills manually.",
          });
          return;
        }
        if (!content) {
          req.log.warn("Runpod CV skill extraction returned an unexpected response");
          res.status(502).json({
            error: "Runpod returned an unexpected response. Please try again or enter skills manually.",
          });
          return;
        }

        let skills: string[];
        try {
          skills = parseRunpodSkills(content, skillCatalog.map((skill) => skill.name));
        } catch {
          req.log.warn(
            { finishReason, completionTokens, contentLength: content.length },
            "Runpod CV skill extraction returned an invalid skills list",
          );
          res.status(502).json({
            error: "Runpod returned an unreadable skills list. Please try again or enter skills manually.",
          });
          return;
        }

        res.json(
          ExtractProfileSkillsResponse.parse({
            skills,
            note: skills.length
              ? "AI suggestions from your CV. Review each suggestion before adding it. MatchyKan does not save the file or extracted text."
              : "No catalogue skills were identified. You can add skills manually.",
          }),
        );
      } catch (error) {
        const timedOut =
          error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
        req.log.warn(
          { errorName: error instanceof Error ? error.name : "unknown" },
          timedOut ? "Runpod CV skill extraction timed out" : "Runpod CV skill extraction failed",
        );
        res.status(timedOut ? 504 : 502).json({
          error: timedOut
            ? "CV analysis took too long. Please try again or enter skills manually."
            : "CV analysis is unavailable right now. Please try again or enter skills manually.",
        });
      }
    })();
  });
});

router.post("/workforce/chat", (req: Request, res: Response) => {
  cvUpload.single("cv")(req, res, (uploadError) => {
    if (uploadError) {
      res.status(400).json({ error: "Upload one PDF, DOCX, or TXT file no larger than 5 MB." });
      return;
    }
    if (req.body.consent !== "true") {
      res.status(400).json({ error: "Please confirm consent before sending a message to the AI coach." });
      return;
    }

    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 2_000) {
      res.status(400).json({ error: "Enter a message between 1 and 2,000 characters." });
      return;
    }

    let history: CareerChatMessage[];
    try {
      const parsed: unknown = JSON.parse(req.body.history);
      if (
        !Array.isArray(parsed) ||
        parsed.length > 12 ||
        !parsed.every(
          (item): item is CareerChatMessage =>
            !!item &&
            typeof item === "object" &&
            ((item as CareerChatMessage).role === "user" || (item as CareerChatMessage).role === "assistant") &&
            typeof (item as CareerChatMessage).content === "string" &&
            (item as CareerChatMessage).content.length <= 2_000,
        )
      ) {
        throw new Error("Invalid conversation history");
      }
      history = [...parsed, { role: "user", content: message }];
    } catch {
      res.status(400).json({ error: "The conversation could not be read. Please start a new chat." });
      return;
    }
    if (
      history.length > 13 ||
      history.slice(0, -1).reduce((total, item) => total + item.content.length, 0) > 12_000
    ) {
      res.status(400).json({ error: "This conversation is too long. Please start a new chat." });
      return;
    }

    void (async () => {
      let cvText: string | undefined;
      if (req.file) {
        try {
          cvText = await extractCvText(req.file);
        } catch (error) {
          res.status(400).json({
            error: error instanceof Error
              ? error.message
              : "This file could not be read. Try a text-based PDF, DOCX, or TXT file.",
          });
          return;
        }
        if (!cvText.trim()) {
          res.status(400).json({ error: "No readable text was found in the uploaded file." });
          return;
        }
      }

      const apiKey = process.env.RUNPOD_API_KEY?.trim();
      const endpointId = normalizeRunpodEndpointId(process.env.RUNPOD_ENDPOINT_ID);
      if (!apiKey || !endpointId) {
        res.status(503).json({ error: "The AI career coach is not configured yet." });
        return;
      }
      if (/^https?:\/\//i.test(apiKey)) {
        res.status(503).json({ error: "The Runpod API key setting is invalid. Update it in Replit Secrets." });
        return;
      }

      try {
        const response = await fetch(
          `https://api.runpod.ai/v2/${encodeURIComponent(endpointId)}/openai/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildRunpodCareerChatRequest(history, cvText)),
            signal: AbortSignal.timeout(120_000),
          },
        );
        if (!response.ok) {
          req.log.warn({ statusCode: response.status }, "Runpod career chat request failed");
          res.status(502).json({
            error: response.status === 401 || response.status === 403
              ? "Runpod rejected access. Check that the API key has permission to use this endpoint."
              : "The AI coach could not answer right now. Please try again.",
          });
          return;
        }

        const payload: unknown = await response.json();
        const { text: reply, finishReason } = readRunpodChatResponse(payload);
        if (!reply || finishReason === "length") {
          req.log.warn({ finishReason }, "Runpod career chat returned an empty or truncated response");
          res.status(502).json({ error: "The AI coach did not finish its answer. Please try again." });
          return;
        }
        res.json({ reply: reply.trim() });
      } catch (error) {
        const timedOut =
          error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
        req.log.warn(
          { errorName: error instanceof Error ? error.name : "unknown" },
          timedOut ? "Runpod career chat timed out" : "Runpod career chat failed",
        );
        res.status(timedOut ? 504 : 502).json({
          error: timedOut ? "The AI coach took too long to respond. Please try again." : "The AI coach is unavailable right now.",
        });
      }
    })();
  });
});

export default router;
