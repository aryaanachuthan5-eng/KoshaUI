import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search, FolderOpen, Folder, HardDrive, ShieldCheck, Wand2,
  ExternalLink, Sun, Moon, Check, FileText, FileImage, Video,
  Archive, Key, Terminal, ArrowRight, ArrowUp, RefreshCw, Eye,
  X, ChevronRight, Home, Laptop, FolderTree, FileCode, Smartphone,
  Menu, Wifi, Copy, Globe, FolderLock, Layers, AlertCircle,
  Download, CheckCircle2, LogOut, Database
} from 'lucide-react';
import {
  readDirectoryHandle,
  redactLocalText,
  isDirectoryPickerSupported
} from './clientFileSystem.js';
import { saveHandle, loadHandle, clearHandle, verifyHandlePermission } from './idb.js';

// ─── Detect if we're the host PC (has backend API) ────────────────────────────
async function detectHostMode() {
  try {
    const res = await fetch('/api/drive/info', { signal: AbortSignal.timeout(1500) });
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

// ─── File type icon map ───────────────────────────────────────────────────────
function FileIcon({ type, className = 'w-4 h-4' }) {
  if (type === 'pdf')    return <FileText className={`${className} text-rose-400`} />;
  if (type === 'image')  return <FileImage className={`${className} text-pink-400`} />;
  if (type === 'video')  return <Video className={`${className} text-purple-400`} />;
  if (type === 'archive')return <Archive className={`${className} text-amber-500`} />;
  if (type === 'script') return <Terminal className={`${className} text-cyan-400`} />;
  if (type === 'secret') return <Key className={`${className} text-amber-400`} />;
  return <FileText className={`${className} text-slate-400`} />;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('manager');

  // ── Boot state ──────────────────────────────────────────────────────────────
  // 'loading' | 'onboarding' | 'client' | 'host'
  const [appMode, setAppMode] = useState('loading');
  const [hostInfo, setHostInfo] = useState(null); // host drive info

  // ── Client (device) file system state ───────────────────────────────────────
  const [rootHandle, setRootHandle] = useState(null);
  const [dirStack, setDirStack] = useState([]); // [{ name, handle }]
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPath, setCurrentPath] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [parentPath, setParentPath] = useState(null);

  // ── Host mode state ──────────────────────────────────────────────────────────
  const [hostPath, setHostPath] = useState('C:\\');
  const [hostParentPath, setHostParentPath] = useState(null);
  const [hostBreadcrumbs, setHostBreadcrumbs] = useState([]);
  const [hostFolders, setHostFolders] = useState([]);
  const [hostFiles, setHostFiles] = useState([]);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [pathInput, setPathInput] = useState('');

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [inspectFile, setInspectFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [toast, setToast] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // ── Clutter proposals (demo) ──────────────────────────────────────────────
  const [proposals, setProposals] = useState([
    { id: 1, selected: true, oldName: 'IMG_0029_unnamed.png', newName: 'Semester_Timetable_2026.png', folder: 'Downloads ➔ Documents/Academic', reason: 'Detected campus timetable matrix', size: '4.2 MB' },
    { id: 2, selected: true, oldName: 'scan_04812_receipt.pdf', newName: 'Tax_Assessment_FY2025.pdf', folder: 'Downloads ➔ Documents/Financial', reason: 'Detected PAN card & tax receipt headers', size: '1.1 MB' },
    { id: 3, selected: true, oldName: 'temp_rec_491.mp4', newName: 'Hackathon_Demo_Presentation.mp4', folder: 'Videos/Captures ➔ Videos/Projects', reason: "Extracted audio transcript 'Kosha project pitch'", size: '340 MB' }
  ]);

  // ── Privacy demo ──────────────────────────────────────────────────────────
  const [privacySample, setPrivacySample] = useState('finance');
  const [redactedData, setRedactedData] = useState({
    raw: `ACCOUNT STATEMENT - Q3 2026\nName: Aryan Achuthan\nPAN: ABCPA1234F\nAccount: 9812-4412-8801\nPhone: +91 98231 44512\nBalance: INR 452,190.50`,
    clean: `ACCOUNT STATEMENT - Q3 2026\nName: <PERSON_1>\nPAN: <TAX_ID_REDACTED>\nAccount: <ACCOUNT_HASH_8801>\nPhone: <PHONE_HASH>\nBalance: INR 452,190.50`,
    entitiesFound: 4
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied to clipboard!'))
      .catch(() => showToast('Could not copy — try manually', 'warning'));
  }, [showToast]);

  // ─── Dark mode sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  // ─── PWA install prompt capture ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ─── Boot sequence ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // 1. Check if we're the host PC (backend API responds)
      const host = await detectHostMode();
      if (host) {
        setHostInfo(host);
        setAppMode('host');
        navigateHostTo(host.userHome || 'C:\\');
        return;
      }

      // 2. Not host. Check IndexedDB for a saved directory handle (from previous session)
      const savedHandle = await loadHandle();
      if (savedHandle) {
        const hasPermission = await verifyHandlePermission(savedHandle);
        if (hasPermission) {
          setRootHandle(savedHandle);
          const stack = [{ name: savedHandle.name, handle: savedHandle }];
          setDirStack(stack);
          setCurrentPath(savedHandle.name);
          setBreadcrumbs([{ name: savedHandle.name, idx: 0 }]);
          setAppMode('client');
          loadClientDir(savedHandle, savedHandle.name, stack);
          return;
        }
        // Permission lost — clear stale handle
        await clearHandle();
      }

      // 3. No saved handle, show onboarding
      setAppMode('onboarding');
    })();
  }, []); // eslint-disable-line

  // ─── Grant storage access (client/device mode) ───────────────────────────────
  const grantStorageAccess = async () => {
    if (!isDirectoryPickerSupported()) {
      showToast('This browser does not support directory access. Try Chrome or Edge.', 'warning');
      return;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      await saveHandle(handle);
      const stack = [{ name: handle.name, handle }];
      setRootHandle(handle);
      setDirStack(stack);
      setCurrentPath(handle.name);
      setBreadcrumbs([{ name: handle.name, idx: 0 }]);
      setAppMode('client');
      await loadClientDir(handle, handle.name, stack);
      showToast(`Storage access granted to "${handle.name}"!`);
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast(err.message || 'Could not access storage', 'warning');
      }
    }
  };

  // ─── Load contents of a directory handle ─────────────────────────────────────
  const loadClientDir = async (handle, pathStr, stack) => {
    setIsLoading(true);
    setSearchQuery('');
    try {
      const { folders: fld, files: fls } = await readDirectoryHandle(handle, pathStr, showHidden);
      setFolders(fld);
      setFiles(fls);
      const hasParent = stack.length > 1;
      setParentPath(hasParent ? stack[stack.length - 2].name : null);
    } catch (err) {
      showToast('Could not read folder', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Client navigate into subfolder ─────────────────────────────────────────
  const navigateClientInto = async (subfolder) => {
    if (!subfolder.handle) return;
    const newStack = [...dirStack, { name: subfolder.name, handle: subfolder.handle }];
    setDirStack(newStack);
    const pathStr = newStack.map(s => s.name).join('/');
    setCurrentPath(pathStr);
    setBreadcrumbs(newStack.map((s, idx) => ({ name: s.name, idx })));
    setIsMobileSidebarOpen(false);
    await loadClientDir(subfolder.handle, pathStr, newStack);
  };

  // ─── Client navigate up ──────────────────────────────────────────────────────
  const navigateClientUp = async () => {
    if (dirStack.length <= 1) return;
    const newStack = dirStack.slice(0, -1);
    setDirStack(newStack);
    const target = newStack[newStack.length - 1];
    const pathStr = newStack.map(s => s.name).join('/');
    setCurrentPath(pathStr);
    setBreadcrumbs(newStack.map((s, idx) => ({ name: s.name, idx })));
    await loadClientDir(target.handle, pathStr, newStack);
  };

  // ─── Client navigate to breadcrumb ───────────────────────────────────────────
  const navigateClientToBreadcrumb = async (idx) => {
    const newStack = dirStack.slice(0, idx + 1);
    setDirStack(newStack);
    const target = newStack[newStack.length - 1];
    const pathStr = newStack.map(s => s.name).join('/');
    setCurrentPath(pathStr);
    setBreadcrumbs(newStack.map((s, i) => ({ name: s.name, idx: i })));
    await loadClientDir(target.handle, pathStr, newStack);
  };

  // ─── Revoke access (sign out) ─────────────────────────────────────────────────
  const revokeAccess = async () => {
    await clearHandle();
    setRootHandle(null);
    setDirStack([]);
    setFolders([]);
    setFiles([]);
    setCurrentPath('');
    setBreadcrumbs([]);
    setAppMode('onboarding');
    showToast('Storage access revoked');
  };

  // ─── Host mode navigation ─────────────────────────────────────────────────────
  const navigateHostTo = async (targetPath) => {
    setIsLoading(true);
    setIsMobileSidebarOpen(false);
    try {
      const url = targetPath
        ? `/api/drive/browse?path=${encodeURIComponent(targetPath)}&showHidden=${showHidden}`
        : `/api/drive/browse?showHidden=${showHidden}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setHostPath(data.currentPath);
        setHostParentPath(data.parentPath);
        setHostBreadcrumbs(data.breadcrumbs || []);
        setHostFolders(data.folders || []);
        setHostFiles(data.files || []);
        setPathInput(data.currentPath);
        setIsEditingPath(false);
      } else {
        showToast(data.error || 'Could not open folder', 'warning');
      }
    } catch {
      showToast('Backend unreachable', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh on showHidden change
  useEffect(() => {
    if (appMode === 'host') navigateHostTo(hostPath);
    if (appMode === 'client' && dirStack.length > 0) {
      const top = dirStack[dirStack.length - 1];
      loadClientDir(top.handle, currentPath, dirStack);
    }
  }, [showHidden]); // eslint-disable-line

  // ─── Inspect file ─────────────────────────────────────────────────────────────
  const openFileDetails = async (file) => {
    setInspectFile(file);
    setFileContent('');
    if (file.fileObj) {
      try {
        const text = await file.fileObj.text();
        const { sanitized } = redactLocalText(text.slice(0, 2500));
        setFileContent(sanitized);
      } catch { setFileContent(file.snippet || ''); }
      return;
    }
    try {
      const res = await fetch(`/api/drive/file?path=${encodeURIComponent(file.path)}`);
      const data = await res.json();
      setFileContent(data.sanitizedContent || data.rawContent || file.snippet || '');
    } catch { setFileContent(file.snippet || ''); }
  };

  // ─── Reveal in Explorer (host only) ──────────────────────────────────────────
  const revealInExplorer = async (filePath) => {
    try {
      await fetch('/api/drive/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      showToast('Opened in Windows Explorer');
    } catch { showToast('Opened on device', 'info'); }
  };

  // ─── Filtered lists ───────────────────────────────────────────────────────────
  const srcFolders = appMode === 'host' ? hostFolders : folders;
  const srcFiles   = appMode === 'host' ? hostFiles   : files;

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return srcFolders;
    const q = searchQuery.toLowerCase();
    return srcFolders.filter(f => f.name.toLowerCase().includes(q));
  }, [srcFolders, searchQuery]);

  const filteredFiles = useMemo(() => {
    return srcFiles.filter(f => {
      if (activeCategory !== 'all' && f.type !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || (f.snippet && f.snippet.toLowerCase().includes(q));
      }
      return true;
    });
  }, [srcFiles, searchQuery, activeCategory]);

  const displayPath = appMode === 'host' ? hostPath : currentPath;
  const displayBreadcrumbs = appMode === 'host' ? hostBreadcrumbs : breadcrumbs;
  const canGoUp = appMode === 'host' ? !!hostParentPath : dirStack.length > 1;

  // ─── Theme classes ────────────────────────────────────────────────────────────
  const bg    = isDark ? 'bg-[#0c0d12]'    : 'bg-[#f4f6fa]';
  const card  = isDark ? 'bg-[#12151f]'    : 'bg-white';
  const card2 = isDark ? 'bg-[#161922]'    : 'bg-white';
  const border = isDark ? 'border-slate-800' : 'border-slate-200';
  const text  = isDark ? 'text-slate-100'  : 'text-slate-800';
  const muted = isDark ? 'text-slate-400'  : 'text-slate-500';

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Loading
  // ═══════════════════════════════════════════════════════════════════════════
  if (appMode === 'loading') {
    return (
      <div className={`min-h-screen ${bg} ${text} flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-3xl font-black text-slate-950 mx-auto animate-pulse">K</div>
          <p className={`text-sm ${muted}`}>Starting Kosha…</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Onboarding — grant access screen
  // ═══════════════════════════════════════════════════════════════════════════
  if (appMode === 'onboarding') {
    const supported = isDirectoryPickerSupported();
    return (
      <div className={`min-h-screen ${bg} ${text} flex flex-col items-center justify-center p-6`}>
        {/* Theme toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center border transition ${
            isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-full max-w-md space-y-8 text-center">

          {/* Logo */}
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center text-4xl font-black text-slate-950 mx-auto shadow-lg shadow-emerald-500/25">
              K
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Kosha</h1>
              <p className={`text-sm ${muted} mt-1`}>File System Intelligence</p>
            </div>
          </div>

          {/* Main CTA card */}
          <div className={`rounded-2xl border p-6 space-y-5 ${card} ${border}`}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <FolderLock className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base">Grant Storage Access</h2>
              </div>
              <p className={`text-xs ${muted} leading-relaxed`}>
                Kosha needs access to your device's storage to browse files — just like a file manager app.
                Your files <strong className="text-emerald-400">never leave your device</strong>.
              </p>
            </div>

            {supported ? (
              <button
                onClick={grantStorageAccess}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-sm transition duration-150 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Grant Access to My Storage
              </button>
            ) : (
              <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Browser not supported</span>
                </div>
                <p className="text-xs text-slate-400">
                  Open this app in <strong className="text-white">Chrome</strong> or <strong className="text-white">Edge</strong> to browse your files.
                  Safari and Firefox don't support the File System Access API.
                </p>
              </div>
            )}

            {/* How it works */}
            <div className={`text-xs ${muted} space-y-2`}>
              {[
                ['🔒', 'Files never uploaded — everything stays on your device'],
                ['💾', 'Access is remembered — no need to grant again after install'],
                ['📂', 'Browse all folders just like a native file manager'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-start gap-2 text-left">
                  <span className="text-base leading-none">{icon}</span>
                  <span className="leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Install as app prompt */}
          {installPrompt && !isInstalled && (
            <button
              onClick={async () => {
                installPrompt.prompt();
                const { outcome } = await installPrompt.userChoice;
                if (outcome === 'accepted') {
                  setIsInstalled(true);
                  setInstallPrompt(null);
                  showToast('Kosha installed! Access persists across sessions.');
                }
              }}
              className={`w-full max-w-md py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                isDark ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-emerald-400 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Install Kosha as an App (keeps storage access permanently)
            </button>
          )}

          <p className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            This is a local-only PWA. No servers. No cloud.
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Main App (client or host mode)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${bg} ${text}`}>

      {/* ── TOP HEADER ────────────────────────────────────────────────────── */}
      <header className={`h-14 border-b px-4 sm:px-5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md ${
        isDark ? 'bg-[#12151f]/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-base shadow-sm">K</div>
            <div>
              <span className="font-extrabold text-base tracking-tight">Kosha</span>
              <span className={`hidden sm:inline-block ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                appMode === 'host'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {appMode === 'host' ? '🖥 HOST PC' : `📱 ${rootHandle?.name?.toUpperCase() || 'THIS DEVICE'}`}
              </span>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className={`flex items-center gap-1 p-1 rounded-xl text-xs ${isDark ? 'bg-slate-900/50 border border-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
          {[
            { id: 'manager', icon: FolderTree, label: 'Explorer' },
            { id: 'organize', icon: Wand2, label: 'Organize' },
            { id: 'storage', icon: HardDrive, label: 'Storage' },
            { id: 'privacy', icon: ShieldCheck, label: 'Privacy' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : `${muted} hover:text-slate-200`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Revoke access (client mode) */}
          {appMode === 'client' && (
            <button
              onClick={revokeAccess}
              title="Change storage root"
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-500'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Dark/light toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── EXPLORER TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'manager' && (
        <div className="flex-1 flex overflow-hidden relative">

          {/* SIDEBAR */}
          <aside className={`
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            fixed md:static inset-y-0 left-0 z-40 w-60 border-r flex flex-col justify-between p-3 gap-3
            transition-transform duration-200 ease-in-out flex-shrink-0
            ${isDark ? `${card} ${border}` : `bg-white ${border}`}
          `}>
            <div className="space-y-3 overflow-y-auto flex-1">
              <div className="flex items-center justify-between px-1.5">
                <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${muted}`}>Quick Access</span>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick locations */}
              <div className="space-y-0.5 text-xs font-medium">
                {appMode === 'host' ? (
                  // Host PC shortcuts
                  [
                    { label: 'Local Disk (C:\\)', path: 'C:\\', icon: HardDrive, color: 'text-emerald-400' },
                    { label: 'User Home', path: hostInfo?.userHome, icon: Home, color: 'text-cyan-400' },
                    { label: 'Desktop', path: hostInfo?.defaultLocations?.desktop, icon: Laptop, color: 'text-purple-400' },
                    { label: 'Downloads', path: hostInfo?.defaultLocations?.downloads, icon: FolderOpen, color: 'text-amber-400' },
                    { label: 'Documents', path: hostInfo?.defaultLocations?.documents, icon: FileText, color: 'text-pink-400' },
                  ].filter(l => l.path).map(({ label, path, icon: Icon, color }) => (
                    <button
                      key={path}
                      onClick={() => navigateHostTo(path)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl transition cursor-pointer text-left ${
                        hostPath.toLowerCase() === path?.toLowerCase()
                          ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25'
                          : `${muted} hover:text-slate-100 ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100'}`
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                      <span className="truncate">{label}</span>
                    </button>
                  ))
                ) : (
                  // Client device — show dir stack as quick nav
                  dirStack.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigateClientToBreadcrumb(idx)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl transition cursor-pointer text-left ${
                        idx === dirStack.length - 1
                          ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25'
                          : `${muted} hover:text-slate-100 ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100'}`
                      }`}
                    >
                      {idx === 0
                        ? <Database className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        : <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      }
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Hidden files toggle */}
              <label className={`flex items-center gap-2 text-xs cursor-pointer select-none px-2 pt-1 ${muted}`}>
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={e => setShowHidden(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-emerald-500"
                />
                Show hidden files
              </label>
            </div>

            {/* Bottom info */}
            <div className={`p-2.5 rounded-xl border text-[11px] font-mono space-y-1 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              {appMode === 'host' ? (
                <>
                  <div className={`flex items-center gap-1.5 ${muted}`}><Wifi className="w-3 h-3" /><span>LAN Access</span></div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold truncate">{hostInfo?.localIP}:3000</span>
                    <button onClick={() => copyToClipboard(`http://${hostInfo?.localIP}:3000`)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer flex-shrink-0">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Open on any device on same Wi-Fi</div>
                </>
              ) : (
                <>
                  <div className={`flex items-center gap-1.5 ${muted}`}><ShieldCheck className="w-3 h-3 text-emerald-400" /><span>Air-Gapped</span></div>
                  <div className="text-emerald-400 font-bold">Files never leave device</div>
                  <button onClick={revokeAccess} className={`text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer`}>Change root folder</button>
                </>
              )}
            </div>
          </aside>

          {/* Mobile backdrop */}
          {isMobileSidebarOpen && (
            <div onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" />
          )}

          {/* MAIN BROWSER AREA */}
          <main className="flex-1 flex flex-col overflow-hidden">

            {/* ADDRESS BAR */}
            <div className={`p-2.5 border-b flex items-center gap-2 ${isDark ? 'bg-[#151926]/90 border-slate-800' : 'bg-white border-slate-200'}`}>
              {/* Back/up button */}
              <button
                onClick={() => appMode === 'host' ? navigateHostTo(hostParentPath) : navigateClientUp()}
                disabled={!canGoUp}
                className={`p-2 rounded-xl border flex items-center justify-center flex-shrink-0 transition ${
                  canGoUp
                    ? `${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'} cursor-pointer`
                    : 'bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>

              {/* Breadcrumbs */}
              <div className="flex-1 min-w-0">
                {isEditingPath && appMode === 'host' ? (
                  <form onSubmit={e => { e.preventDefault(); if (pathInput.trim()) navigateHostTo(pathInput.trim()); }} className="flex gap-2">
                    <input
                      type="text"
                      value={pathInput}
                      onChange={e => setPathInput(e.target.value)}
                      onBlur={() => setIsEditingPath(false)}
                      autoFocus
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-emerald-500 ${isDark ? 'bg-slate-950 border-emerald-500 text-slate-100' : 'bg-white border-emerald-500 text-slate-800'}`}
                    />
                  </form>
                ) : (
                  <div
                    onClick={() => { if (appMode === 'host') { setPathInput(hostPath); setIsEditingPath(true); }}}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 overflow-x-auto text-xs font-mono scrollbar-none ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                    } ${appMode === 'host' ? 'cursor-text hover:border-slate-600' : 'cursor-default'}`}
                  >
                    {appMode === 'host'
                      ? hostBreadcrumbs.map((crumb, idx) => (
                          <React.Fragment key={crumb.path}>
                            <button
                              type="button"
                              onClick={() => navigateHostTo(crumb.path)}
                              className="font-semibold text-slate-300 whitespace-nowrap hover:text-emerald-400 cursor-pointer"
                            >
                              {crumb.name}
                            </button>
                            {idx < hostBreadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                          </React.Fragment>
                        ))
                      : breadcrumbs.map((crumb, idx) => (
                          <React.Fragment key={crumb.idx}>
                            <button
                              type="button"
                              onClick={() => navigateClientToBreadcrumb(crumb.idx)}
                              className="font-semibold text-slate-300 whitespace-nowrap hover:text-emerald-400 cursor-pointer"
                            >
                              {crumb.name}
                            </button>
                            {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                          </React.Fragment>
                        ))
                    }
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="w-32 sm:w-44 relative flex-shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter…"
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              {/* Refresh */}
              <button
                onClick={() => appMode === 'host' ? navigateHostTo(hostPath) : loadClientDir(dirStack[dirStack.length - 1]?.handle, currentPath, dirStack)}
                className={`p-2 rounded-xl border transition cursor-pointer flex-shrink-0 ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'}`}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* CONTENTS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">

              {/* FOLDERS */}
              {filteredFolders.length > 0 && (
                <div className="space-y-2">
                  <div className={`flex items-center justify-between text-xs font-mono px-1 ${muted}`}>
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Folders ({filteredFolders.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {filteredFolders.map(folder => (
                      <div
                        key={folder.path}
                        onClick={() => appMode === 'host' ? navigateHostTo(folder.path) : navigateClientInto(folder)}
                        className={`p-3 rounded-xl border flex items-center gap-2 transition cursor-pointer group select-none active:scale-95 ${
                          isDark
                            ? 'bg-[#151926] border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-800/40'
                            : 'bg-white border-slate-200 hover:border-emerald-400/50 hover:bg-slate-50'
                        }`}
                      >
                        <Folder className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <div className="min-w-0">
                          <div className={`font-semibold text-xs truncate ${isDark ? 'text-slate-200 group-hover:text-emerald-400' : 'text-slate-700 group-hover:text-emerald-600'}`}>
                            {folder.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">Folder</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FILES */}
              <div className="space-y-2">
                <div className={`flex items-center justify-between text-xs font-mono px-1 ${muted}`}>
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Files ({filteredFiles.length})</span>
                  {/* Category filter */}
                  <div className="flex items-center gap-1">
                    {['all', 'image', 'video', 'text', 'script', 'archive'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                          activeCategory === cat
                            ? 'bg-emerald-500 text-slate-950'
                            : `${muted} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm ${
                  isDark ? `${card2} border-slate-800/80 divide-slate-800/60` : `bg-white border-slate-200 divide-slate-200`
                }`}>
                  {filteredFiles.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <FolderOpen className={`w-8 h-8 mx-auto opacity-20`} />
                      <p className={`text-xs font-medium ${muted}`}>
                        {isLoading ? 'Loading files…' : 'No files here'}
                      </p>
                    </div>
                  ) : (
                    filteredFiles.map(file => (
                      <div
                        key={file.path}
                        className={`p-3 px-3.5 flex items-center justify-between gap-3 transition group ${isDark ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                            <FileIcon type={file.type} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-semibold text-xs truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`} title={file.name}>
                                {file.name}
                              </span>
                              {file.privacy && file.privacy.includes('PII') && (
                                <span className="text-[9px] px-1.5 py-0 rounded bg-pink-500/15 text-pink-400 font-mono flex-shrink-0">{file.privacy}</span>
                              )}
                            </div>
                            <p className={`text-[11px] ${muted} line-clamp-1`}>{file.snippet || file.format}</p>
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 text-xs font-mono flex-shrink-0 ${muted}`}>
                          <span className="w-14 text-right text-[11px] font-semibold">{file.size}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openFileDetails(file)}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                              title="Preview file"
                            >
                              <Eye className="w-3.5 h-3.5 inline text-emerald-400" />
                            </button>
                            {appMode === 'host' && (
                              <button
                                onClick={() => revealInExplorer(file.path)}
                                className={`hidden sm:inline-block px-2 py-1 rounded-lg text-xs transition cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                                title="Reveal in Explorer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 inline" />
                              </button>
                            )}
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

      {/* ── ORGANIZE TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'organize' && (
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${card2} ${border}`}>
            <div>
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold">Smart Auto-Organization</h2>
              </div>
              <p className={`text-xs ${muted} mt-1`}>Kosha proposes renaming & moving messy files to structured folders.</p>
            </div>
            {proposals.length > 0 && (
              <button
                onClick={() => { setProposals([]); showToast('All files organized!'); }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Apply All ({proposals.length})
              </button>
            )}
          </div>

          <div className={`rounded-2xl border divide-y overflow-hidden ${card2} ${border} ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
            {proposals.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                <p className={`text-xs ${muted}`}>All organized! No pending proposals.</p>
              </div>
            ) : proposals.map(item => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-rose-400 line-through">{item.oldName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">{item.newName}</span>
                  </div>
                  <div className={`text-xs ${muted}`}>Target: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.folder}</strong></div>
                  <div className={`text-xs italic ${muted}`}>AI: <span className={isDark ? 'text-slate-300 not-italic' : 'text-slate-600 not-italic'}>{item.reason}</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono ${muted}`}>{item.size}</span>
                  <button
                    onClick={() => { setProposals(p => p.filter(x => x.id !== item.id)); showToast(`Organized ${item.newName}`); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STORAGE TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'storage' && (
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">

          {appMode === 'host' && hostInfo && (
            <>
              <div className={`p-5 rounded-2xl border space-y-4 ${card2} ${border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h2 className="text-base font-bold">Local Disk {hostInfo.drive}</h2>
                      <p className={`text-xs ${muted}`}>Host machine storage</p>
                    </div>
                  </div>
                  <span className={`text-xs font-mono px-2.5 py-1 rounded-full font-bold ${
                    hostInfo.usedPercent > 85 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : hostInfo.usedPercent > 65 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>{hostInfo.usedPercent}% Used</span>
                </div>
                <div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${hostInfo.usedPercent > 85 ? 'bg-rose-500' : hostInfo.usedPercent > 65 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${hostInfo.usedPercent}%` }} />
                  </div>
                  <div className={`flex justify-between text-xs ${muted} font-mono mt-1.5`}>
                    <span>{hostInfo.usedGB} GB Used</span>
                    <span>{hostInfo.freeGB} GB Free of {hostInfo.totalGB} GB</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['Total', `${hostInfo.totalGB} GB`, 'text-slate-300'], ['Used', `${hostInfo.usedGB} GB`, 'text-rose-400'], ['Free', `${hostInfo.freeGB} GB`, 'text-emerald-400']].map(([l, v, c]) => (
                    <div key={l} className={`p-3 rounded-xl text-center border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`text-base font-bold font-mono ${c}`}>{v}</div>
                      <div className={`text-[11px] ${muted} mt-0.5`}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-5 rounded-2xl border space-y-4 ${card2} ${border}`}>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h2 className="text-base font-bold">Access from Other Devices</h2>
                    <p className={`text-xs ${muted}`}>Any device on the same Wi-Fi can open Kosha and browse <em>this machine's</em> files</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isDark ? 'bg-slate-900/60 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div>
                    <div className={`text-xs ${muted} font-mono`}>Network URL:</div>
                    <div className="text-emerald-400 font-bold font-mono">http://{hostInfo.localIP}:3000</div>
                  </div>
                  <button onClick={() => copyToClipboard(`http://${hostInfo.localIP}:3000`)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer">
                    <Copy className="w-3.5 h-3.5" />Copy Link
                  </button>
                </div>
                <div className={`p-3.5 rounded-xl text-xs space-y-2 ${isDark ? 'bg-slate-900/40 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
                  <p className={`font-semibold ${muted}`}>Important distinction:</p>
                  <div className="space-y-1 text-slate-500">
                    <p>• Opening this URL on another device = browse <strong className="text-slate-300">THIS PC's</strong> files (via the backend)</p>
                    <p>• The other device's own files can be accessed by the Kosha PWA installed <strong className="text-slate-300">on that device</strong></p>
                  </div>
                </div>
              </div>
            </>
          )}

          {appMode === 'client' && (
            <div className={`p-5 rounded-2xl border space-y-4 ${card2} ${border}`}>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold">This Device Storage</h2>
                  <p className={`text-xs ${muted}`}>Browsing: <code className="text-emerald-400">{rootHandle?.name}</code></p>
                </div>
              </div>
              <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold">100% Air-Gapped — files never leave this device</span>
                </div>
                <div className="text-slate-500">Files: {srcFiles.length} · Folders: {srcFolders.length} in current view</div>
              </div>
              <button
                onClick={revokeAccess}
                className={`text-xs font-semibold text-rose-400 hover:text-rose-300 underline cursor-pointer`}
              >
                Change root folder / Revoke access
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── PRIVACY TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'privacy' && (
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${card2} ${border}`}>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold">Air-Gapped Privacy Engine</h2>
              </div>
              <p className={`text-xs ${muted} mt-1 max-w-md`}>PII is detected and redacted locally in browser memory. Zero network calls.</p>
            </div>
            <div className={`flex rounded-lg p-1 text-xs ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {['finance', 'academic', 'secrets'].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setPrivacySample(s);
                    if (s === 'finance') setRedactedData({ raw: `ACCOUNT STATEMENT - Q3 2026\nName: Aryan Achuthan\nPAN: ABCPA1234F\nAccount: 9812-4412-8801\nPhone: +91 98231 44512\nBalance: INR 452,190.50`, clean: `ACCOUNT STATEMENT - Q3 2026\nName: <PERSON_1>\nPAN: <TAX_ID_REDACTED>\nAccount: <ACCOUNT_HASH_8801>\nPhone: <PHONE_HASH>\nBalance: INR 452,190.50`, entitiesFound: 4 });
                    else if (s === 'academic') setRedactedData({ raw: `COLLEGE GRADE RECORD\nStudent: Aryan Achuthan\nRoll: 22CS014\nEmail: aryaanachuthan5@gmail.com\nGPA: 9.42 / 10.0`, clean: `COLLEGE GRADE RECORD\nStudent: <PERSON_1>\nRoll: <STUDENT_ID_MASKED>\nEmail: <EMAIL_MASKED>\nGPA: 9.42 / 10.0`, entitiesFound: 3 });
                    else setRedactedData({ raw: `# ENV CONFIG\nOPENAI_KEY="sk-proj-94819a0bc4"\nDB_URL="postgres://admin:pass@localhost/db"`, clean: `# ENV CONFIG\nOPENAI_KEY="<DEV_SECRET_REDACTED>"\nDB_URL="<DB_CREDS_REDACTED>"`, entitiesFound: 2 });
                  }}
                  className={`px-3 py-1 rounded capitalize font-medium transition cursor-pointer ${privacySample === s ? 'bg-emerald-500 text-slate-950 font-bold' : `${muted} hover:text-slate-200`}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl border space-y-2 ${card2} ${border}`}>
              <span className="text-xs font-bold text-rose-400 block">Raw File Content</span>
              <div className={`p-3.5 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border min-h-[140px] ${isDark ? 'bg-slate-950 border-rose-500/20' : 'bg-slate-50 border-rose-200'}`}>
                {redactedData.raw}
              </div>
            </div>
            <div className={`p-4 rounded-2xl border space-y-2 ${card2} ${border}`}>
              <span className="text-xs font-bold text-emerald-400 block">Air-Gapped Masked Output</span>
              <div className={`p-3.5 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border min-h-[140px] ${isDark ? 'bg-slate-950 border-emerald-500/20' : 'bg-slate-50 border-emerald-200'}`}>
                {redactedData.clean}
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-4 rounded-xl border text-xs ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-emerald-400">{redactedData.entitiesFound} PII entities redacted</span>
              <span className={` ml-2 ${muted}`}>· 0 bytes sent to any server · latency: 0.38ms</span>
            </div>
          </div>
        </div>
      )}

      {/* ── FILE INSPECT MODAL ────────────────────────────────────────────── */}
      {inspectFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${card2} ${border}`}>
            <div className={`p-4 border-b ${border} flex items-center justify-between`}>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate">{inspectFile.name}</h3>
                <p className={`text-[11px] font-mono truncate ${muted}`}>{inspectFile.path}</p>
              </div>
              <button onClick={() => setInspectFile(null)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ml-2 flex-shrink-0 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className={`flex gap-4 text-xs font-mono ${muted}`}>
                <span>Size: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{inspectFile.size}</strong></span>
                <span>Type: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{inspectFile.format}</strong></span>
                {inspectFile.modified && <span>Modified: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{inspectFile.modified}</strong></span>}
              </div>
              <div>
                <span className={`text-xs font-semibold ${muted} block mb-1.5`}>Content Preview:</span>
                <div className={`p-3 rounded-xl font-mono text-xs whitespace-pre-wrap max-h-60 overflow-y-auto border ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  {fileContent || inspectFile.snippet || '(binary or empty file)'}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> On-device only
                </span>
                {appMode === 'host' && (
                  <button
                    onClick={() => { revealInExplorer(inspectFile.path); setInspectFile(null); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer"
                  >
                    Open in Explorer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-4 z-50 animate-in slide-in-from-bottom-2">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 border ${
            toast.type === 'warning'
              ? 'bg-slate-900 border-amber-500/40 text-amber-300'
              : 'bg-slate-900 border-emerald-500/40 text-slate-100'
          }`}>
            {toast.type === 'warning' ? <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
            {toast.msg}
          </div>
        </div>
      )}

    </div>
  );
}
