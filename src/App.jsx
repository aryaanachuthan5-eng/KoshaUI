import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShieldCheck,
  HardDrive,
  Server,
  Wand2,
  Cpu,
  Maximize2,
  Sun,
  Moon,
  FileText,
  Video,
  Archive,
  Key,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Sliders,
  Eye,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Lock,
  RefreshCw,
  AlertTriangle,
  Layers,
  FolderOpen,
  Network,
  Zap,
  Activity
} from 'lucide-react';

export default function App() {
  // Theme State (Dark / Light)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Active View ('dashboard' | 'explore')
  const [activeTab, setActiveTab] = useState('dashboard');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showDotfiles, setShowDotfiles] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Storage State
  const [storageData, setStorageData] = useState({
    usedGB: 20.5,
    totalGB: 80.0,
    reclaimableGB: 8.2,
    status: 'Optimizable',
    categories: [
      { name: 'Large Media (4K Videos)', sizeGB: 5.4, count: 12, color: '#ec4899' },
      { name: 'Personal Assets', sizeGB: 3.8, count: 140, color: '#8b5cf6' },
      { name: 'Documents & Notes', sizeGB: 3.1, count: 820, color: '#10b981' },
      { name: 'System Bloat & Caches', sizeGB: 8.2, count: 4, color: '#f43f5e', isBloat: true }
    ]
  });

  // Organization Diffs State
  const [diffs, setDiffs] = useState([
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
  ]);

  // Files Database
  const [files, setFiles] = useState([
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
      isDotfile: false,
      type: "pdf"
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
      isDotfile: false,
      type: "invoice"
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
      isDotfile: false,
      type: "video"
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
      isDotfile: false,
      type: "archive"
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
      isDotfile: true,
      type: "secret"
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
      isDotfile: true,
      type: "script"
    }
  ]);

  // Modal Visibility States
  const [isRedactionModalOpen, setIsRedactionModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isMountModalOpen, setIsMountModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Presidio Redaction State
  const [activeSampleKey, setActiveSampleKey] = useState('financial');
  const [redactionResult, setRedactionResult] = useState({
    rawText: `ACCOUNT STATEMENT - Q3 2026\nAccount Holder: Aryan Achuthan\nTax Identification (PAN): ABCPA1234F\nAccount Number: 9812-4412-8801\nPhone: +91 98231 44512\nClosing Balance: INR 452,190.50\nBranch: Panaji Main Branch, Goa`,
    sanitizedText: `ACCOUNT STATEMENT - Q3 2026\nAccount Holder: <PERSON_1>\nTax Identification (PAN): <TAX_ID_REDACTED>\nAccount Number: <ACCOUNT_HASH_8801>\nPhone: <PHONE_HASH>\nClosing Balance: INR 452,190.50\nBranch: Panaji Main Branch, Goa`,
    entitiesFound: 4,
    leakageBytes: "0.00 Bytes",
    latencyMs: 0.38
  });

  // Network Mount State
  const [mountProtocol, setMountProtocol] = useState('SMB');
  const [mountUri, setMountUri] = useState('smb://192.168.1.150/backups');
  const [networkShares, setNetworkShares] = useState([
    { uri: 'smb://192.168.1.100', protocol: 'SMB v3', speed: '10GbE NAS', status: 'online', latency: '0.8ms' }
  ]);

  // Real-time Telemetry
  const [ramUsage, setRamUsage] = useState(118);

  // Toast Notification System
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Keyboard Shortcuts (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      if (e.key === 'Escape') {
        setIsRedactionModalOpen(false);
        setIsDiffModalOpen(false);
        setIsMountModalOpen(false);
        setPreviewFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Jitter RAM Telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setRamUsage(118 + Math.floor(Math.random() * 5) - 2);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Theme Toggle Effect
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDarkMode]);

  // Fetch initial data from server if available
  useEffect(() => {
    fetch('/api/storage/overview')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStorageData({
            usedGB: data.usedGB,
            totalGB: data.totalGB,
            reclaimableGB: data.reclaimableGB,
            status: data.status,
            categories: data.categories
          });
        }
      })
      .catch(() => {
        // Fallback gracefully to default client state
      });
  }, []);

  // Handle Redaction Sample Change
  const handleSampleSwitch = async (key) => {
    setActiveSampleKey(key);
    let sampleRaw = '';
    if (key === 'financial') {
      sampleRaw = `ACCOUNT STATEMENT - Q3 2026\nAccount Holder: Aryan Achuthan\nTax Identification (PAN): ABCPA1234F\nAccount Number: 9812-4412-8801\nPhone: +91 98231 44512\nClosing Balance: INR 452,190.50\nBranch: Panaji Main Branch, Goa`;
    } else if (key === 'academic') {
      sampleRaw = `DON BOSCO COLLEGE OF ENGINEERING\nStudent Name: Aryan Achuthan\nRoll No: 22CS014\nEmail: aryaanachuthan5@gmail.com\nGPA: 9.42 / 10.0\nRemarks: Eligible for National Hackathon Participation`;
    } else if (key === 'secrets') {
      sampleRaw = `# ENVIRONMENT SECRETS\nOPENAI_API_KEY="sk-proj-94819a0bc4194fbe8812"\nDATABASE_URL="postgres://admin:SuperSecretP@ss@192.168.1.100:5432/kosha"\nJWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk..."`;
    }

    try {
      const res = await fetch('/api/privacy/redact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleRaw })
      });
      const data = await res.json();
      if (data.success) {
        setRedactionResult({
          rawText: data.rawText,
          sanitizedText: data.sanitizedText,
          entitiesFound: data.entitiesFound,
          leakageBytes: data.leakageBytes,
          latencyMs: data.latencyMs
        });
        return;
      }
    } catch {
      // Local fallback redaction logic
    }

    // Fallback regex masking
    let sanitized = sampleRaw
      .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<EMAIL_MASKED>')
      .replace(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,5}/g, '<PHONE_HASH>')
      .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, '<TAX_ID_REDACTED>')
      .replace(/(sk-[a-zA-Z0-9_-]{12,}|postgres:\/\/[^"'\s]+)/g, '<DEV_SECRET_REDACTED>')
      .split('Aryan Achuthan').join('<PERSON_1>');

    setRedactionResult({
      rawText: sampleRaw,
      sanitizedText: sanitized,
      entitiesFound: 4,
      leakageBytes: "0.00 Bytes",
      latencyMs: 0.38
    });
  };

  // Reclaim Bloat Storage Action
  const handleReclaimStorage = async () => {
    if (storageData.reclaimableGB <= 0) {
      showToast('Drive is already fully optimized! 0 bytes reclaimable.', 'info');
      return;
    }

    try {
      const res = await fetch('/api/storage/reclaim', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStorageData(prev => ({
          ...prev,
          usedGB: data.currentUsedGB,
          reclaimableGB: 0,
          status: 'Drive Cleaned',
          categories: prev.categories.filter(c => !c.isBloat)
        }));
        setFiles(prev => prev.filter(f => f.category !== 'bloat'));
        showToast(`Reclaimed ${data.reclaimedGB} GB of stale media and system bloat!`, 'success');
        return;
      }
    } catch {
      // Fallback local update
    }

    const reclaimed = storageData.reclaimableGB;
    setStorageData(prev => ({
      ...prev,
      usedGB: parseFloat((prev.usedGB - reclaimed).toFixed(1)),
      reclaimableGB: 0,
      status: 'Drive Cleaned',
      categories: prev.categories.filter(c => !c.isBloat)
    }));
    setFiles(prev => prev.filter(f => f.category !== 'bloat'));
    showToast(`Reclaimed ${reclaimed} GB of stale media and system bloat!`, 'success');
  };

  // Toggle Diff Selection
  const toggleDiffItem = (id) => {
    setDiffs(prev =>
      prev.map(d => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  // Apply Selected Diffs
  const handleApplyDiffs = async () => {
    const selected = diffs.filter(d => d.selected && !d.applied);
    if (selected.length === 0) {
      showToast('Please select at least one diff to apply.', 'warning');
      return;
    }

    try {
      await fetch('/api/organize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected.map(s => s.id) })
      });
    } catch {
      // Ignore network errors in local mock
    }

    // Append newly organized files to files table
    const newFiles = selected.map(s => ({
      id: Date.now() + Math.random(),
      name: s.newName,
      format: "Organized File",
      path: s.targetPath,
      mount: "NVMe C:\\",
      snippet: `Cleanly organized from ${s.oldName}. Justification: ${s.reason}`,
      size: s.size,
      sizeBytes: 1048576,
      modified: "Just now",
      privacy: "Air-Gapped",
      privacyStatus: "verified",
      category: "academic",
      isDotfile: false,
      type: s.type
    }));

    setFiles(prev => [...newFiles, ...prev]);
    setDiffs(prev => prev.map(d => (d.selected ? { ...d, applied: true } : d)));
    setIsDiffModalOpen(false);
    showToast(`Successfully renamed and routed ${selected.length} files atomically!`, 'success');
  };

  // Connect New Network Mount
  const handleConnectMount = () => {
    if (!mountUri.trim()) {
      showToast('Please provide a valid server share URI.', 'warning');
      return;
    }

    setNetworkShares(prev => [
      ...prev,
      {
        uri: mountUri.trim(),
        protocol: mountProtocol,
        speed: 'Gigabit LAN',
        status: 'online',
        latency: '1.4ms'
      }
    ]);
    setIsMountModalOpen(false);
    showToast(`Mounted ${mountUri} via ${mountProtocol}! Local indexing initialized.`, 'success');
  };

  // Filtered & Sorted Files
  const filteredFiles = useMemo(() => {
    return files
      .filter(file => {
        if (file.isDotfile && !showDotfiles) return false;
        if (activeFilter !== 'all' && file.category !== activeFilter) return false;

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = file.name.toLowerCase().includes(q);
          const matchSnippet = file.snippet.toLowerCase().includes(q);
          const matchPath = file.path.toLowerCase().includes(q);
          const matchCategory = file.category.toLowerCase().includes(q);
          if (!matchName && !matchSnippet && !matchPath && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'size') return b.sizeBytes - a.sizeBytes;
        if (sortBy === 'date') return a.name.localeCompare(b.name);
        return a.id - b.id;
      });
  }, [files, showDotfiles, activeFilter, searchQuery, sortBy]);

  // Storage Gauge Math
  const usedPercent = Math.round((storageData.usedGB / storageData.totalGB) * 100);
  const gaugeCircumference = 251.2;
  const gaugeOffset = gaugeCircumference * (1 - usedPercent / 100);

  // Active Pending Diffs Count & Health
  const pendingDiffsCount = diffs.filter(d => !d.applied).length;
  const healthScore = pendingDiffsCount === 0 ? 100 : Math.round(((4 - pendingDiffsCount) / 4) * 100);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0b0c10] text-slate-100' : 'bg-[#f4f6fa] text-slate-800'
    }`}>
      
      {/* =========================================================================
          TOP WINDOW BAR / APP CHROME (Requirement R1: Desktop Utility Mode)
         ========================================================================= */}
      <header className={`h-12 border-b flex items-center justify-between px-4 z-40 sticky top-0 backdrop-blur-md transition-colors ${
        isDarkMode ? 'bg-[#151926]/90 border-[rgba(255,255,255,0.08)]' : 'bg-white/90 border-slate-200'
      }`}>
        {/* Window Controls (Red, Amber, Green Dots) */}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 transition cursor-pointer" title="Close" />
          <div className="w-3 h-3 rounded-full bg-amber-500 hover:opacity-80 transition cursor-pointer" title="Minimize" />
          <div className="w-3 h-3 rounded-full bg-emerald-500 hover:opacity-80 transition cursor-pointer" title="Maximize" />
          
          <div className="h-4 w-px bg-slate-700/50 mx-2" />
          
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Kosha Core v2.6</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>
        </div>

        {/* Real-time Telemetry Strip (R1) */}
        <div className="hidden md:flex items-center space-x-3 text-xs font-mono">
          <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
            isDarkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'
          }`}>
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>RAM: <strong className="text-emerald-400 font-bold">{ramUsage} MB</strong></span>
          </div>

          <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
            isDarkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'
          }`}>
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Search: <strong className="text-emerald-400 font-bold">1.2ms</strong></span>
          </div>

          <div className="px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Air-Gap Guard: Active (Presidio Local NER)</span>
          </div>
        </div>

        {/* Quick Top Actions & Theme Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              handleSampleSwitch('financial');
              setIsRedactionModalOpen(true);
            }}
            className="text-xs px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 border border-pink-500/40 flex items-center gap-1.5 font-medium transition cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">Presidio Inspector</span>
          </button>

          <button
            onClick={handleReclaimStorage}
            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 font-medium transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Reclaim Bloat</span>
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition border cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
            }`}
            title="Toggle GTA Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTAINER: FLOATING DOCK SIDEBAR + CONTENT
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT FLOATING DOCK SIDEBAR (GTA AESTHETIC) */}
        <aside className={`w-20 lg:w-64 border-r flex flex-col justify-between p-3 lg:p-4 z-30 transition-colors duration-300 flex-shrink-0 ${
          isDarkMode ? 'bg-[#0b0c10]/95 border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-200'
        }`}>
          <div className="space-y-6">
            
            {/* Logo & Brand Header */}
            <div className="flex items-center space-x-3 px-1 pt-1">
              <div className="w-10 h-10 rounded-2xl gta-sunset-gradient flex items-center justify-center shadow-neon-magenta text-white font-display font-extrabold text-xl tracking-tighter flex-shrink-0">
                K
              </div>
              <div className="hidden lg:block">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display font-black text-xl tracking-wider gta-gradient-text">KOSHA</h1>
                  <span className="text-[9px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">GTA V</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-tight">LOCAL FS INTELLIGENCE</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1.5 text-sm font-medium">
              <div className="hidden lg:block px-2 pb-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">Workspace</div>
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition group ${
                  activeTab === 'dashboard'
                    ? (isDarkMode ? 'bg-[#151926] text-emerald-400 border border-emerald-500/40 shadow-neon-green font-bold' : 'bg-slate-100 text-emerald-600 border border-emerald-500/40 font-bold')
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
                title="Mission Dashboard"
              >
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline">Mission Dashboard</span>
                </div>
                <span className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">LIVE</span>
              </button>

              <button
                onClick={() => setActiveTab('explore')}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition group ${
                  activeTab === 'explore'
                    ? (isDarkMode ? 'bg-[#151926] text-emerald-400 border border-emerald-500/40 shadow-neon-green font-bold' : 'bg-slate-100 text-emerald-600 border border-emerald-500/40 font-bold')
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
                title="Semantic Explorer"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="hidden lg:inline">Semantic Explorer</span>
                </div>
                <span className="hidden lg:inline text-[10px] font-mono text-slate-500">{files.length} Files</span>
              </button>

              <button
                onClick={() => setIsDiffModalOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition group"
                title="Organization Diffs"
              >
                <div className="flex items-center gap-3">
                  <Wand2 className="w-5 h-5 text-pink-400 flex-shrink-0" />
                  <span className="hidden lg:inline">Auto-Organizer</span>
                </div>
                <span className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold">
                  {pendingDiffsCount} Ready
                </span>
              </button>

              <button
                onClick={() => {
                  handleSampleSwitch('financial');
                  setIsRedactionModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition group"
                title="Presidio Redactor"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-violet-400 flex-shrink-0" />
                  <span className="hidden lg:inline">Zero-Leak Inspector</span>
                </div>
                <span className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">0 Leaks</span>
              </button>

              <button
                onClick={() => setIsMountModalOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition group"
                title="Network Mounts"
              >
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="hidden lg:inline">Network Shares</span>
                </div>
                <span className="hidden lg:inline text-[10px] font-mono text-cyan-400">SMBv3</span>
              </button>
            </nav>

            {/* Mounted Targets (R6) */}
            <div className="hidden lg:block space-y-2">
              <div className="flex items-center justify-between px-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                <span>Active Mounts</span>
                <button onClick={() => setIsMountModalOpen(true)} className="text-emerald-400 hover:underline text-[10px] cursor-pointer">+ Mount</button>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">NVMe C:\ (System)</div>
                      <div className="text-[10px] text-slate-400">APFS / Ext4 • Local</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>

                {networkShares.map((share, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Network className="w-3.5 h-3.5 text-cyan-400" />
                      <div className="truncate max-w-[120px]">
                        <div className="font-semibold text-slate-200 truncate">{share.uri}</div>
                        <div className="text-[10px] text-slate-400">{share.protocol} • {share.latency}</div>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Power-User Toggles (R6) */}
            <div className={`hidden lg:block p-3 rounded-2xl border space-y-3 ${
              isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-emerald-400" />
                <span>Power-User Controls</span>
              </div>

              {/* Dotfile Toggle */}
              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-slate-300">Show Hidden Dotfiles</span>
                <input
                  type="checkbox"
                  checked={showDotfiles}
                  onChange={(e) => {
                    setShowDotfiles(e.target.checked);
                    showToast(e.target.checked ? 'Revealed hidden dotfiles (.env, .zshrc)' : 'Concealed hidden dotfiles', 'info');
                  }}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                />
              </label>

              {/* Air-Gap Lock Toggle */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Air-Gap Shield</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/20">
                  LOCKED
                </span>
              </div>
            </div>

          </div>

          {/* Footer Status */}
          <div className="hidden lg:block pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            <div className="flex items-center justify-between">
              <span>Provable Zero-Leak:</span>
              <strong className="text-emerald-400">100% Offline</strong>
            </div>
          </div>
        </aside>

        {/* MAIN SCROLLABLE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

          {/* GLOBAL SEARCH & QUERY PRESET STRIP (Requirement R2) */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="globalSearchInput"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search semantically across files: 'notes from last semester', 'unnamed invoices', '4K videos'..."
                className={`w-full pl-10 pr-24 py-3 rounded-2xl border text-sm transition-all shadow-sm placeholder:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                  isDarkMode
                    ? 'bg-[#151926] border-[rgba(255,255,255,0.08)] text-slate-100 focus:border-emerald-500'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5 pointer-events-none">
                <kbd className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'
                }`}>Ctrl+K</kbd>
              </div>
            </div>

            {/* Quick Query Preset Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 font-mono text-xs">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'academic', label: 'Semester Notes' },
                { id: 'invoices', label: 'Invoices' },
                { id: 'media', label: '4K Media' },
                { id: 'bloat', label: 'Stale Bloat' }
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setActiveFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl transition font-bold whitespace-nowrap cursor-pointer ${
                    activeFilter === pill.id
                      ? 'bg-emerald-500 text-slate-950 shadow-neon-green'
                      : (isDarkMode ? 'bg-slate-800 text-slate-300 hover:border-pink-500 border border-transparent' : 'bg-slate-200 text-slate-700 hover:border-pink-500 border border-transparent')
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* DASHBOARD TAB VIEW */}
          {activeTab === 'dashboard' && (
            <>
              {/* TOP HERO ACTION CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* HERO 1: SMART AUTO-ORGANIZATION (R3) */}
                <div className={`relative overflow-hidden p-5 rounded-3xl border shadow-glass transition-all hover:border-pink-500/50 group ${
                  isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-200'
                }`}>
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-pink-500/10 blur-2xl group-hover:bg-pink-500/20 transition" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-pink-400 font-bold">R3 • Auto-Organizer</span>
                      <h3 className="text-lg font-display font-bold mt-1">Smart Clutter Cleaner</h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-lg">
                      <Wand2 className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    {pendingDiffsCount > 0 ? (
                      <>Detected <strong className="text-pink-400 font-bold">{pendingDiffsCount} unorganized files</strong> with AI OCR/text meaning.</>
                    ) : (
                      <>Zero clutter remaining! Directory state is <strong className="text-emerald-400 font-bold">100% organized</strong>.</>
                    )}
                  </p>

                  {/* Health Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                      <span>Organization Health</span>
                      <span className="font-bold text-emerald-400">{healthScore}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-emerald-400 transition-all duration-700"
                        style={{ width: `${healthScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">Pending Diffs</span>
                    <button
                      onClick={() => setIsDiffModalOpen(true)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold transition flex items-center gap-1.5 shadow-neon-magenta cursor-pointer"
                    >
                      <span>Review Diffs</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* HERO 2: NETWORK MOUNTS & PROTOCOLS (R6) */}
                <div className={`relative overflow-hidden p-5 rounded-3xl border shadow-glass transition-all hover:border-cyan-500/50 group ${
                  isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-200'
                }`}>
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">R6 • Network Protocols</span>
                      <h3 className="text-lg font-display font-bold mt-1">SMB / NFS Subsystem</h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg">
                      <Server className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-mono text-slate-300 font-semibold">{networkShares[0]?.uri} (10GbE • 0.8ms)</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Shares are seamlessly indexed into local Presidio vector index with full air-gapped isolation.
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">{networkShares.length} Active Mounts</span>
                    <button
                      onClick={() => setIsMountModalOpen(true)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
                        isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-cyan-500/30' : 'bg-slate-100 hover:bg-slate-200 text-cyan-600 border-cyan-500/30'
                      }`}
                    >
                      <span>+ Mount Share</span>
                    </button>
                  </div>
                </div>

                {/* HERO 3: AIR-GAP GUARD & PRESIDIO PII (R5) */}
                <div className={`relative overflow-hidden p-5 rounded-3xl border shadow-glass transition-all hover:border-emerald-500/50 group ${
                  isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-200'
                }`}>
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">R5 • Privacy Architecture</span>
                      <h3 className="text-lg font-display font-bold mt-1">Microsoft Presidio NER</h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    All file embeddings, tokenization, and metadata extraction execute strictly on local CPU/GPU hardware.
                  </p>

                  <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Unredacted Leakage:</span>
                    <span className="text-emerald-400 font-bold">0.00 Bytes (0%)</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Air-Gapped Verified
                    </span>
                    <button
                      onClick={() => {
                        handleSampleSwitch('financial');
                        setIsRedactionModalOpen(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-neon-green cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect Redactor</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* BOTTOM ROW: STORAGE OPTIMIZER & PRIVACY ACTIVITY */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* STORAGE DRIVE OPTIMIZER (R4) */}
                <div className={`p-5 rounded-3xl border shadow-glass flex flex-col justify-between space-y-4 ${
                  isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">R4 • Storage Intelligence</span>
                      <h3 className="text-lg font-display font-bold">Drive Space Optimizer</h3>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      NVMe Local
                    </span>
                  </div>

                  {/* Donut Radial Arc & Breakdown */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                    {/* SVG Radial Gauge */}
                    <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="transparent"
                          className={isDarkMode ? 'text-slate-800' : 'text-slate-200'}
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="url(#gtaRadialGrad)"
                          strokeWidth="10"
                          strokeDasharray={gaugeCircumference}
                          strokeDashoffset={gaugeOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="gtaRadialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="60%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-display font-black">{usedPercent}%</span>
                        <span className="text-[10px] font-mono text-slate-400">USED</span>
                      </div>
                    </div>

                    {/* Breakdown Tiles */}
                    <div className="flex-1 w-full space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between text-slate-400 pb-1">
                        <span>Drive Allocation:</span>
                        <strong className="text-slate-200">{storageData.usedGB} GB / {storageData.totalGB} GB</strong>
                      </div>

                      {storageData.categories.map((cat, idx) => (
                        <div key={idx} className={`p-2 rounded-xl border flex items-center justify-between ${
                          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <div>
                              <div className="font-semibold text-slate-200">{cat.name}</div>
                              <div className="text-[10px] text-slate-400">{cat.count} files analyzed</div>
                            </div>
                          </div>
                          <span className="font-bold" style={{ color: cat.color }}>{cat.sizeGB} GB</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reclaim Action Strip */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      Reclaimable: <strong className="text-emerald-400 font-bold">{storageData.reclaimableGB} GB</strong>
                    </span>
                    <button
                      onClick={handleReclaimStorage}
                      disabled={storageData.reclaimableGB <= 0}
                      className={`px-4 py-2 rounded-xl font-display font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                        storageData.reclaimableGB > 0
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-neon-green'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{storageData.reclaimableGB > 0 ? '1-Click Reclaim Bloat' : 'Drive Cleaned'}</span>
                    </button>
                  </div>
                </div>

                {/* PRIVACY GUARD ACTIVITY AUDIT (R5) */}
                <div className={`p-5 rounded-3xl border shadow-glass flex flex-col justify-between space-y-4 ${
                  isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400 font-bold">R5 • Air-Gap Intelligence</span>
                      <h3 className="text-lg font-display font-bold">PII Redaction Audit</h3>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 font-bold">
                      Presidio Core
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Monthly entities safely masked locally by Presidio NER before any cloud query construction.
                  </p>

                  {/* Multi-tier Stacked Progress Bars */}
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Phone Numbers & Emails</span>
                        <span className="text-emerald-400 font-bold">1,492 Masked</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">PAN / SSN / Tax IDs</span>
                        <span className="text-pink-400 font-bold">342 Masked</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: '48%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Developer API Keys & JWTs</span>
                        <span className="text-cyan-400 font-bold">89 Masked</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: '31%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Provable Air-Gap Assurance Tile */}
                  <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-emerald-300">Air-Gap Verification</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Sensitive Data Leaked: <strong className="text-emerald-400">0.00 Bytes (0%)</strong>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleSampleSwitch('financial');
                        setIsRedactionModalOpen(true);
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-mono cursor-pointer"
                    >
                      Audit Spans
                    </button>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* EXPLORE TABLE VIEW (Requirement R2) */}
          <div className={`p-5 rounded-3xl border shadow-glass space-y-4 ${
            isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-display font-bold">Semantic Explorer Table</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {filteredFiles.length} items
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Search across deep text summaries, OCR extractions, and audio transcripts without knowing exact filenames.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`text-xs font-mono px-2.5 py-1.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="relevance">AI Relevance</option>
                  <option value="size">Size (Descending)</option>
                  <option value="date">Name</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className={`border-b text-slate-400 uppercase tracking-wider text-[11px] ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <th className="py-3 px-3">File & Format</th>
                    <th className="py-3 px-3">Location / Mount</th>
                    <th className="py-3 px-3">Extracted Semantic Meaning</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Privacy Guard</th>
                    <th className="py-3 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No files matching query "{searchQuery}". Try searching "notes", "invoices", or toggle hidden dotfiles.
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map(file => (
                      <tr key={file.id} className="hover:bg-slate-800/40 transition group">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                              {file.type === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                              {file.type === 'invoice' && <FileText className="w-4 h-4 text-emerald-400" />}
                              {file.type === 'video' && <Video className="w-4 h-4 text-pink-400" />}
                              {file.type === 'archive' && <Archive className="w-4 h-4 text-amber-400" />}
                              {file.type === 'secret' && <Key className="w-4 h-4 text-rose-500" />}
                              {file.type === 'script' && <Terminal className="w-4 h-4 text-cyan-400" />}
                              {!file.type && <FileText className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{file.name}</span>
                                {file.isDotfile && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-400">
                                    HIDDEN
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">{file.format}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="text-slate-300 font-mono text-[11px] truncate max-w-[140px]" title={file.path}>
                            {file.path}
                          </div>
                          <div className="text-[10px] text-cyan-400 flex items-center gap-1">
                            <Server className="w-2.5 h-2.5" /> {file.mount}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 max-w-xs">
                          <div className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                            <span className="text-emerald-400 font-semibold">AI Snippet:</span> {file.snippet}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-200">{file.size}</span>
                          <div className="text-[10px] text-slate-500">{file.modified}</div>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            file.privacyStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                            file.privacyStatus === 'masked' ? 'bg-pink-500/20 text-pink-400' :
                            file.privacyStatus === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                            file.privacyStatus === 'bloat' ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            <Lock className="w-2.5 h-2.5 inline mr-1" />
                            {file.privacy}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 inline text-emerald-400" /> Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* =========================================================================
          MODALS & OVERLAYS
         ========================================================================= */}

      {/* MODAL 1: ON-DEVICE PRESIDIO PII REDACTION INSPECTOR (Requirement R5) */}
      {isRedactionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-300'
          }`}>
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold">Microsoft Presidio • Redaction Inspector</h3>
                  <p className="text-xs font-mono text-slate-400">Verifiable on-device entity masking before cloud transmission</p>
                </div>
              </div>

              {/* Sample Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-slate-800 p-1 font-mono text-xs">
                  {['financial', 'academic', 'secrets'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleSampleSwitch(s)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-bold transition cursor-pointer ${
                        activeSampleKey === s ? 'bg-pink-500 text-white shadow-neon-magenta' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsRedactionModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dual Pane Comparison */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
              
              {/* Left Pane: Local Raw File */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Local Raw File (Sensitive Device Memory)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                    CONTAINS PII
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed border border-rose-500/30 overflow-x-auto whitespace-pre-wrap min-h-[220px]">
                  {redactionResult.rawText}
                </div>
              </div>

              {/* Right Pane: Sanitized Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Sanitized Cloud Payload (Air-Gapped Safe)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    0 LEAKS
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed border border-emerald-500/30 overflow-x-auto whitespace-pre-wrap min-h-[220px]">
                  {redactionResult.sanitizedText}
                </div>
              </div>

            </div>

            {/* Footer Telemetry */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Tokens Redacted: <strong className="text-pink-400">{redactionResult.entitiesFound} Entities</strong></span>
                <span className="text-slate-400">NER Latency: <strong className="text-emerald-400">{redactionResult.latencyMs} ms</strong></span>
                <span className="text-slate-400">Leakage Bytes: <strong className="text-emerald-400">{redactionResult.leakageBytes}</strong></span>
              </div>
              <button
                onClick={() => setIsRedactionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
              >
                Done Reviewing
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ORGANIZATION DIFFS REVIEW (Requirement R3) */}
      {isDiffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-300'
          }`}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold">Smart Clutter & Organization Diffs</h3>
                  <p className="text-xs font-mono text-slate-400">AI OCR & content semantics propose clean filenames & target folders</p>
                </div>
              </div>
              <button
                onClick={() => setIsDiffModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Diffs List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {diffs.filter(d => !d.applied).length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-slate-200 font-bold text-base">All Files Systematically Organized</h4>
                  <p className="text-xs text-slate-400 mt-1">Zero clutter remaining across Downloads and Desktop roots.</p>
                </div>
              ) : (
                diffs.filter(d => !d.applied).map(diff => (
                  <div
                    key={diff.id}
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      diff.selected ? 'border-emerald-500/40 bg-slate-900/80' : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={diff.selected}
                        onChange={() => toggleDiffItem(diff.id)}
                        className="mt-1.5 w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                      />
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                        {diff.type === 'image' && <FileText className="w-5 h-5 text-pink-400" />}
                        {diff.type === 'pdf' && <FileText className="w-5 h-5 text-rose-400" />}
                        {diff.type === 'video' && <Video className="w-5 h-5 text-violet-400" />}
                        {diff.type === 'text' && <FileText className="w-5 h-5 text-cyan-400" />}
                      </div>
                      <div>
                        {/* Before & After Diff */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 font-mono text-xs">
                          <span className="text-rose-400 line-through">{diff.oldName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline" />
                          <span className="text-emerald-400 font-bold">{diff.newName}</span>
                        </div>
                        {/* Target Route */}
                        <div className="text-[11px] font-mono text-slate-400 mt-1">
                          Route: <span className="text-slate-500">{diff.sourcePath}</span> &rarr; <span className="text-cyan-400 font-semibold">{diff.targetPath}</span>
                        </div>
                        {/* AI Justification */}
                        <div className="text-xs text-slate-400 mt-1 italic">
                          <span className="text-amber-400 font-normal">AI Reasoning:</span> {diff.reason}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-400 self-end md:self-center">{diff.size}</span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                {diffs.filter(d => d.selected && !d.applied).length} proposals selected for atomic move/rename
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDiffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyDiffs}
                  disabled={diffs.filter(d => !d.applied).length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-display font-bold shadow-neon-green flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Selected Diffs</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: NETWORK MOUNT CONFIGURATOR (Requirement R6) */}
      {isMountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-300'
          }`}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold">Mount Network Share</h3>
                  <p className="text-xs font-mono text-slate-400">Connect SMB v3, NFS, or SFTP storage</p>
                </div>
              </div>
              <button
                onClick={() => setIsMountModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Protocol</label>
                <div className="grid grid-cols-3 gap-2">
                  {['SMB', 'NFS', 'SFTP'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setMountProtocol(p);
                        if (p === 'SMB') setMountUri('smb://192.168.1.150/backups');
                        if (p === 'NFS') setMountUri('nfs://nas.local/exports/data');
                        if (p === 'SFTP') setMountUri('sftp://dev@backup.internal:22/root');
                      }}
                      className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                        mountProtocol === p
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-neon-cyan'
                          : 'bg-slate-800 text-slate-400 border border-transparent'
                      }`}
                    >
                      {p === 'SMB' ? 'SMB v3' : p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Server Share URI</label>
                <input
                  type="text"
                  value={mountUri}
                  onChange={(e) => setMountUri(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-400 text-slate-200"
                />
              </div>

              <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Mounts automatically inherit zero-leak local Presidio indexing.</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-end gap-2 text-xs font-mono">
              <button
                onClick={() => setIsMountModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectMount}
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-display font-bold shadow-neon-cyan flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Verify & Mount Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FILE PREVIEW INSPECTION DRAWER */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-[#151926] border-[rgba(255,255,255,0.08)]' : 'bg-white border-slate-300'
          }`}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold">{previewFile.name}</h3>
                  <p className="text-xs font-mono text-slate-400">{previewFile.mount} {previewFile.path}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">FILE SIZE</span>
                  <strong className="text-emerald-400">{previewFile.size}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">SECURITY STATUS</span>
                  <strong className="text-pink-400">{previewFile.privacy}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold">DEEP SEMANTIC EXTRACTION:</span>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed">
                  {previewFile.snippet}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Local Presidio Index Verified
                </span>
                <button
                  onClick={() => {
                    showToast('Dispatched to default OS application handler', 'success');
                    setPreviewFile(null);
                  }}
                  className="text-emerald-400 underline font-bold cursor-pointer"
                >
                  Open in OS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none animate-bounce">
          <div className={`p-3.5 px-4 rounded-2xl bg-slate-900/95 text-slate-100 border flex items-center gap-3 text-xs font-mono shadow-2xl backdrop-blur-md ${
            toast.type === 'success' ? 'border-emerald-500 shadow-neon-green' :
            toast.type === 'warning' ? 'border-pink-500 shadow-neon-magenta' :
            'border-cyan-500 shadow-neon-cyan'
          }`}>
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
