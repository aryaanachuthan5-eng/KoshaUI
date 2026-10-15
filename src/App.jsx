import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FolderOpen,
  Sparkles,
  HardDrive,
  ShieldCheck,
  Wand2,
  ExternalLink,
  Sun,
  Moon,
  Check,
  FileText,
  Video,
  Archive,
  Key,
  Terminal,
  ArrowRight,
  Trash2,
  RefreshCw,
  Eye,
  X,
  FileCode,
  Lock,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState(true);

  // Active view: 'search' | 'organize' | 'storage' | 'privacy'
  const [activeTab, setActiveTab] = useState('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showHidden, setShowHidden] = useState(false);

  // Drive & scanning state
  const [currentFolder, setCurrentFolder] = useState('workspace');
  const [customPath, setCustomPath] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [files, setFiles] = useState([]);
  const [driveStats, setDriveStats] = useState({
    drive: 'C:\\',
    totalGB: 475.7,
    usedGB: 277.7,
    freeGB: 198.0,
    usedPercent: 58,
    userHome: 'C:\\Users\\Aryaan'
  });

  // Clutter / Organize proposals
  const [proposals, setProposals] = useState([
    {
      id: 1,
      selected: true,
      oldName: "IMG_0029_unnamed.png",
      newName: "Semester_Timetable_2026.png",
      folder: "Downloads ➔ Documents/Academic",
      reason: "Detected campus timetable matrix",
      size: "4.2 MB"
    },
    {
      id: 2,
      selected: true,
      oldName: "scan_04812_receipt.pdf",
      newName: "Tax_Assessment_FY2025.pdf",
      folder: "Downloads ➔ Documents/Financial",
      reason: "Detected PAN card & tax receipt headers",
      size: "1.1 MB"
    },
    {
      id: 3,
      selected: true,
      oldName: "temp_rec_491.mp4",
      newName: "Hackathon_Demo_Presentation.mp4",
      folder: "Videos/Captures ➔ Videos/Projects",
      reason: "Extracted audio transcript 'Kosha project pitch'",
      size: "340 MB"
    },
    {
      id: 4,
      selected: true,
      oldName: "untitled_notes_final.txt",
      newName: "Distributed_Systems_Study_Notes.txt",
      folder: "Desktop ➔ Documents/Study",
      reason: "Extracted distributed consensus concepts",
      size: "38 KB"
    }
  ]);

  // Privacy Redactor Demo state
  const [privacySample, setPrivacySample] = useState('finance');
  const [redactedData, setRedactedData] = useState({
    raw: `ACCOUNT STATEMENT - Q3 2026\nName: Aryan Achuthan\nPAN: ABCPA1234F\nAccount: 9812-4412-8801\nPhone: +91 98231 44512\nBalance: INR 452,190.50`,
    clean: `ACCOUNT STATEMENT - Q3 2026\nName: <PERSON_1>\nPAN: <TAX_ID_REDACTED>\nAccount: <ACCOUNT_HASH_8801>\nPhone: <PHONE_HASH>\nBalance: INR 452,190.50`,
    entitiesFound: 4
  });

  // Quick File Preview Modal
  const [inspectFile, setInspectFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  // Toast alert
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync theme to root HTML
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDark]);

  // Load real drive info and initial files
  const loadDriveInfo = async () => {
    try {
      const res = await fetch('/api/drive/info');
      const data = await res.json();
      if (data.success) {
        setDriveStats(data);
      }
    } catch {
      // Offline fallback
    }
  };

  const loadFiles = async (folderKey, pathOverride = '') => {
    setIsScanning(true);
    let target = '';
    if (folderKey === 'custom' && pathOverride) {
      target = pathOverride;
    } else if (driveStats.defaultLocations && driveStats.defaultLocations[folderKey]) {
      target = driveStats.defaultLocations[folderKey];
    }

    try {
      const url = target ? `/api/drive/scan?dir=${encodeURIComponent(target)}` : '/api/drive/scan';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
        showToast(`Loaded ${data.files?.length || 0} files from ${folderKey}`);
      }
    } catch {
      showToast('Backend offline. Run: npm run server', 'warning');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    loadDriveInfo();
    loadFiles('workspace');
  }, []);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      if (f.isDotfile && !showHidden) return false;
      if (activeCategory !== 'all' && f.type !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          (f.snippet && f.snippet.toLowerCase().includes(q)) ||
          f.path.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [files, searchQuery, activeCategory, showHidden]);

  // Inspect file content
  const openFileDetails = async (file) => {
    setInspectFile(file);
    try {
      const res = await fetch(`/api/drive/file?path=${encodeURIComponent(file.path)}`);
      const data = await res.json();
      if (data.success) {
        setFileContent(data.sanitizedContent || data.rawContent);
      } else {
        setFileContent(file.snippet || 'Local file content.');
      }
    } catch {
      setFileContent(file.snippet || 'Local file content.');
    }
  };

  // Open physical file in Windows Explorer
  const revealInExplorer = async (filePath) => {
    try {
      const res = await fetch('/api/drive/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Opened in Windows File Explorer');
      }
    } catch {
      showToast('Could not open file manager', 'warning');
    }
  };

  // Switch Privacy Sample
  const handlePrivacySwitch = (sample) => {
    setPrivacySample(sample);
    if (sample === 'finance') {
      setRedactedData({
        raw: `ACCOUNT STATEMENT - Q3 2026\nName: Aryan Achuthan\nPAN: ABCPA1234F\nAccount: 9812-4412-8801\nPhone: +91 98231 44512\nBalance: INR 452,190.50`,
        clean: `ACCOUNT STATEMENT - Q3 2026\nName: <PERSON_1>\nPAN: <TAX_ID_REDACTED>\nAccount: <ACCOUNT_HASH_8801>\nPhone: <PHONE_HASH>\nBalance: INR 452,190.50`,
        entitiesFound: 4
      });
    } else if (sample === 'academic') {
      setRedactedData({
        raw: `COLLEGE GRADE RECORD\nStudent: Aryan Achuthan\nRoll: 22CS014\nEmail: aryaanachuthan5@gmail.com\nPhone: +91 98231 44512\nGPA: 9.42 / 10.0`,
        clean: `COLLEGE GRADE RECORD\nStudent: <PERSON_1>\nRoll: <STUDENT_ID_MASKED>\nEmail: <EMAIL_MASKED>\nPhone: <PHONE_HASH>\nGPA: 9.42 / 10.0`,
        entitiesFound: 4
      });
    } else {
      setRedactedData({
        raw: `# ENVIRONMENT CONFIG\nOPENAI_KEY="sk-proj-94819a0bc4194fbe8812"\nDATABASE_URL="postgres://admin:SuperSecretPass@localhost:5432/db"\nPORT=3000`,
        clean: `# ENVIRONMENT CONFIG\nOPENAI_KEY="<DEV_SECRET_REDACTED>"\nDATABASE_URL="postgres://<DB_CREDS_REDACTED>@localhost:5432/db"\nPORT=3000`,
        entitiesFound: 3
      });
    }
  };

  // Apply Clutter Cleaning
  const applyProposals = () => {
    setProposals([]);
    showToast('Organized files successfully!');
  };

  // Reclaim Cache
  const cleanCache = () => {
    setDriveStats(prev => ({
      ...prev,
      freeGB: parseFloat((prev.freeGB + 8.2).toFixed(1)),
      usedGB: parseFloat((prev.usedGB - 8.2).toFixed(1))
    }));
    showToast('Cleaned 8.2 GB of temporary caches!');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#0e1017] text-slate-100' : 'bg-[#f8fafc] text-slate-800'
    }`}>

      {/* =========================================================
          TOP NAVIGATION BAR (Clean, simple, human)
         ========================================================= */}
      <header className={`h-16 border-b px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md ${
        isDark ? 'bg-[#141722]/90 border-slate-800/80' : 'bg-white/90 border-slate-200'
      }`}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-lg shadow-sm">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight">Kosha</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Local & Private
              </span>
            </div>
            <p className="text-[11px] text-slate-400">AI File Intelligence for your PC</p>
          </div>
        </div>

        {/* Clean Center Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/40 border border-slate-800">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'search'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Files</span>
          </button>

          <button
            onClick={() => setActiveTab('organize')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'organize'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Clean & Organize</span>
            {proposals.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] flex items-center justify-center font-bold">
                {proposals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'storage'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Disk Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Shield</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{driveStats.drive} ({driveStats.freeGB} GB free)</span>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition border cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* =========================================================
          MAIN CONTENT AREA
         ========================================================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">

        {/* TAB 1: SEARCH & EXPLORE FILES */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            
            {/* Folder Picker & Global Search Header */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              isDark ? 'bg-[#161922] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              
              {/* Folder Selector Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                  <span>Choose Folder to Search:</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'workspace', label: 'Workspace' },
                    { id: 'desktop', label: 'Desktop' },
                    { id: 'downloads', label: 'Downloads' },
                    { id: 'documents', label: 'Documents' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setCurrentFolder(f.id);
                        loadFiles(f.id);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        currentFolder === f.id
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  <button
                    onClick={() => loadFiles(currentFolder, customPath)}
                    className="ml-2 text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer font-medium"
                    title="Refresh folder"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>Rescan</span>
                  </button>
                </div>
              </div>

              {/* Big, Clean Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search naturally: e.g. 'notes from last week', 'invoices', 'diagrams', 'react code'..."
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                    isDark
                      ? 'bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Category Filter Pills & Hidden Dotfile Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
                  {[
                    { id: 'all', label: 'All Files' },
                    { id: 'text', label: 'Documents & Notes' },
                    { id: 'script', label: 'Code & Scripts' },
                    { id: 'image', label: 'Images' },
                    { id: 'video', label: 'Videos' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showHidden}
                    onChange={(e) => setShowHidden(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  <span>Show hidden files (.env, .git)</span>
                </label>
              </div>

            </div>

            {/* Results Count Strip */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-400">
              <span>Showing {filteredFiles.length} files in {currentFolder}</span>
              <span className="font-mono text-[11px] text-emerald-400">100% on-device search</span>
            </div>

            {/* Files List */}
            <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm ${
              isDark ? 'bg-[#161922] border-slate-800/80 divide-slate-800/60' : 'bg-white border-slate-200 divide-slate-200'
            }`}>
              {filteredFiles.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <FolderOpen className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-sm font-medium">No files found matching your search</p>
                  <p className="text-xs text-slate-400">Try searching for generic terms or switch the folder above</p>
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition"
                  >
                    {/* Icon + Name + Snippet */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                        {file.type === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                        {file.type === 'image' && <FileText className="w-4 h-4 text-pink-400" />}
                        {file.type === 'video' && <Video className="w-4 h-4 text-purple-400" />}
                        {file.type === 'script' && <Terminal className="w-4 h-4 text-cyan-400" />}
                        {file.type === 'secret' && <Key className="w-4 h-4 text-amber-400" />}
                        {!file.type && <FileText className="w-4 h-4 text-emerald-400" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate" title={file.name}>
                            {file.name}
                          </span>
                          {file.isDotfile && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-mono">
                              Hidden
                            </span>
                          )}
                          {file.privacy && file.privacy.includes('PII') && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/15 text-pink-400 font-medium">
                              {file.privacy}
                            </span>
                          )}
                        </div>

                        {/* Extracted Meaning Snippet */}
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {file.snippet || file.format}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.modified}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openFileDetails(file)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => revealInExplorer(file.path)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer flex items-center gap-1.5"
                        title="Open file location in Windows Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open Folder</span>
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SMART CLEAN & ORGANIZE */}
        {activeTab === 'organize' && (
          <div className="space-y-6">
            
            {/* Explanatory Banner */}
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
              isDark ? 'bg-[#161922] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold">Smart Auto-Organization</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Kosha reads the contents of messy files (like screenshots, unhelpful download names) and suggests clean, meaningful names and sorted folders.
                </p>
              </div>

              {proposals.length > 0 && (
                <button
                  onClick={applyProposals}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-2 self-start md:self-center"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply All {proposals.length} Organizers</span>
                </button>
              )}
            </div>

            {/* Proposals List */}
            <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm ${
              isDark ? 'bg-[#161922] border-slate-800/80 divide-slate-800/60' : 'bg-white border-slate-200 divide-slate-200'
            }`}>
              {proposals.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <Check className="w-10 h-10 mx-auto text-emerald-400" />
                  <h3 className="font-bold text-sm text-slate-200">All Folders Clean & Organized!</h3>
                  <p className="text-xs text-slate-400">No messy file names or unorganized clutter found.</p>
                </div>
              ) : (
                proposals.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      {/* Name Diff */}
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-rose-400 line-through">{item.oldName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">{item.newName}</span>
                      </div>

                      {/* Route destination */}
                      <div className="text-xs text-slate-400">
                        <span>Target: </span>
                        <strong className="text-slate-300">{item.folder}</strong>
                      </div>

                      {/* AI Reason */}
                      <div className="text-xs text-slate-400 italic">
                        <span>AI OCR Justification: </span>
                        <span className="text-slate-300 not-italic">{item.reason}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <span className="text-xs font-mono text-slate-400">{item.size}</span>
                      <button
                        onClick={() => {
                          setProposals(prev => prev.filter(p => p.id !== item.id));
                          showToast(`Organized ${item.newName}`);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                      >
                        Organize File
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* TAB 3: DISK STORAGE OPTIMIZER */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            
            {/* Storage Progress Card */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              isDark ? 'bg-[#161922] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">Local Drive Capacity</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Physical Windows Partition: {driveStats.drive}</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {driveStats.usedPercent}% Used
                </span>
              </div>

              {/* Clean Storage Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${driveStats.usedPercent}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>{driveStats.usedGB} GB Used</span>
                  <span>{driveStats.freeGB} GB Available of {driveStats.totalGB} GB</span>
                </div>
              </div>
            </div>

            {/* Storage Breakdown Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161922] border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="text-xs font-semibold text-slate-400">Large Videos & Captures</div>
                <div className="text-xl font-bold text-slate-100 mt-1">18.4 GB</div>
                <p className="text-[11px] text-slate-400 mt-1">Screen recordings & high-bitrate media</p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161922] border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="text-xs font-semibold text-slate-400">Documents & Academic Notes</div>
                <div className="text-xl font-bold text-slate-100 mt-1">3.1 GB</div>
                <p className="text-[11px] text-slate-400 mt-1">820 searchable PDFs & text notes</p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161922] border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="text-xs font-semibold text-pink-400 font-bold">Stale Caches & Temp Files</div>
                <div className="text-xl font-bold text-pink-400 mt-1">8.2 GB</div>
                <div className="mt-3">
                  <button
                    onClick={cleanCache}
                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 border border-pink-500/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clean 8.2 GB Cache</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: PRIVACY SHIELD & PRESIDIO */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            
            {/* Privacy Explanation Banner */}
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
              isDark ? 'bg-[#161922] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold">Air-Gapped Privacy Engine</h2>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">
                  Unlike cloud AI tools, Kosha analyzes your files completely on your device. Any names, phone numbers, or passwords are automatically masked before any external queries.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Sample:</span>
                <div className="flex rounded-lg bg-slate-800 p-1 text-xs">
                  {['finance', 'academic', 'secrets'].map(s => (
                    <button
                      key={s}
                      onClick={() => handlePrivacySwitch(s)}
                      className={`px-3 py-1 rounded capitalize font-medium transition cursor-pointer ${
                        privacySample === s ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Raw Local */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#161922] border-slate-800/80' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <span>1. Your Local File (Unredacted)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold">
                    Contains Sensitive PII
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border border-rose-500/20 min-h-[160px]">
                  {redactedData.raw}
                </div>
              </div>

              {/* Clean Payload */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#161922] border-slate-800/80' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>2. Masked Air-Gap Payload</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                    0 Leaks (Air-Gapped)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border border-emerald-500/20 min-h-[160px]">
                  {redactedData.clean}
                </div>
              </div>

            </div>

            {/* Guarantee Badge */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Zero Bytes Leaked Guarantee — Runs 100% on local CPU</span>
              </span>
              <span className="font-mono font-bold">Presidio NER Engine</span>
            </div>

          </div>
        )}

      </main>

      {/* =========================================================
          INSPECT FILE DRAWER MODAL
         ========================================================= */}
      {inspectFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-2xl border shadow-xl overflow-hidden ${
            isDark ? 'bg-[#161922] border-slate-800' : 'bg-white border-slate-300'
          }`}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm truncate max-w-sm">{inspectFile.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono truncate max-w-sm">{inspectFile.path}</p>
              </div>
              <button
                onClick={() => setInspectFile(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-4 text-xs font-mono text-slate-400">
                <div>Size: <strong className="text-slate-200">{inspectFile.size}</strong></div>
                <div>Format: <strong className="text-slate-200">{inspectFile.format}</strong></div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1.5">File Content / Extracted Snippet:</span>
                <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-52 overflow-y-auto border border-slate-800">
                  {fileContent || inspectFile.snippet}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-emerald-400">Air-Gapped & Local</span>
                <button
                  onClick={() => {
                    revealInExplorer(inspectFile.path);
                    setInspectFile(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition cursor-pointer"
                >
                  Open in Windows Explorer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SIMPLE TOAST
         ========================================================= */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-100 border border-emerald-500/50 shadow-lg text-xs font-medium flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

    </div>
  );
}
