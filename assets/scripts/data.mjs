// The profile's content, taken from the portfolio's own data (tumang-front-end/src/data). Keep the two in
// step: when the portfolio changes, change it here and run `pnpm build`.

export const PORTFOLIO = "https://zabdielportfolio.vercel.app";
export const EMAIL = "zabdieljairus@gmail.com";

export const links = [
  { id: "portfolio", label: "Portfolio", url: PORTFOLIO },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/zabjt/" },
  { id: "email", label: "Email", url: `mailto:${EMAIL}` },
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/zab.jt/" },
];

export const hero = {
  eyebrow: "Zabdiel Tumang · Full-stack software engineer",
  line: "I build the systems",
  accent: "behind the screen.",
  sub: "Web, mobile and IoT platforms for government, enterprise and business clients.",
};

export const skills = [
  {
    title: "Real-time systems",
    summary: "Live calls, location streams and events that land the moment they happen.",
    tools: ["LiveKit", "WebRTC", "Node.js", "Laravel"],
  },
  {
    title: "Hardware meets software",
    summary: "ESP32 devices wired straight into the platforms people use.",
    tools: ["ESP32", "Arduino", "C++", "IoT"],
  },
  {
    title: "APIs and backends",
    summary: "Secure REST APIs, authentication and databases built for real workloads.",
    tools: ["Laravel", "Node.js", "Express.js", "MySQL", "MongoDB"],
  },
  {
    title: "AI that pays for itself",
    summary: "AI where it earns its keep, and smarter retrieval where it doesn't.",
    tools: ["Prompt engineering", "BM25", "Prescriptive analytics"],
  },
  {
    title: "Web and mobile apps",
    summary: "Dashboards and apps that stay clear under pressure, on any screen.",
    tools: ["React", "TypeScript", "Flutter", "Tailwind CSS"],
  },
];

// In the portfolio's flight order. `dark` is the accent lifted for dark backgrounds.
export const projects = [
  {
    id: "quadshield",
    word: "QuadShield",
    title: "Emergency Response & Incident Reporting",
    client: "Government · Philippine National Police",
    summary: "An SOS call with live location, from a citizen's phone to the officer on duty.",
    line: "Emergency reporting and police dispatch for Infanta, Quezon, live across 36 barangays: SOS calls over LiveKit, live caller tracking and an ESP32 panic button.",
    accent: "#2C4F8C",
    tint: "#EDF1F7",
    dark: "#86A6E3",
    technologies: ["React", "TypeScript", "Laravel", "Flutter", "LiveKit", "Reverb", "ESP32", "Arduino"],
    press: "As seen on TV and in print",
    localName: "Sumbungan App",
  },
  {
    id: "dalago",
    word: "DalaGO",
    title: "Food Delivery Platform",
    client: "Business · Infanta, Quezon",
    summary: "Food delivery for a whole town, with apps for customers, merchants, riders and admins.",
    line: "Three Flutter apps from one monorepo for customers, merchants and riders, with a React console, server-priced delivery fees and timed rider offers.",
    accent: "#5A8933",
    tint: "#F1F5EA",
    dark: "#9FCC72",
    technologies: ["Flutter", "React", "TypeScript", "Laravel", "MySQL", "MapLibre", "Docker"],
  },
  {
    id: "streams",
    word: "STREAMS",
    title: "Systems Engineer Platform",
    client: "Enterprise · MEC Networks Corporation",
    summary: "Field service, cases and engineer scheduling, from support case to signed report.",
    line: "MEC's field service platform, co-developed by three: job orders, live engineer tracking, signed site reports, 11 role types and four synced systems.",
    accent: "#1F5FD6",
    tint: "#EEF3FC",
    dark: "#7FA9F5",
    technologies: ["Laravel", "React", "TypeScript", "Flutter", "Reverb", "Redis", "MapLibre", "Docker"],
  },
  {
    id: "silkhub",
    word: "SilkHub",
    title: "The Silk Residences Portal",
    client: "Business · The Silk Residences",
    summary: "A building services portal that replaces a condominium's paper logbooks.",
    line: "Lobby QR registration, a live guard queue with 400 numbered visitor tags, and guest pre-registration up to 30 days ahead.",
    accent: "#7A2A1C",
    tint: "#F6EEE8",
    dark: "#E0907C",
    technologies: ["React", "TypeScript", "Laravel", "Sanctum", "MySQL", "Tailwind CSS", "Docker"],
  },
  {
    id: "waste",
    word: "Waste Management",
    title: "Waste Disposal Management and Information System",
    client: "Government · City of Manila",
    summary: "Waste monitoring and AI-planned collection for the City of Manila.",
    line: "Waste monitoring for Manila's Department of Environment and Public Services, with weather-aware AI collection strategies.",
    accent: "#3A7650",
    tint: "#EDF5EF",
    dark: "#80C69A",
    technologies: ["React", "Node.js", "MongoDB", "AI Integration", "Express.js"],
  },
  {
    id: "afprotrack",
    word: "AFProTrack",
    title: "Training Management System",
    client: "Government · Armed Forces of the Philippines",
    summary: "Trainee tracking and AI readiness recommendations for the Armed Forces.",
    line: "Personnel and trainee tracking for the Armed Forces, with AI readiness analysis and targeted training recommendations.",
    accent: "#5A6A34",
    tint: "#F1F1EA",
    dark: "#B6C483",
    technologies: ["React", "Node.js", "AI Integration", "Express.js"],
  },
  {
    id: "bodyart",
    word: "Body Art",
    title: "Massage Clinic — Website and Bookings",
    client: "Business · Massage clinic",
    summary: "A calm website with online booking and an admin back office.",
    line: "Website, online booking and admin back office for a DOH-licensed, TESDA-certified massage clinic.",
    accent: "#A85E22",
    tint: "#F8EFE6",
    dark: "#EBA46A",
    technologies: ["React", "TypeScript", "Laravel", "Tailwind CSS", "TanStack Query"],
  },
];

export const articles = [
  {
    outlet: "Pilipino Star Ngayon",
    title: "‘Sumbungan app’ ng Infanta Police inilunsad",
    url: "https://www.philstar.com/pilipino-star-ngayon/probinsiya/2026/09/01/2553184/sumbungan-app-ng-infanta-police-inilunsad",
  },
  {
    outlet: "Sentinel Times",
    title: "GPS-based Sumbungan App launched for faster police, emergency response in Infanta",
    url: "https://www.sentineltimes.net/2026/09/gps-based-sumbungan-app-launched-for.html",
  },
];

export const facts = [
  { label: "Role", value: "Full-Stack Software Engineer" },
  { label: "Based in", value: "Manila, Philippines" },
  { label: "Main stack", value: "React, Flutter, TypeScript, Node.js, Laravel, Express.js" },
  { label: "Currently building", value: "Web, mobile, IoT and AI-integrated systems" },
];

export const builtFor = [
  { title: "Government", text: "Emergency response, environmental services and training systems for public agencies." },
  { title: "Enterprise", text: "Internal platforms, ticketing and the consolidation of legacy systems." },
  { title: "Business clients", text: "Delivery platforms and custom web, mobile and IoT products." },
];

export const currently = "Building at Quadsync Technologies and MEC Networks.";

// One stat per principle, the first of each in the portfolio.
export const principles = [
  {
    line: "Understand the problem before writing the code.",
    from: "From consolidating legacy systems to designing workflows.",
    value: "4 → 1",
    label: "legacy systems merged into one enterprise platform at MEC",
  },
  {
    line: "Build for the person on the other end.",
    from: "From employee ticketing to emergency response.",
    value: "~300",
    label: "employees using MEC's company-wide ticketing system",
  },
  {
    line: "Make it cheap to run and easy to keep.",
    from: "From API optimization to maintainable system design.",
    value: "99.4%",
    label: "lower AI API costs on the ticketing system",
  },
  {
    line: "Write code a teammate can follow.",
    from: "From enterprise platforms to multi-role applications.",
    value: "3",
    label: "engineers co-developing STREAMS in one codebase",
  },
];

export const tools = ["Git", "GitHub", "Docker", "Postman", "Figma", "XAMPP"];

// Oldest first. `start`/`end` are fractional years; no `end` means ongoing.
export const experiences = [
  {
    title: "BS Information Technology",
    company: "National University — Manila",
    short: "NU Manila",
    period: "2022 — 2026",
    lane: "study",
    start: 2022.6,
    end: 2026.4,
    headline: "Dean's Lister throughout, GWA 3.5 / 4.0",
    technologies: ["React", "JavaScript", "MySQL", "MongoDB", "Express.js", "Node.js"],
  },
  {
    title: "Freelance Full-Stack Developer",
    company: "AFProTrack — Armed Forces of the Philippines",
    short: "AFProTrack",
    period: "May 2025 — Aug 2025",
    lane: "work",
    start: 2025.33,
    end: 2025.67,
    headline: "AI readiness recommendations for Armed Forces training",
    technologies: ["React", "Node.js", "AI Integration", "Prompt Engineering", "Express.js", "MongoDB"],
  },
  {
    title: "Full-Stack Software Engineer",
    company: "MEC Networks Corporation",
    short: "MEC Networks",
    period: "Nov 2025 — Present",
    lane: "work",
    start: 2025.83,
    headline: "Cut AI costs by ~99.4% for a 300-person ticketing system",
    technologies: ["REST APIs", "MySQL", "AI Integration", "Prompt Engineering", "Laravel", "React", "TypeScript"],
  },
  {
    title: "Co-Founder & Lead Software Engineer",
    company: "Quadsync Technologies",
    short: "Quadsync",
    period: "May 2026 — Present",
    lane: "founder",
    start: 2026.33,
    headline: "Co-founded a studio shipping web, mobile and IoT for clients",
    technologies: ["React", "Flutter", "Node.js", "IoT", "ESP32", "Laravel", "MySQL", "TypeScript"],
  },
];

export const lanes = [
  { key: "study", label: "Study" },
  { key: "work", label: "Work" },
  { key: "founder", label: "Founder" },
];

// The full project technology lists, for "Most used" and the A–Z stack, exactly as the portfolio counts them.
export const projectTechnologies = [
  ["React", "TypeScript", "Laravel", "Flutter", "LiveKit", "Reverb", "ESP32", "Arduino"],
  ["Flutter", "React", "TypeScript", "Laravel", "MySQL", "MapLibre", "Docker"],
  ["Laravel", "React", "TypeScript", "Flutter", "Reverb", "Redis", "MapLibre", "Docker"],
  ["React", "TypeScript", "Laravel", "Sanctum", "MySQL", "Tailwind CSS", "Docker"],
  ["React", "Node.js", "MongoDB", "AI Integration", "Prescriptive Analytics", "Prompt Engineering", "Express.js"],
  ["React", "Node.js", "AI Integration", "Prompt Engineering", "Express.js"],
  ["React", "TypeScript", "Laravel", "Tailwind CSS", "TanStack Query"],
];
