export type ResearchLanguage = "en" | "te";

export interface ResearchTranslations {
  // Page Header
  pageTitle: string;
  pageSubtitle: string;
  badgeEngine: string;
  badgeGrounding: string;
  syncBtn: string;
  newWorkspaceBtn: string;

  // Starter Workspaces Ribbon
  starterRibbonTitle: string;
  starterRibbonSubtitle: string;

  // Workspaces Sidebar
  workspacesTitle: string;
  academicLabs: string;
  loadingWorkspaces: string;
  noWorkspaces: string;
  noWorkspacesDesc: string;
  createWorkspaceSmall: string;
  curated: string;
  sourcesCount: string;

  // Best Practices Card
  bestPracticesTitle: string;
  bestPractice1: string;
  bestPractice2: string;
  bestPractice3: string;

  // Workspace Main Header
  authorizedRepo: string;
  authorizedSources: string;
  inspectSubtitle: string;
  loadingSources: string;
  noSources: string;
  inspect: string;

  // Studio Synthesizer Modes
  studioTitle: string;
  studioSubtitle: string;
  modes: {
    literature_matrix: { name: string; desc: string; badge: string };
    thesis_defense: { name: string; desc: string; badge: string };
    bibtex_citations: { name: string; desc: string; badge: string };
    methodology: { name: string; desc: string; badge: string };
    podcast: { name: string; desc: string; badge: string };
    study_guide: { name: string; desc: string; badge: string };
    summary: { name: string; desc: string; badge: string };
    faq: { name: string; desc: string; badge: string };
  };

  // Custom Prompt Section
  customQueryTitle: string;
  pressEnter: string;
  customQueryPlaceholder: string;
  synthesizeBtn: string;
  quickPromptsLabel: string;
  quickPrompts: string[];

  // In-Progress Loading
  synthesisLoadingTitle: string;
  synthesisLoadingDesc: string;

  // Result Actions & Export
  modeLabel: string;
  completedAt: string;
  copy: string;
  copied: string;
  copyBibtex: string;
  bibtexCopied: string;
  downloadLatex: string;
  downloadMarkdown: string;

  // Podcast Player
  audioPlayerTitle: string;
  audioPlayerSubtitle: string;
  speaking: string;
  listen: string;
  pause: string;

  // Evidence Telemetry
  telemetryTitle: string;
  telemetryConfidence: string;
  sourcesGrounded: string;
  citationsGrounded: string;
  synthesisModel: string;
  hallucinationFilter: string;
  enforced: string;

  // Empty State
  selectOrCreateTitle: string;
  selectOrCreateDesc: string;
  createFirstWorkspace: string;

  // Source Inspector Modal
  inspectorTitle: string;
  verifiedBadge: string;
  docId: string;
  ingestionStatus: string;
  staleDetection: string;
  upToDate: string;
  stale: string;
  excerptLabel: string;
  closeInspector: string;

  // Create Workspace Modal
  modalTitle: string;
  modalDesc: string;
  wsTitleLabel: string;
  wsTitlePlaceholder: string;
  wsDescLabel: string;
  wsDescPlaceholder: string;
  selectDocsLabel: string;
  rbacScoped: string;
  loadingDocs: string;
  noDocsFound: string;
  cancel: string;
  createSubmitBtn: string;
  creatingSubmitBtn: string;

  // Language Indicator
  languageName: string;
}

export const RESEARCH_TRANSLATIONS: Record<ResearchLanguage, ResearchTranslations> = {
  en: {
    pageTitle: "Advanced Academic Research Workspace",
    pageSubtitle:
      "Cross-document scientific synthesis, Literature matrices, Viva Voce thesis defense simulator, and BibTeX citation export.",
    badgeEngine: "Gemini 2.5 Flash / Graph RAG",
    badgeGrounding: "Verifiable Grounding Active",
    syncBtn: "Sync",
    newWorkspaceBtn: "New Research Workspace",

    starterRibbonTitle: "Curated Departmental Research Workspaces (Instant 1-Click Launch)",
    starterRibbonSubtitle: "Pre-loaded with authorized technical papers & IEEE formats",

    workspacesTitle: "Workspaces",
    academicLabs: "Academic Labs",
    loadingWorkspaces: "Loading research workspaces...",
    noWorkspaces: "No custom workspaces yet",
    noWorkspacesDesc: "Select a curated workspace above or create a new one.",
    createWorkspaceSmall: "Create Workspace",
    curated: "Curated",
    sourcesCount: "sources",

    bestPracticesTitle: "Research Lab Best Practices",
    bestPractice1: "Use Literature Matrix for your capstone literature review chapter.",
    bestPractice2: "Run the Thesis Defense Simulator to test viva voce preparedness.",
    bestPractice3: "Directly copy BibTeX records for IEEE LaTeX templates.",

    authorizedRepo: "Authorized Repository",
    authorizedSources: "Authorized Repository Sources",
    inspectSubtitle: "Click inspect to preview citations & excerpts",
    loadingSources: "Loading authorized sources...",
    noSources: "No sources attached to this workspace.",
    inspect: "Inspect",

    studioTitle: "Scientific Research Studio (8 Multi-Doc Synthesizers)",
    studioSubtitle: "1-Click Deep Synthesis",
    modes: {
      literature_matrix: {
        name: "Literature Matrix",
        desc: "Cross-paper grid & gaps",
        badge: "Systematic Review",
      },
      thesis_defense: {
        name: "Thesis Defense",
        desc: "Viva voce simulator",
        badge: "Viva Exam",
      },
      bibtex_citations: {
        name: "BibTeX Citations",
        desc: "IEEE, ACM & .bib",
        badge: "Exportable",
      },
      methodology: {
        name: "Methodology & Math",
        desc: "LaTeX equations & algo",
        badge: "Formal Algo",
      },
      podcast: {
        name: "Deep Dive Audio",
        desc: "2-Host podcast player",
        badge: "Interactive Voice",
      },
      study_guide: {
        name: "Study Guide",
        desc: "Concept breakdown & quiz",
        badge: "Exam Ready",
      },
      summary: {
        name: "Executive Summary",
        desc: "Cross-doc synthesis",
        badge: "Highlights",
      },
      faq: {
        name: "Evidence FAQ",
        desc: "Direct Q&A with citations",
        badge: "Citations",
      },
    },

    customQueryTitle: "Custom Scientific Research Query",
    pressEnter: "Press Enter to synthesize",
    customQueryPlaceholder: "e.g. Compare algorithmic time complexity and failure modes across these papers...",
    synthesizeBtn: "Synthesize",
    quickPromptsLabel: "Quick Prompts:",
    quickPrompts: [
      "Compare algorithmic time & space complexities",
      "Identify open research gaps for a student thesis",
      "Summarize quantitative benchmark results into a table",
      "What are the primary failure edge cases?",
    ],

    synthesisLoadingTitle: "Performing Multi-Document Scientific Synthesis...",
    synthesisLoadingDesc:
      "Gemini 2.5 Flash is analyzing authorized documents with verifiable token-level grounding and LaTeX mathematical formulation.",

    modeLabel: "Mode:",
    completedAt: "Completed at",
    copy: "Copy",
    copied: "Copied",
    copyBibtex: "Copy BibTeX",
    bibtexCopied: "BibTeX Copied",
    downloadLatex: "LaTeX (.tex)",
    downloadMarkdown: "Markdown (.md)",

    audioPlayerTitle: "Interactive Audio Deep Dive Player",
    audioPlayerSubtitle: "SpeechSynthesis audio simulation • Co-hosts Alex & Jordan",
    speaking: "Speaking:",
    listen: "Listen Aloud",
    pause: "Pause",

    telemetryTitle: "Evidence Grounding & Verification Telemetry",
    telemetryConfidence: "CONFIDENCE: 99.4% (VERIFIED)",
    sourcesGrounded: "Sources Grounded",
    citationsGrounded: "Citations Grounded",
    synthesisModel: "Synthesis Model",
    hallucinationFilter: "RAG Hallucination Filter",
    enforced: "Enforced",

    selectOrCreateTitle: "Select or Create a Research Workspace",
    selectOrCreateDesc:
      "Select a research workspace from the left panel or click one of the curated research labs above to begin literature matrix analysis, thesis defense simulations, and citation generation.",
    createFirstWorkspace: "Create Your First Workspace",

    inspectorTitle: "Authorized Repository Source Provenance",
    verifiedBadge: "VERIFIED",
    docId: "Document ID:",
    ingestionStatus: "Ingestion Status:",
    staleDetection: "Stale Detection:",
    upToDate: "Up-to-date (Synced)",
    stale: "Stale",
    excerptLabel: "Evidence Verification Excerpt:",
    closeInspector: "Close Inspector",

    modalTitle: "New Research Workspace",
    modalDesc: "Select authorized institutional documents to include in your research synthesis.",
    wsTitleLabel: "Workspace Title *",
    wsTitlePlaceholder: "e.g. CS401 AI Ethics & Deep Learning Research",
    wsDescLabel: "Description (Optional)",
    wsDescPlaceholder: "e.g. Cross-curriculum comparative analysis for Spring 2026",
    selectDocsLabel: "Select Authorized Documents",
    rbacScoped: "RBAC Department Scoped",
    loadingDocs: "Loading authorized documents...",
    noDocsFound: "No uploaded documents found. Please upload documents in the Knowledge Bases first.",
    cancel: "Cancel",
    createSubmitBtn: "Create Workspace",
    creatingSubmitBtn: "Creating Workspace...",

    languageName: "English",
  },

  te: {
    pageTitle: "అధునాతన అకడమిక్ రీసెర్చ్ వర్క్‌స్పేస్ (Research Workspace)",
    pageSubtitle:
      "బహుళ-పత్రాల శాస్త్రీయ విశ్లేషణ, సాహిత్య సమీక్ష మాత్రిక, వైవా వోస్ థీసిస్ డిఫెన్స్ సిమ్యులేటర్ మరియు బిబ్‌టెక్ సైటేషన్ల ఎగుమతి.",
    badgeEngine: "జెమిని 2.5 ఫ్లాష్ / గ్రాఫ్ RAG",
    badgeGrounding: "ధృవీకరించబడిన ఆధారాలు సిద్ధం",
    syncBtn: "సింక్ (Sync)",
    newWorkspaceBtn: "కొత్త రీసెర్చ్ వర్క్‌స్పేస్",

    starterRibbonTitle: "విభాగాల వారీగా క్యూరేటెడ్ పరిశోధనా కేంద్రాలు (తక్షణ 1-క్లిక్ లాంచ్)",
    starterRibbonSubtitle: "అధీకృత పరిశోధనా పత్రాలు & IEEE ఫార్మాట్‌లతో ముందుగానే సిద్ధం చేయబడింది",

    workspacesTitle: "పరిశోధనా కేంద్రాలు (Workspaces)",
    academicLabs: "అకడమిక్ ల్యాబ్స్",
    loadingWorkspaces: "పరిశోధనా కేంద్రాలు లోడ్ అవుతున్నాయి...",
    noWorkspaces: "ఇంకా కస్టమ్ వర్క్‌స్పేస్‌లు లేవు",
    noWorkspacesDesc: "పైనున్న క్యూరేటెడ్ వర్క్‌స్పేస్‌ను ఎంచుకోండి లేదా కొత్త వర్క్‌స్పేస్‌ను సృష్టించండి.",
    createWorkspaceSmall: "వర్క్‌స్పేస్ సృష్టించు",
    curated: "క్యూరేటెడ్",
    sourcesCount: "మూల పత్రాలు",

    bestPracticesTitle: "పరిశోధనా చిట్కాలు & ఉత్తమ విధానాలు",
    bestPractice1: "మీ ప్రాజెక్ట్ సమీక్ష అధ్యాయం కోసం సాహిత్య సమీక్ష మాత్రిక (Literature Matrix) ను ఉపయోగించండి.",
    bestPractice2: "వైవా వోస్ సన్నద్ధతను పరీక్షించడానికి థీసిస్ డిఫెన్స్ సిమ్యులేటర్‌ను ప్రారంభించండి.",
    bestPractice3: "IEEE లేటెక్స్ (LaTeX) ఫార్మాట్ల కోసం బిబ్‌టెక్ రికార్డులను సులభంగా కాపీ చేయండి.",

    authorizedRepo: "అధీకృత రిపోజిటరీ",
    authorizedSources: "అధీకృత మూల పత్రాలు (Authorized Sources)",
    inspectSubtitle: "సైటేషన్లు మరియు ఆధారాలను పరిశీలించడానికి ఇన్‌స్పెక్ట్‌పై క్లిక్ చేయండి",
    loadingSources: "అధీకృత మూల పత్రాలు లోడ్ అవుతున్నాయి...",
    noSources: "ఈ వర్క్‌స్పేస్‌లో మూల పత్రాలు ఏవీ లేవు.",
    inspect: "పరిశీలించు",

    studioTitle: "శాస్త్రీయ పరిశోధనా స్టూడియో (8 బహుళ-పత్ర విశ్లేషణ సాధనాలు)",
    studioSubtitle: "ఒక్క క్లిక్‌తో లోతైన విశ్లేషణ (Deep Synthesis)",
    modes: {
      literature_matrix: {
        name: "సాహిత్య సమీక్ష మాత్రిక",
        desc: "పత్రాల పోలిక & అంతరాలు",
        badge: "వ్యవస్థీకృత సమీక్ష",
      },
      thesis_defense: {
        name: "థీసిస్ డిఫెన్స్",
        desc: "వైవా వోస్ సిమ్యులేటర్",
        badge: "వైవా పరీక్ష",
      },
      bibtex_citations: {
        name: "బిబ్‌టెక్ సైటేషన్లు",
        desc: "IEEE, ACM & .bib సూట్",
        badge: "ఎగుమతి సిద్ధం",
      },
      methodology: {
        name: "మెథడాలజీ & మ్యాథ్స్",
        desc: "లేటెక్స్ సమీకరణాలు & అల్గో",
        badge: "గణిత నమూనా",
      },
      podcast: {
        name: "ఆడియో డీప్ డైవ్",
        desc: "ఇద్దరు హోస్ట్‌ల సంభాషణ",
        badge: "వాయిస్ పాడ్‌కాస్ట్",
      },
      study_guide: {
        name: "స్టడీ గైడ్ & నోట్స్",
        desc: "కీలక భావనలు & క్విజ్",
        badge: "పరీక్షా సన్నద్ధత",
      },
      summary: {
        name: "ఎగ్జిక్యూటివ్ సారాంశం",
        desc: "బహుళ-పత్ర సంక్షిప్త సారాంశం",
        badge: "ముఖ్యాంశాలు",
      },
      faq: {
        name: "ఆధారిత FAQ",
        desc: "సైటేషన్లతో ప్రత్యక్ష Q&A",
        badge: "ధృవీకరించబడిన సమాధానాలు",
      },
    },

    customQueryTitle: "కస్టమ్ శాస్త్రీయ పరిశోధనా ప్రశ్న (Custom Query)",
    pressEnter: "విశ్లేషించడానికి Enter నొక్కండి",
    customQueryPlaceholder: "ఉదాహరణ: ఈ పరిశోధనా పత్రాల అల్గోరిథమిక్ పనితీరు మరియు సంక్లిష్టతను సరిపోల్చండి...",
    synthesizeBtn: "విశ్లేషించు (Synthesize)",
    quickPromptsLabel: "శీఘ్ర ప్రశ్నలు:",
    quickPrompts: [
      "అల్గోరిథమిక్ సమయ & స్పేస్ సంక్లిష్టతను సరిపోల్చండి",
      "స్టూడెంట్ థీసిస్ కోసం నూతన పరిశోధనా అంతరాలను గుర్తించండి",
      "పరిశోధనా ఫలితాలను పట్టిక రూపంలో సంగ్రహించండి",
      "సిస్టమ్ యొక్క ప్రధాన వైఫల్య అంచు కేసులు ఏమిటి?",
    ],

    synthesisLoadingTitle: "బహుళ-పత్ర శాస్త్రీయ విశ్లేషణ జరుగుతోంది...",
    synthesisLoadingDesc:
      "జెమిని 2.5 ఫ్లాష్ అధీకృత పత్రాలను విశ్లేషిస్తూ ఆధారాలతో కూడిన తెలుగు పరిశోధనా నివేదికను రూపొందిస్తోంది...",

    modeLabel: "విశ్లేషణ విధానం:",
    completedAt: "పూర్తయిన సమయం",
    copy: "కాపీ చేయి",
    copied: "కాపీ అయ్యింది",
    copyBibtex: "బిబ్‌టెక్ కాపీ చేయి",
    bibtexCopied: "బిబ్‌టెక్ కాపీ అయ్యింది",
    downloadLatex: "లేటెక్స్ (.tex)",
    downloadMarkdown: "మార్క్‌డౌన్ (.md)",

    audioPlayerTitle: "ఆడియో డీప్ డైవ్ ప్లేయర్ (Podcast Player)",
    audioPlayerSubtitle: "స్పీచ్ సింథసిస్ ఆడియో అనుకరణ • హోస్ట్‌లు అలెక్స్ & జోర్డాన్",
    speaking: "మాట్లాడుతున్నారు:",
    listen: "వినండి (Listen Aloud)",
    pause: "ఆపండి (Pause)",

    telemetryTitle: "ఆధారాల నిర్ధారణ & ధృవీకరణ టెలిమెట్రీ",
    telemetryConfidence: "విశ్వసనీయత: 99.4% (ధృవీకరించబడింది)",
    sourcesGrounded: "ధృవీకరించబడిన ఆధారాలు",
    citationsGrounded: "సైటేషన్లు",
    synthesisModel: "విశ్లేషణ మోడల్",
    hallucinationFilter: "హాలూసినేషన్ ఫిల్టర్",
    enforced: "అమలులో ఉంది",

    selectOrCreateTitle: "పరిశోధనా వర్క్‌స్పేస్‌ను ఎంచుకోండి లేదా సృష్టించండి",
    selectOrCreateDesc:
      "ఎడమ వైపు ప్యానెల్ నుండి వర్క్‌స్పేస్‌ను ఎంచుకోండి లేదా పైన ఉన్న క్యూరేటెడ్ పరిశోధనా విభాగాలలో ఒకదానిని క్లిక్ చేయడం ద్వారా సాహిత్య సమీక్ష, వైవా వోస్ మరియు సైటేషన్ల విశ్లేషణను ప్రారంభించండి.",
    createFirstWorkspace: "మొదటి వర్క్‌స్పేస్‌ను సృష్టించండి",

    inspectorTitle: "అధీకృత మూల పత్రం వివరాలు & ఆధారం",
    verifiedBadge: "ధృవీకరించబడింది",
    docId: "డాక్యుమెంట్ ID:",
    ingestionStatus: "ఇండెక్సింగ్ స్థితి:",
    staleDetection: "అప్‌డేట్ స్థితి:",
    upToDate: "తాజాది (సింక్ చేయబడింది)",
    stale: "పాతది (సింక్ అవసరం)",
    excerptLabel: "ఆధారాల ధృవీకరణ సారాంశం:",
    closeInspector: "ముగించు (Close)",

    modalTitle: "కొత్త రీసెర్చ్ వర్క్‌స్పేస్ (New Workspace)",
    modalDesc: "మీ పరిశోధనలో చేర్చడానికి అధీకృత సంస్థాగత పత్రాలను ఎంచుకోండి.",
    wsTitleLabel: "వర్క్‌స్పేస్ శీర్షిక *",
    wsTitlePlaceholder: "ఉదా: CS401 AI రీసెర్చ్ & డీప్ లెర్నింగ్ ప్రాజెక్ట్",
    wsDescLabel: "వివరణ (ఐచ్ఛికం)",
    wsDescPlaceholder: "ఉదా: 2026 సెమిస్టర్ పరిశోధనా పత్రాల తులనాత్మక అధ్యయనం",
    selectDocsLabel: "అధీకృత పత్రాలను ఎంచుకోండి",
    rbacScoped: "విభాగ నిబంధనల పరిధి",
    loadingDocs: "అధీకృత పత్రాలు లోడ్ అవుతున్నాయి...",
    noDocsFound: "అప్‌లోడ్ చేసిన పత్రాలు ఏవీ కనుగొనబడలేదు. దయచేసి ముందుగా నాలెడ్జ్ బేస్‌లో పత్రాలను అప్‌లోడ్ చేయండి.",
    cancel: "రద్దు చేయి (Cancel)",
    createSubmitBtn: "వర్క్‌స్పేస్ సృష్టించు",
    creatingSubmitBtn: "సృష్టిస్తోంది...",

    languageName: "తెలుగు",
  },
};
