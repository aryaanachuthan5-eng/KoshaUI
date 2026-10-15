import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';

export const USER_HOMEDIR = os.homedir();

export const DEFAULT_LOCATIONS = {
  workspace: process.cwd(),
  desktop: path.join(USER_HOMEDIR, 'Desktop'),
  documents: path.join(USER_HOMEDIR, 'Documents'),
  downloads: path.join(USER_HOMEDIR, 'Downloads'),
  userHome: USER_HOMEDIR,
  rootDrive: process.platform === 'win32' ? 'C:\\' : '/'
};

export const EXTENSION_MAP = {
  '.pdf': { format: 'PDF Document', type: 'pdf' },
  '.docx': { format: 'Word Document', type: 'text' },
  '.doc': { format: 'Word Document', type: 'text' },
  '.pptx': { format: 'PowerPoint Presentation', type: 'text' },
  '.xlsx': { format: 'Excel Spreadsheet', type: 'text' },
  '.xls': { format: 'Excel Spreadsheet', type: 'text' },
  '.csv': { format: 'CSV Dataset', type: 'text' },
  '.txt': { format: 'Plain Text', type: 'text' },
  '.md': { format: 'Markdown Document', type: 'text' },
  '.json': { format: 'JSON Data', type: 'text' },
  '.png': { format: 'PNG Image', type: 'image' },
  '.jpg': { format: 'JPEG Image', type: 'image' },
  '.jpeg': { format: 'JPEG Image', type: 'image' },
  '.svg': { format: 'Vector SVG', type: 'image' },
  '.mp4': { format: 'H.264 Video', type: 'video' },
  '.mov': { format: 'QuickTime Video', type: 'video' },
  '.mkv': { format: 'MKV Video', type: 'video' },
  '.zip': { format: 'ZIP Archive', type: 'archive' },
  '.tar': { format: 'TAR Archive', type: 'archive' },
  '.gz': { format: 'GZip Archive', type: 'archive' },
  '.js': { format: 'JavaScript Source', type: 'script' },
  '.jsx': { format: 'React JSX Source', type: 'script' },
  '.ts': { format: 'TypeScript Source', type: 'script' },
  '.tsx': { format: 'React TSX Source', type: 'script' },
  '.py': { format: 'Python Script', type: 'script' },
  '.env': { format: 'Secret Config', type: 'secret' },
  '.sql': { format: 'SQL Script', type: 'script' },
  '.lnk': { format: 'Windows Shortcut', type: 'script' },
  '.html': { format: 'HTML Document', type: 'text' },
  '.css': { format: 'CSS Stylesheet', type: 'text' }
};

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function redactLocalText(text) {
  let sanitized = text;
  let piiCount = 0;

  sanitized = sanitized.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, () => {
    piiCount++;
    return '<EMAIL_MASKED>';
  });

  sanitized = sanitized.replace(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,5}/g, (match) => {
    if (match.length >= 7) {
      piiCount++;
      return '<PHONE_HASH>';
    }
    return match;
  });

  sanitized = sanitized.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, () => {
    piiCount++;
    return '<TAX_ID_REDACTED>';
  });

  sanitized = sanitized.replace(/(sk-[a-zA-Z0-9_-]{12,}|ghp_[a-zA-Z0-9]{12,}|postgres:\/\/[^"'\s]+)/g, () => {
    piiCount++;
    return '<DEV_SECRET_REDACTED>';
  });

  return { sanitized, piiCount };
}

export function getDriveInfo() {
  const driveRoot = process.platform === 'win32' ? 'C:\\' : '/';
  const stats = fs.statfsSync(driveRoot);

  const totalBytes = stats.blocks * stats.bsize;
  const freeBytes = stats.bavail * stats.bsize;
  const usedBytes = totalBytes - freeBytes;

  return {
    success: true,
    drive: driveRoot,
    totalGB: parseFloat((totalBytes / (1024 ** 3)).toFixed(1)),
    usedGB: parseFloat((usedBytes / (1024 ** 3)).toFixed(1)),
    freeGB: parseFloat((freeBytes / (1024 ** 3)).toFixed(1)),
    usedPercent: Math.round((usedBytes / totalBytes) * 100),
    userHome: USER_HOMEDIR,
    defaultLocations: DEFAULT_LOCATIONS
  };
}

// Full File Manager Directory Browser
export function browseDirectory(targetPath, showHidden = false) {
  let resolved = targetPath ? path.resolve(targetPath) : USER_HOMEDIR;

  if (!fs.existsSync(resolved)) {
    resolved = USER_HOMEDIR;
  }

  const parsed = path.parse(resolved);
  const isRoot = resolved.toLowerCase() === parsed.root.toLowerCase();
  const parentPath = isRoot ? null : path.dirname(resolved);

  // Breadcrumbs generator
  const parts = resolved.split(path.sep).filter(Boolean);
  const breadcrumbs = [];
  let accum = parsed.root;
  breadcrumbs.push({ name: parsed.root, path: parsed.root });

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.toLowerCase() === parsed.root.replace(path.sep, '').toLowerCase()) continue;
    accum = path.join(accum, part);
    breadcrumbs.push({ name: part, path: accum });
  }

  let entries = [];
  try {
    entries = fs.readdirSync(resolved, { withFileTypes: true });
  } catch (err) {
    return {
      success: false,
      error: `Could not read folder: ${err.message}`,
      currentPath: resolved,
      parentPath,
      isRoot,
      breadcrumbs,
      folders: [],
      files: []
    };
  }

  const folders = [];
  const files = [];

  for (const entry of entries) {
    const isDotfile = entry.name.startsWith('.');
    if (isDotfile && !showHidden) continue;

    const fullPath = path.join(resolved, entry.name);

    if (entry.isDirectory()) {
      try {
        const stat = fs.statSync(fullPath);
        folders.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          isDotfile,
          modified: stat.mtime.toLocaleDateString() + ' ' + stat.mtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } catch {
        folders.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          isDotfile,
          modified: '--'
        });
      }
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(fullPath);
        const ext = path.extname(entry.name).toLowerCase();
        const formatMeta = EXTENSION_MAP[ext] || { format: ext ? `${ext.toUpperCase()} File` : 'File', type: 'text' };

        let snippet = '';
        let piiStatus = 'Air-Gapped';

        const isTextual = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.env', '.py', '.csv', '.html', '.css', '.sql'].includes(ext) || isDotfile;
        if (isTextual && stat.size < 300000) {
          try {
            const sampleContent = fs.readFileSync(fullPath, { encoding: 'utf-8', flag: 'r' }).slice(0, 300);
            const { sanitized, piiCount } = redactLocalText(sampleContent);
            snippet = sanitized.replace(/\s+/g, ' ').trim();
            if (piiCount > 0) piiStatus = `${piiCount} PII Masked`;
          } catch {
            snippet = `Local ${formatMeta.format} file.`;
          }
        } else if (formatMeta.type === 'image') {
          snippet = `Image (${formatBytes(stat.size)}). Local OCR ready.`;
        } else if (formatMeta.type === 'video') {
          snippet = `Video (${formatBytes(stat.size)}). Local frame analyzer ready.`;
        } else if (ext === '.docx' || ext === '.doc') {
          snippet = `Word document (${formatBytes(stat.size)}).`;
        } else if (ext === '.xlsx' || ext === '.xls') {
          snippet = `Excel spreadsheet (${formatBytes(stat.size)}).`;
        } else {
          snippet = `${formatMeta.format} on disk.`;
        }

        files.push({
          name: entry.name,
          path: fullPath,
          isDirectory: false,
          isDotfile,
          format: formatMeta.format,
          type: formatMeta.type,
          size: formatBytes(stat.size),
          sizeBytes: stat.size,
          modified: stat.mtime.toLocaleDateString() + ' ' + stat.mtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          privacy: piiStatus,
          snippet
        });
      } catch {
        // Skip inaccessible files
      }
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  return {
    success: true,
    currentPath: resolved,
    parentPath,
    isRoot,
    breadcrumbs,
    folders,
    files,
    totalItems: folders.length + files.length,
    userHome: USER_HOMEDIR,
    defaultLocations: DEFAULT_LOCATIONS
  };
}

export function getFilePreview(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, error: 'File not found' };
  }

  const stat = fs.statSync(filePath);
  let content = '';
  const ext = path.extname(filePath).toLowerCase();

  const isTextual = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.env', '.py', '.csv', '.html', '.css', '.sql'].includes(ext);
  if (isTextual && stat.size < 500000) {
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      content = `[File encoding could not be read as UTF-8]`;
    }
  } else {
    content = `[File size: ${formatBytes(stat.size)}. Binary preview limited for performance.]`;
  }

  const { sanitized, piiCount } = redactLocalText(content);

  return {
    success: true,
    name: path.basename(filePath),
    path: filePath,
    size: formatBytes(stat.size),
    sizeBytes: stat.size,
    rawContent: content.slice(0, 2500),
    sanitizedContent: sanitized.slice(0, 2500),
    piiCount,
    modified: stat.mtime.toLocaleString()
  };
}

export function openInExplorer(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, error: 'Path not found' };
  }

  if (process.platform === 'win32') {
    exec(`explorer.exe /select,"${filePath.replace(/\//g, '\\')}"`);
  } else if (process.platform === 'darwin') {
    exec(`open -R "${filePath}"`);
  } else {
    exec(`xdg-open "${path.dirname(filePath)}"`);
  }

  return { success: true, message: `Opened in file manager: ${filePath}` };
}
