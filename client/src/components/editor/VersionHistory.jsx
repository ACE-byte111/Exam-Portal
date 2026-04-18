import { useEditorStore } from '../../stores/editorStore';
import { History, RotateCcw, Clock } from 'lucide-react';

export default function VersionHistory() {
  const { activeFile, versions, restoreVersion } = useEditorStore();

  const fileVersions = activeFile ? (versions[activeFile] || []) : [];
  const sortedVersions = [...fileVersions].reverse();

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <History size={14} className="text-accent-blue" />
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Version History</span>
      </div>

      {!activeFile ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-text-muted text-center">Select a file to view its history</p>
        </div>
      ) : sortedVersions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-text-muted text-center">No versions saved yet for {activeFile}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto py-2">
          <div className="px-3 mb-2">
            <p className="text-xs text-text-secondary font-medium">{activeFile}</p>
            <p className="text-xs text-text-muted">{sortedVersions.length} version{sortedVersions.length > 1 ? 's' : ''}</p>
          </div>

          <div className="space-y-0.5 px-2">
            {sortedVersions.map((version, i) => (
              <div
                key={i}
                className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-accent-green' : 'bg-border'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock size={10} className="text-text-muted" />
                    <span className="text-text-secondary">{formatTime(version.timestamp)}</span>
                    <span className="text-text-muted">{formatDate(version.timestamp)}</span>
                  </div>
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {version.content.slice(0, 60).replace(/\n/g, ' ')}...
                  </p>
                </div>
                <button
                  onClick={() => restoreVersion(activeFile, version)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-accent-blue/20 text-accent-blue transition-all"
                  title="Restore this version"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
