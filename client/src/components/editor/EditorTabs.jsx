import { useEditorStore } from '../../stores/editorStore';
import { X, FileCode } from 'lucide-react';

const extIcons = {
  cpp: '🔵', c: '🔵', h: '🔵',
  py: '🟢', java: '🟠', js: '🟡', jsx: '🟡',
  html: '🔴', css: '🟣', json: '📄', md: '📝', txt: '📄',
};

export default function EditorTabs() {
  const { openFiles, activeFile, dirty, setActiveFile, closeFile } = useEditorStore();

  if (openFiles.length === 0) return null;

  return (
    <div className="flex items-center bg-bg-secondary border-b border-border overflow-x-auto">
      {openFiles.map(file => {
        const ext = file.split('.').pop().toLowerCase();
        const icon = extIcons[ext] || '📄';
        const isActive = file === activeFile;
        const isDirty = dirty[file];

        return (
          <div
            key={file}
            onClick={() => setActiveFile(file)}
            className={`
              group flex items-center gap-2 px-4 py-2 text-xs cursor-pointer
              border-r border-border select-none transition-colors min-w-0
              ${isActive
                ? 'bg-bg-editor text-text-primary border-b-2 border-b-accent-blue'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }
            `}
          >
            <span className="text-[10px]">{icon}</span>
            <span className="truncate max-w-32">{file}</span>
            {isDirty && <span className="w-2 h-2 rounded-full bg-accent-orange flex-shrink-0" />}
            <button
              onClick={(e) => { e.stopPropagation(); closeFile(file); }}
              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-opacity flex-shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
