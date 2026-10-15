// Client-Side File System Engine for any device (Desktop, Mac, Linux, Phone)
// Uses the W3C File System Access API with input fallback

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
  '.html': { format: 'HTML Document', type: 'text' },
  '.css': { format: 'CSS Stylesheet', type: 'text' }
};

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Client-Side Presidio NER Regex Masking (Runs 100% in browser memory)
export function redactLocalText(text) {
  let sanitized = text || '';
  let piiCount = 0;

  // Emails
  sanitized = sanitized.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, () => {
    piiCount++;
    return '<EMAIL_MASKED>';
  });

  // Phone numbers
  sanitized = sanitized.replace(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,5}/g, (match) => {
    if (match.length >= 7) {
      piiCount++;
      return '<PHONE_HASH>';
    }
    return match;
  });

  // Tax PAN / SSN / Student IDs
  sanitized = sanitized.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, () => {
    piiCount++;
    return '<TAX_ID_REDACTED>';
  });

  // Dev API Keys & Secrets
  sanitized = sanitized.replace(/(sk-[a-zA-Z0-9_-]{12,}|ghp_[a-zA-Z0-9]{12,}|postgres:\/\/[^"'\s]+)/g, () => {
    piiCount++;
    return '<DEV_SECRET_REDACTED>';
  });

  return { sanitized, piiCount };
}

// Check if modern File System Access API is supported
export function isDirectoryPickerSupported() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

// Open folder picker on client device
export async function pickClientDirectory() {
  if (!isDirectoryPickerSupported()) {
    throw new Error('Native Directory Picker not supported on this browser. Use mobile folder upload instead.');
  }
  const rootHandle = await window.showDirectoryPicker({ mode: 'read' });
  return rootHandle;
}

// Read contents of a DirectoryHandle
export async function readDirectoryHandle(dirHandle, pathPrefix = '', showHidden = false) {
  const folders = [];
  const files = [];

  for await (const entry of dirHandle.values()) {
    const isDotfile = entry.name.startsWith('.');
    if (isDotfile && !showHidden) continue;

    const fullPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;

    if (entry.kind === 'directory') {
      folders.push({
        name: entry.name,
        path: fullPath,
        handle: entry,
        isDirectory: true,
        isDotfile,
        modified: 'Folder'
      });
    } else if (entry.kind === 'file') {
      try {
        const fileObj = await entry.getFile();
        const ext = entry.name.includes('.') ? '.' + entry.name.split('.').pop().toLowerCase() : '';
        const formatMeta = EXTENSION_MAP[ext] || { format: ext ? `${ext.toUpperCase()} File` : 'File', type: 'text' };

        let snippet = '';
        let piiStatus = 'Air-Gapped';

        // Read text snippet for small text files
        const isText = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.env', '.py', '.csv', '.html', '.css', '.sql'].includes(ext) || isDotfile;
        if (isText && fileObj.size < 200000) {
          try {
            const rawText = await fileObj.text();
            const { sanitized, piiCount } = redactLocalText(rawText.slice(0, 300));
            snippet = sanitized.replace(/\s+/g, ' ').trim();
            if (piiCount > 0) piiStatus = `${piiCount} PII Masked`;
          } catch {
            snippet = `Local ${formatMeta.format}`;
          }
        } else if (formatMeta.type === 'image') {
          snippet = `Image (${formatBytes(fileObj.size)}) on this device.`;
        } else {
          snippet = `${formatMeta.format} on this device.`;
        }

        files.push({
          name: entry.name,
          path: fullPath,
          handle: entry,
          fileObj,
          isDirectory: false,
          isDotfile,
          format: formatMeta.format,
          type: formatMeta.type,
          size: formatBytes(fileObj.size),
          sizeBytes: fileObj.size,
          modified: new Date(fileObj.lastModified).toLocaleDateString() + ' ' + new Date(fileObj.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          privacy: piiStatus,
          snippet
        });
      } catch {
        // Skip unreadable files
      }
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  return { folders, files };
}

// Process files from mobile / standard HTML directory input
export function processInputFiles(fileList) {
  const foldersMap = new Map();
  const filesList = [];

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split('/');

    if (parts.length > 1) {
      const topFolder = parts[0];
      if (!foldersMap.has(topFolder)) {
        foldersMap.set(topFolder, {
          name: topFolder,
          path: topFolder,
          isDirectory: true,
          isDotfile: topFolder.startsWith('.'),
          modified: 'Selected Folder'
        });
      }
    }

    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop().toLowerCase() : '';
    const formatMeta = EXTENSION_MAP[ext] || { format: ext ? `${ext.toUpperCase()} File` : 'File', type: 'text' };

    filesList.push({
      name: file.name,
      path: relPath,
      fileObj: file,
      isDirectory: false,
      isDotfile: file.name.startsWith('.'),
      format: formatMeta.format,
      type: formatMeta.type,
      size: formatBytes(file.size),
      sizeBytes: file.size,
      modified: new Date(file.lastModified).toLocaleDateString(),
      privacy: 'Air-Gapped',
      snippet: `File from this device (${formatBytes(file.size)}).`
    });
  }

  return {
    folders: Array.from(foldersMap.values()),
    files: filesList
  };
}
