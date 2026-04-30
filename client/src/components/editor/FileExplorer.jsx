import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { ChevronRight, ChevronDown, FileCode, FolderOpen, Search, Plus, X, Check } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

const extColors = {
  cpp: 'text-blue-400', c: 'text-blue-400', h: 'text-blue-300',
  py: 'text-green-400', java: 'text-orange-400',
  js: 'text-yellow-400', jsx: 'text-yellow-400',
  html: 'text-red-400', css: 'text-purple-400',
  json: 'text-yellow-300', md: 'text-gray-400', txt: 'text-gray-400',
};

export default function FileExplorer() {
  const { files, activeFile, openFile, createFile, submitted } = useEditorStore();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const inputRef = useRef(null);
  
  const allFiles = Object.keys(files);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      setIsCreating(false);
      return;
    }

    const success = createFile(newFileName.trim());
    if (success) {
      setIsCreating(false);
      setNewFileName('');
    } else {
      toast.error('File already exists');
    }
  };
  const filtered = search
    ? allFiles.filter(f => f.toLowerCase().includes(search.toLowerCase()))
    : allFiles;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Explorer</span>
        {!submitted && (
          <button 
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-bg-tertiary rounded-md text-text-muted hover:text-text-primary transition-colors"
            title="New File"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
          />
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto py-1">
        <div className="px-2">
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-secondary">
            <ChevronDown size={12} />
            <FolderOpen size={12} className="text-accent-blue" />
            <span className="font-medium">exam-files</span>
          </div>

          {/* Create File Input */}
          {isCreating && (
            <div className="px-2 py-1 flex items-center gap-2">
              <FileCode size={13} className="text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFile();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
                onBlur={handleCreateFile}
                placeholder="filename.ext"
                className="flex-1 min-w-0 bg-bg-tertiary text-xs text-text-primary border border-accent-blue/50 rounded px-1.5 py-1 focus:outline-none"
              />
            </div>
          )}

          {filtered.map(file => {
            const ext = file.split('.').pop().toLowerCase();
            const color = extColors[ext] || 'text-gray-400';
            const isActive = file === activeFile;

            return (
              <button
                key={file}
                onClick={() => openFile(file)}
                className={`
                  w-full flex items-center gap-2 pl-7 pr-2 py-1.5 text-xs rounded-md
                  transition-colors text-left
                  ${isActive
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  }
                `}
              >
                <FileCode size={13} className={color} />
                <span className="truncate">{file}</span>
              </button>
            );
          })}
          {filtered.length === 0 && !isCreating && (
            <p className="px-6 py-4 text-xs text-text-muted text-center">No files found</p>
          )}
        </div>
      </div>
    </div>
  );
}
