import { create } from 'zustand';

const getLanguageFromFile = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', cpp: 'cpp', c: 'c', h: 'cpp',
    html: 'html', css: 'css', json: 'json', md: 'markdown',
    txt: 'plaintext'
  };
  return map[ext] || 'plaintext';
};

export const useEditorStore = create((set, get) => ({
  // Files
  files: {},           // { filename: content }
  openFiles: [],       // [filename, ...]
  activeFile: null,
  originalFiles: {},   // Original starter files for comparison

  // Editor state
  fontSize: 14,
  theme: 'vs-dark',
  wordWrap: 'on',
  minimap: true,

  // Autosave
  dirty: {},          // { filename: true/false }
  lastSaved: null,
  saving: false,
  saveCount: 0,

  // Version history
  versions: {},       // { filename: [{ timestamp, content }, ...] }
  showHistory: false,

  // Exam info
  examId: null,
  examTitle: '',
  examEndTime: null,
  submitted: false,
  locked: false,

  // Connection
  connected: true,

  // Actions
  initializeExam: (examId, title, endTime, starterFiles) => {
    const files = { ...starterFiles };
    const openFiles = Object.keys(files);
    const activeFile = openFiles[0] || null;
    const dirty = {};
    openFiles.forEach(f => dirty[f] = false);

    // Try to recover from localStorage
    const storageKey = `portal_autosave_${examId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.files) {
          Object.assign(files, parsed.files);
        }
        if (parsed.versions) {
          set({ versions: parsed.versions });
        }
      } catch (e) {
        console.warn('Failed to recover autosave:', e);
      }
    }

    set({
      files,
      openFiles,
      activeFile,
      originalFiles: { ...starterFiles },
      dirty,
      examId,
      examTitle: title,
      examEndTime: endTime,
      submitted: false,
      locked: false,
      saveCount: 0,
    });
  },

  setActiveFile: (filename) => set({ activeFile: filename }),

  openFile: (filename) => {
    const { openFiles } = get();
    if (!openFiles.includes(filename)) {
      set({ openFiles: [...openFiles, filename], activeFile: filename });
    } else {
      set({ activeFile: filename });
    }
  },

  closeFile: (filename) => {
    const { openFiles, activeFile } = get();
    const newOpen = openFiles.filter(f => f !== filename);
    const newActive = activeFile === filename
      ? (newOpen[newOpen.length - 1] || null)
      : activeFile;
    set({ openFiles: newOpen, activeFile: newActive });
  },

  updateFileContent: (filename, content) => {
    const { files, dirty, versions } = get();
    const newFiles = { ...files, [filename]: content };
    const newDirty = { ...dirty, [filename]: true };

    // Add to local version history
    const fileVersions = versions[filename] || [];
    const lastVersion = fileVersions[fileVersions.length - 1];
    const now = new Date().toISOString();

    // Only add version if content actually changed from last version
    let newVersions = versions;
    if (!lastVersion || lastVersion.content !== content) {
      // Limit local versions to last 100 per file
      const updated = [...fileVersions, { timestamp: now, content }].slice(-100);
      newVersions = { ...versions, [filename]: updated };
    }

    set({ files: newFiles, dirty: newDirty, versions: newVersions });

    // Save to localStorage immediately
    const { examId } = get();
    if (examId) {
      const storageKey = `portal_autosave_${examId}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          files: newFiles,
          versions: newVersions,
          lastSaved: now,
        }));
      } catch (e) {
        console.warn('localStorage save failed:', e);
      }
    }
  },

  markSaved: () => {
    const { dirty, saveCount } = get();
    const newDirty = {};
    Object.keys(dirty).forEach(k => newDirty[k] = false);
    set({ dirty: newDirty, saving: false, lastSaved: new Date().toISOString(), saveCount: saveCount + 1 });
  },

  setSaving: (saving) => set({ saving }),

  setFontSize: (fontSize) => set({ fontSize }),
  toggleTheme: () => set(s => ({ theme: s.theme === 'vs-dark' ? 'vs-light' : 'vs-dark' })),
  toggleWordWrap: () => set(s => ({ wordWrap: s.wordWrap === 'on' ? 'off' : 'on' })),
  toggleMinimap: () => set(s => ({ minimap: !s.minimap })),
  toggleHistory: () => set(s => ({ showHistory: !s.showHistory })),

  restoreVersion: (filename, version) => {
    const { files, dirty } = get();
    set({
      files: { ...files, [filename]: version.content },
      dirty: { ...dirty, [filename]: true },
    });
  },

  setSubmitted: () => set({ submitted: true, locked: true }),
  setLocked: () => set({ locked: true }),
  setConnected: (connected) => set({ connected }),

  getLanguage: (filename) => getLanguageFromFile(filename || ''),

  getAllFiles: () => Object.keys(get().files),

  hasDirtyFiles: () => Object.values(get().dirty).some(Boolean),
}));
