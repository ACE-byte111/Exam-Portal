import { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { ChevronRight, ChevronDown, FileCode, FolderOpen, Search } from 'lucide-react';

const extColors = {
  cpp: 'text-blue-400', c: 'text-blue-400', h: 'text-blue-300',
  py: 'text-green-400', java: 'text-orange-400',
  js: 'text-yellow-400', jsx: 'text-yellow-400',
  html: 'text-red-400', css: 'text-purple-400',
  json: 'text-yellow-300', md: 'text-gray-400', txt: 'text-gray-400',
};

export default function FileExplorer() {
  const { files, activeFile, openFile } = useEditorStore();
  const [search, setSearch] = useState('');
  const allFiles = Object.keys(files);

  const filtered = search
    ? allFiles.filter(f => f.toLowerCase().includes(search.toLowerCase()))
    : allFiles;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">
        Explorer
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
          {filtered.length === 0 && (
            <p className="px-6 py-4 text-xs text-text-muted text-center">No files found</p>
          )}
        </div>
      </div>
    </div>
  );
}
