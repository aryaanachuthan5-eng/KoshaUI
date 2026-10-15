import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FolderOpen,
  Folder,
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
  ArrowUp,
  Trash2,
  RefreshCw,
  Eye,
  X,
  Lock,
  ChevronRight,
  Home,
  Laptop,
  FolderTree,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('manager'); // 'manager' | 'organize' | 'storage' | 'privacy'

  // File Manager State
  const [currentPath, setCurrentPath] = useState('C:\\Users\\Aryaan\\Desktop');
  const [parentPath, setParentPath] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Direct Path Editing in Address Bar
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [pathInput, setPathInput] = useState('');

  // Physical Drive Info
  const [driveStats, setDriveStats] = useState({
    drive: 'C:\\',
    totalGB: 475.7,
    usedGB: 277.7,
    freeGB: 198.0,
    usedPercent: 58,
    userHome: 'C:\\Users\\Aryaan'
  });

  // Clutter / Organize Proposals
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
    }
  ]);

  // Privacy Redactor Demo state
  const [privacySample, setPrivacySample] = useState('finance');
  const [redactedData, setRedactedData] = useState({
    raw: `ACCOUNT STATEMENT - Q3 2026\nName: Aryan Achuthan\nPAN: ABCPA1234F\nAccount: 9812-4412-8801\nPhone: +91 98231 44512\nBalance: INR 452,190.50`,
    clean: `ACCOUNT STATEMENT - Q3 2026\nName: <PERSON_1>\nPAN: <TAX_ID_REDACTED>\nAccount: <ACCOUNT_HASH_8801>\nPhone: <PHONE_HASH>\nBalance: INR 452,190.50`,
    entitiesFound: 4
  });

  // File Preview Modal
  const [inspectFile, setInspectFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  // Toast alert
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync dark theme
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

  // Fetch drive statistics
  const fetchDriveStats = async () => {
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

  // Navigate to any folder on the local drive
  const navigateTo = async (targetPath) => {
    setIsLoading(true);
    try {
      const url = targetPath
        ? `/api/drive/browse?path=${encodeURIComponent(targetPath)}&showHidden=${showHidden}`
        : `/api/drive/browse?showHidden=${showHidden}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setCurrentPath(data.currentPath);
        setParentPath(data.parentPath);
        setBreadcrumbs(data.breadcrumbs || []);
        setFolders(data.folders || []);
        setFiles(data.files || []);
        setPathInput(data.currentPath);
        setIsEditingPath(false);
      } else {
        showToast(data.error || 'Could not open folder', 'warning');
      }
    } catch {
      showToast('Could not browse folder', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDriveStats();
    navigateTo('C:\\Users\\Aryaan\\Desktop');
  }, [showHidden]);

  // Filtered files & folders within current directory
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const q = searchQuery.toLowerCase();
    return folders.filter(f => f.name.toLowerCase().includes(q));
  }, [folders, searchQuery]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      if (activeCategory !== 'all' && f.type !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          (f.snippet && f.snippet.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [files, searchQuery, activeCategory]);

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
        showToast('Opened in Windows Explorer');
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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#0c0d12] text-slate-100' : 'bg-[#f4f6fa] text-slate-800'
    }`}>

      {/* =========================================================
          TOP APP HEADER
         ========================================================= */}
      <header className={`h-14 border-b px-5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md ${
        isDark ? 'bg-[#12151f]/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-base shadow-sm">
            K
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight">Kosha</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              FILE MANAGER
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/50 border border-slate-800">
          <button
            onClick={() => setActiveTab('manager')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'manager'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>File Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('organize')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'organize'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Clean Clutter</span>
            {proposals.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] flex items-center justify-center font-bold">
                {proposals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'storage'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Drive Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Guard</span>
          </button>
        </nav>

        {/* Right Info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>C:\ Drive ({driveStats.freeGB} GB Free)</span>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition border cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* =========================================================
          MAIN WORKSPACE (FILE MANAGER LAYOUT)
         ========================================================= */}
      {activeTab === 'manager' && (
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT QUICK ACCESS SIDEBAR */}
          <aside className={`w-56 border-r flex flex-col justify-between p-3.5 transition-colors flex-shrink-0 ${
            isDark ? 'bg-[#12151f]/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="space-y-4">
              <div className="px-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                Quick Access
              </div>

              <div className="space-y-1 text-xs font-medium">
                <button
                  onClick={() => navigateTo('C:\\')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    currentPath.toLowerCase() === 'c:\\'
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>Local Disk (C:\)</span>
                </button>

                <button
                  onClick={() => navigateTo(driveStats.userHome)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    currentPath.toLowerCase() === driveStats.userHome.toLowerCase()
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <Home className="w-4 h-4 text-cyan-400" />
                  <span>User Home</span>
                </button>

                <button
                  onClick={() => navigateTo('C:\\Users\\Aryaan\\Desktop')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    currentPath.toLowerCase().includes('desktop')
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <Laptop className="w-4 h-4 text-purple-400" />
                  <span>Desktop</span>
                </button>

                <button
                  onClick={() => navigateTo('C:\\Users\\Aryaan\\Downloads')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    currentPath.toLowerCase().includes('downloads')
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>Downloads</span>
                </button>

                <button
                  onClick={() => navigateTo('C:\\Users\\Aryaan\\Documents')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    currentPath.toLowerCase().includes('documents')
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <FileText className="w-4 h-4 text-pink-400" />
                  <span>Documents</span>
                </button>

                <button
                  onClick={() => navigateTo('C:\\Users\\Aryaan\\Desktop\\DBCE Hackathon')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    currentPath.toLowerCase().includes('dbce hackathon')
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>DBCE Project</span>
                </button>
              </div>

              {/* Toggles */}
              <div className="pt-4 border-t border-slate-800/80">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none px-2">
                  <input
                    type="checkbox"
                    checked={showHidden}
                    onChange={(e) => setShowHidden(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  <span>Show hidden files</span>
                </label>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="block text-slate-500">Connected:</span>
              <span className="text-emerald-400 font-bold">Physical C:\ Partition</span>
            </div>
          </aside>

          {/* MAIN FILE MANAGER BROWSER AREA */}
          <main className="flex-1 flex flex-col overflow-hidden">
            
            {/* ADDRESS BAR & CONTROLS */}
            <div className={`p-3.5 border-b flex items-center justify-between gap-3 ${
              isDark ? 'bg-[#151926]/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              {/* Back / Up Button */}
              <button
                onClick={() => parentPath && navigateTo(parentPath)}
                disabled={!parentPath}
                className={`p-2 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                  parentPath
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                }`}
                title="Go up to parent directory"
              >
                <ArrowUp className="w-4 h-4" />
              </button>

              {/* Breadcrumbs or Editable Path Input */}
              <div className="flex-1 relative">
                {isEditingPath ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (pathInput.trim()) navigateTo(pathInput.trim());
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={pathInput}
                      onChange={(e) => setPathInput(e.target.value)}
                      onBlur={() => setIsEditingPath(false)}
                      autoFocus
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-slate-950 border-emerald-500 text-slate-100' : 'bg-white border-emerald-500 text-slate-800'
                      }`}
                    />
                  </form>
                ) : (
                  <div
                    onClick={() => {
                      setPathInput(currentPath);
                      setIsEditingPath(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 overflow-x-auto text-xs font-mono cursor-text ${
                      isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-100 border-slate-300'
                    }`}
                    title="Click to edit path directly"
                  >
                    {breadcrumbs.map((crumb, idx) => (
                      <React.Fragment key={crumb.path}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateTo(crumb.path);
                          }}
                          className="hover:text-emerald-400 hover:underline font-semibold text-slate-300 whitespace-nowrap cursor-pointer"
                        >
                          {crumb.name}
                        </button>
                        {idx < breadcrumbs.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Inside Current Folder */}
              <div className="w-56 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter this folder..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => navigateTo(currentPath)}
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Refresh folder"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* FOLDER & FILE CONTENTS */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* SUBFOLDERS SECTION */}
              {filteredFolders.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Folders ({filteredFolders.length})</span>
                    <span>Click folder to open</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {filteredFolders.map(folder => (
                      <div
                        key={folder.path}
                        onClick={() => navigateTo(folder.path)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer group ${
                          isDark
                            ? 'bg-[#151926] border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/40'
                            : 'bg-white border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50'
                        }`}
                      >
                        <Folder className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs truncate text-slate-200 group-hover:text-emerald-400">
                            {folder.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">Folder</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FILES SECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Files ({filteredFiles.length})</span>
                  <span>{currentPath}</span>
                </div>

                <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm ${
                  isDark ? 'bg-[#151926] border-slate-800/80 divide-slate-800/60' : 'bg-white border-slate-200 divide-slate-200'
                }`}>
                  {filteredFiles.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 space-y-1">
                      <FolderOpen className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-xs font-medium">No files in this folder</p>
                    </div>
                  ) : (
                    filteredFiles.map(file => (
                      <div
                        key={file.path}
                        className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* File Type Icon */}
                          <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300 flex-shrink-0">
                            {file.type === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                            {file.type === 'image' && <FileText className="w-4 h-4 text-pink-400" />}
                            {file.type === 'video' && <Video className="w-4 h-4 text-purple-400" />}
                            {file.type === 'script' && <Terminal className="w-4 h-4 text-cyan-400" />}
                            {file.type === 'secret' && <Key className="w-4 h-4 text-amber-400" />}
                            {!file.type && <FileText className="w-4 h-4 text-emerald-400" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs truncate text-slate-100" title={file.name}>
                                {file.name}
                              </span>
                              {file.privacy && file.privacy.includes('PII') && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/15 text-pink-400 font-mono">
                                  {file.privacy}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {file.snippet || file.format}
                            </p>
                          </div>
                        </div>

                        {/* File Meta */}
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-shrink-0">
                          <span className="w-16 text-right font-semibold">{file.size}</span>
                          <span className="hidden sm:inline w-28 text-right text-[11px] text-slate-500">{file.modified}</span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openFileDetails(file)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                              title="Inspect content & PII"
                            >
                              <Eye className="w-3.5 h-3.5 inline text-emerald-400" />
                            </button>

                            <button
                              onClick={() => revealInExplorer(file.path)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                              title="Reveal in Windows Explorer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 inline" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </main>
        </div>
      )}

      {/* TAB 2: CLEAN & ORGANIZE */}
      {activeTab === 'organize' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
          <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
            isDark ? 'bg-[#161922] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold">Smart Auto-Organization</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Kosha analyzes messy files across your drive and proposes clean filenames and target folders.
              </p>
            </div>

            {proposals.length > 0 && (
              <button
                onClick={() => {
                  setProposals([]);
                  showToast('Organized files successfully!');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Apply All {proposals.length} Organizers</span>
              </button>
            )}
          </div>

          <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm ${
            isDark ? 'bg-[#161922] border-slate-800 divide-slate-800/60' : 'bg-white border-slate-200 divide-slate-200'
          }`}>
            {proposals.map(item => (
              <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-rose-400 line-through">{item.oldName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">{item.newName}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <span>Target: </span>
                    <strong className="text-slate-300">{item.folder}</strong>
                  </div>
                  <div className="text-xs text-slate-400 italic">
                    <span>AI Reasoning: </span>
                    <span className="text-slate-300 not-italic">{item.reason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
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
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DRIVE STORAGE */}
      {activeTab === 'storage' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
          <div className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
            isDark ? 'bg-[#161922] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Local Disk Partition</h2>
                <p className="text-xs text-slate-400 mt-0.5">Physical Windows Drive: {driveStats.drive}</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {driveStats.usedPercent}% Used
              </span>
            </div>

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
        </div>
      )}

      {/* TAB 4: PRIVACY GUARD */}
      {activeTab === 'privacy' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
          <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
            isDark ? 'bg-[#161922] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold">Air-Gapped Privacy Engine</h2>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Kosha analyzes files strictly on your local computer. PII is redacted locally.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#161922] border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-bold text-rose-400 block">1. Local Raw File</span>
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border border-rose-500/20 min-h-[160px]">
                {redactedData.raw}
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#161922] border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-bold text-emerald-400 block">2. Air-Gapped Masked Payload</span>
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border border-emerald-500/20 min-h-[160px]">
                {redactedData.clean}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT FILE MODAL */}
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
                <span className="text-xs text-slate-400 font-semibold block mb-1.5">File Content Preview:</span>
                <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-800">
                  {fileContent || inspectFile.snippet}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-emerald-400">100% On-Device Air-Gapped</span>
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

      {/* TOAST */}
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
