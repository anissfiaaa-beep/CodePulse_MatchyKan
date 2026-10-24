export type SkillReferenceSource = {
  title: string;
  source: string;
  url: string;
  summary: string;
};

/**
 * Curated context sources shown only when the current RSS snapshot has no
 * matching article for a skill. These references never affect feed counts,
 * signal indices, or forecasts.
 */
export const skillReferenceSources: Record<string, SkillReferenceSource[]> = {
  "Artificial Intelligence": [
    {
      title: "The Future of Jobs Report 2025",
      source: "World Economic Forum",
      url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/",
      summary: "The report identifies AI and big data among the fastest-growing skills expected by employers globally through 2030.",
    },
  ],
  "Data Analytics": [
    {
      title: "Malaysia Digital Industry Report — H1 2025",
      source: "Malaysia Digital Economy Corporation",
      url: "https://www.mdec.my/api/media/file/MDIR_H1_2025.pdf",
      summary: "MDEC highlights demand for data and cloud in Malaysia’s digital industry. This is industry context, not a count of analytics vacancies.",
    },
  ],
  Cybersecurity: [
    {
      title: "The Future of Jobs Report 2025",
      source: "World Economic Forum",
      url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/",
      summary: "The report lists networks and cybersecurity among the fastest-growing skills in its global employer survey.",
    },
  ],
  "Cloud Computing": [
    {
      title: "Malaysia Digital Industry Report — H1 2025",
      source: "Malaysia Digital Economy Corporation",
      url: "https://www.mdec.my/api/media/file/MDIR_H1_2025.pdf",
      summary: "MDEC highlights demand for cloud and data in Malaysia’s digital industry. This is industry context, not a count of cloud vacancies.",
    },
  ],
  "Embedded Systems": [
    {
      title: "Embedded jobs in Malaysia",
      source: "JobStreet Malaysia",
      url: "https://my.jobstreet.com/embedded-jobs",
      summary: "This live search can show Malaysian embedded-software and electronics roles. Listings change and do not represent a national demand estimate.",
    },
  ],
  "Industrial Automation": [
    {
      title: "Malaysia sets a target of 3,000 smart factories by 2030",
      source: "Malaysian Investment Development Authority",
      url: "https://www.mida.gov.my/mida-news/malaysia-sets-minimum-target-of-3000-smart-factories-by-2030-miti",
      summary: "MIDA describes Malaysia’s smart-factory target and the use of automation, digitalisation, AI, IoT, and robotics in manufacturing.",
    },
  ],
  "Renewable Energy": [
    {
      title: "Renewable energy and jobs: Annual review 2025",
      source: "International Renewable Energy Agency",
      url: "https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2026/Jan/IRENA_SOC_RE_and_jobs_2026.pdf",
      summary: "IRENA’s annual review discusses workforce skills, education, and training needed for the renewable-energy transition.",
    },
  ],
  "Communication Skills": [
    {
      title: "Career Readiness Competencies",
      source: "National Association of Colleges and Employers",
      url: "https://www.naceweb.org/career-readiness/competencies/career-readiness-defined",
      summary: "NACE defines communication as a career-readiness competency, including clearly exchanging information and ideas.",
    },
  ],
  "Software Development": [
    {
      title: "MyMahir Malaysia Critical Occupations List 2024/2025",
      source: "Talent Corporation Malaysia",
      url: "https://www.talentcorp.com.my/images/uploads/publication/205/MyMahir-MyCOL-20242025-Brochure-1773377416.pdf",
      summary: "TalentCorp’s Malaysia critical-occupations publication includes software developers among occupations identified for workforce planning.",
    },
  ],
  "Project Management": [
    {
      title: "Global Project Management Talent Gap",
      source: "Project Management Institute",
      url: "https://www.pmi.org/learning/thought-leadership/global-project-management-talent-gap",
      summary: "PMI estimates the global project profession could need up to 30 million more professionals by 2035; this is a global projection, not a Malaysian job count.",
    },
  ],
};
