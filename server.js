import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Database for Prototype
let pendingDiffs = [
  {
    id: 1,
    selected: true,
    oldName: "IMG_0029_unnamed.png",
    newName: "PCCE_Semester_Timetable_2026.png",
    sourcePath: "/Downloads/",
    targetPath: "/Documents/Academic/",
    reason: "AI OCR recognized campus semester schedule matrix with courses CS401 & CS404",
    size: "4.2 MB",
    type: "image",
    applied: false
  },
  {
    id: 2,
    selected: true,
    oldName: "scan_04812_receipt.pdf",
    newName: "Form_16_Tax_Assessment_FY2025.pdf",
    sourcePath: "/Downloads/",
    targetPath: "/Documents/Financial/",
    reason: "Presidio local scanner identified PAN card entity & Income Tax Department header",
    size: "1.1 MB",
    type: "pdf",
    applied: false
  },
  {
    id: 3,
    selected: true,
    oldName: "temp_rec_491_h264.mp4",
    newName: "Hackathon_Demo_Walkthrough.mp4",
    sourcePath: "/Videos/Captures/",
    targetPath: "/Videos/Hackathon2026/",
    reason: "Deep audio transcription identified 'Kosha local intelligence demo presentation'",
    size: "340 MB",
    type: "video",
    applied: false
  },
  {
    id: 4,
    selected: true,
    oldName: "untitled_notes_final_v2.txt",
    newName: "Distributed_Systems_Exam_Revision.txt",
    sourcePath: "/Desktop/",
    targetPath: "/Documents/Study/",
    reason: "Semantic NLP extracted Raft consensus algorithm, Byzantine faults, & vector clocks",
    size: "38 KB",
    type: "text",
    applied: false
  }
];

let storageState = {
  usedGB: 20.5,
  totalGB: 80.0,
  reclaimableGB: 8.2,
  status: "Optimizable",
  categories: [
    { name: "Large Media (4K Videos)", sizeGB: 5.4, count: 12, color: "#ec4899" },
    { name: "Personal Assets", sizeGB: 3.8, count: 140, color: "#8b5cf6" },
    { name: "Documents & Notes", sizeGB: 3.1, count: 820, color: "#10b981" },
    { name: "System Bloat & Caches", sizeGB: 8.2, count: 4, color: "#f43f5e", isBloat: true }
  ]
};

const mockFiles = [
  {
    id: 101,
    name: "Semester_6_Syllabus_2026.pdf",
    format: "PDF Document",
    path: "/Documents/Academic/",
    mount: "NVMe C:\\",
    snippet: "Advanced distributed algorithms syllabus, Course Prof. Sharma, exam weightage 40% midterm, 60% final project.",
    size: "2.4 MB",
    sizeBytes: 2516582,
    modified: "Yesterday, 4:12 PM",
    privacy: "Air-Gapped",
    privacyStatus: "verified",
    category: "academic",
    isDotfile: false
  },
  {
    id: 102,
    name: "invoice_AWS_Cloud_Oct2026.pdf",
    format: "PDF Invoice",
    path: "smb://192.168.1.100/finance/",
    mount: "SMB v3 Share",
    snippet: "AWS billing summary for enterprise cluster: $1,420.40 USD. Account ID: *masked*. VAT ID: *masked*.",
    size: "620 KB",
    sizeBytes: 634880,
    modified: "Oct 12, 2026",
    privacy: "2 PII Masked",
    privacyStatus: "masked",
    category: "invoices",
    isDotfile: false
  },
  {
    id: 103,
    name: "Screen_Recording_4K_Hackathon_Pitch.mov",
    format: "ProRes 4K Video",
    path: "/Videos/Captures/",
    mount: "NVMe C:\\",
    snippet: "High-bitrate screen recording of live terminal execution, zero packet loss, 3840x2160 @ 60 FPS.",
    size: "5.4 GB",
    sizeBytes: 5798205849,
    modified: "Oct 14, 2026",
    privacy: "Local Only",
    privacyStatus: "local",
    category: "media",
    isDotfile: false
  },
  {
    id: 104,
    name: "stale_node_modules_archive.tar.gz",
    format: "GZip Archive",
    path: "/Projects/Legacy2025/",
    mount: "NVMe C:\\",
    snippet: "Node.js dependency tree with 14,200 dangling dependencies and nested compilation artifacts from 2025.",
    size: "8.2 GB",
    sizeBytes: 8804682956,
    modified: "Aug 19, 2025",
    privacy: "Reclaimable",
    privacyStatus: "bloat",
    category: "bloat",
    isDotfile: false
  },
  {
    id: 105,
    name: ".env.production",
    format: "Secret Config",
    path: "/Projects/KoshaCore/",
    mount: "NVMe C:\\",
    snippet: "Contains JWT_SECRET, SUPABASE_SERVICE_ROLE, and AWS_S3_KEY. 3 API keys masked locally via Presidio NER.",
    size: "1.2 KB",
    sizeBytes: 1228,
    modified: "Today, 9:30 AM",
    privacy: "3 PII Redacted",
    privacyStatus: "critical",
    category: "secrets",
    isDotfile: true
  },
  {
    id: 106,
    name: ".zshrc_env_aliases",
    format: "Shell Script",
    path: "/Users/aryaan/",
    mount: "NVMe C:\\",
    snippet: "Custom shell environment variables, custom PATH exports, and local Docker alias commands.",
    size: "3.4 KB",
    sizeBytes: 3481,
    modified: "Sep 28, 2026",
    privacy: "Air-Gapped",
    privacyStatus: "verified",
    category: "all",
    isDotfile: true
  }
];

// 1. GET /api/search?q=...&showDotfiles=...
app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  const showDotfiles = req.query.showDotfiles === 'true';

  let results = mockFiles.filter(file => {
    if (file.isDotfile && !showDotfiles) return false;
    if (!query) return true;

    return (
      file.name.toLowerCase().includes(query) ||
      file.snippet.toLowerCase().includes(query) ||
      file.path.toLowerCase().includes(query) ||
      file.category.toLowerCase().includes(query) ||
      file.mount.toLowerCase().includes(query)
    );
  });

  res.json({
    success: true,
    count: results.length,
    latencyMs: 1.2,
    engine: "Air-Gapped Presidio NER",
    results
  });
});

// 2. POST /api/privacy/redact
app.post('/api/privacy/redact', (req, res) => {
  const { text = "" } = req.body;

  let sanitized = text;
  let entitiesFound = 0;

  // Mask Emails
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  sanitized = sanitized.replace(emailRegex, () => {
    entitiesFound++;
    return '<EMAIL_MASKED>';
  });

  // Mask Phone numbers
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,5}/g;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    if (match.length >= 7) {
      entitiesFound++;
      return '<PHONE_HASH>';
    }
    return match;
  });

  // Mask Tax PAN / SSN / Student IDs
  const taxPanRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
  sanitized = sanitized.replace(taxPanRegex, () => {
    entitiesFound++;
    return '<TAX_ID_REDACTED>';
  });

  // Mask API Keys & Secrets
  const secretRegex = /(sk-[a-zA-Z0-9_-]{12,}|ghp_[a-zA-Z0-9]{12,}|postgres:\/\/[^"'\s]+)/g;
  sanitized = sanitized.replace(secretRegex, () => {
    entitiesFound++;
    return '<DEV_SECRET_REDACTED>';
  });

  // Mask Names in sample texts
  const names = ["Aryan Achuthan", "Aryan", "John Doe", "Prof. Sharma"];
  names.forEach(name => {
    if (sanitized.includes(name)) {
      sanitized = sanitized.split(name).join('<PERSON_1>');
      entitiesFound++;
    }
  });

  res.json({
    success: true,
    rawText: text,
    sanitizedText: sanitized,
    entitiesFound,
    leakageBytes: "0.00 Bytes",
    leakagePercent: "0.00%",
    latencyMs: 0.38,
    isAirGapped: true
  });
});

// 3. GET /api/organize/diffs
app.get('/api/organize/diffs', (req, res) => {
  const activeDiffs = pendingDiffs.filter(d => !d.applied);
  const healthPercent = activeDiffs.length === 0 ? 100 : Math.round(((4 - activeDiffs.length) / 4) * 100);

  res.json({
    success: true,
    diffs: activeDiffs,
    healthPercent,
    pendingCount: activeDiffs.length
  });
});

// 4. POST /api/organize/apply
app.post('/api/organize/apply', (req, res) => {
  const { ids = [] } = req.body;

  let appliedCount = 0;
  pendingDiffs.forEach(diff => {
    if (ids.length === 0 || ids.includes(diff.id)) {
      diff.applied = true;
      appliedCount++;
    }
  });

  const remaining = pendingDiffs.filter(d => !d.applied).length;
  const newHealth = remaining === 0 ? 100 : Math.round(((4 - remaining) / 4) * 100);

  res.json({
    success: true,
    appliedCount,
    remainingCount: remaining,
    healthPercent: newHealth,
    message: `Applied ${appliedCount} reorganization diffs atomically.`
  });
});

// 5. GET /api/storage/overview
app.get('/api/storage/overview', (req, res) => {
  res.json({
    success: true,
    ...storageState
  });
});

// 6. POST /api/storage/reclaim
app.post('/api/storage/reclaim', (req, res) => {
  if (storageState.reclaimableGB > 0) {
    const reclaimed = storageState.reclaimableGB;
    storageState.usedGB = parseFloat((storageState.usedGB - reclaimed).toFixed(1));
    storageState.reclaimableGB = 0;
    storageState.status = "Drive Cleaned";
    storageState.categories = storageState.categories.filter(c => !c.isBloat);

    return res.json({
      success: true,
      reclaimedGB: reclaimed,
      currentUsedGB: storageState.usedGB,
      message: `Reclaimed ${reclaimed} GB of stale media and system bloat.`
    });
  }

  res.json({
    success: true,
    reclaimedGB: 0,
    currentUsedGB: storageState.usedGB,
    message: "Drive is already fully optimized."
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    app: "Kosha Local Intelligence Backend",
    version: "2.6.0-airgapped"
  });
});

app.listen(PORT, () => {
  console.log(`[Kosha Engine] Server running at http://localhost:${PORT}`);
});
