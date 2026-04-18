import { useEditorStore } from '../../stores/editorStore';
import { Save, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EditorStatusBar({ violations = 0 }) {
  const { activeFile, saving, lastSaved, saveCount, connected, dirty, getLanguage } = useEditorStore();

  const language = activeFile ? getLanguage(activeFile) : '';
  const isDirty = activeFile ? dirty[activeFile] : false;

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-bg-secondary border-t border-border text-xs select-none">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Connection */}
        <div className={`flex items-center gap-1.5 ${connected ? 'text-accent-green' : 'text-accent-red'}`}>
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span>{connected ? 'Connected' : 'Offline'}</span>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          {saving ? (
            <>
              <Save size={11} className="animate-pulse text-accent-blue" />
              <span>Saving...</span>
            </>
          ) : isDirty ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
              <span>Unsaved changes</span>
            </>
          ) : lastSaved ? (
            <>
              <CheckCircle size={11} className="text-accent-green animate-checkmark" />
              <span>Saved</span>
            </>
          ) : (
            <span className="text-text-muted">Ready</span>
          )}
        </div>

        {/* Save count */}
        {saveCount > 0 && (
          <span className="text-text-muted">{saveCount} autosaves</span>
        )}

        {/* Violations */}
        {violations > 0 && (
          <div className="flex items-center gap-1.5 text-accent-orange">
            <AlertTriangle size={11} />
            <span>{violations} violation{violations > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 text-text-muted">
        {activeFile && <span>{activeFile}</span>}
        {language && <span className="capitalize">{language}</span>}
        <span>UTF-8</span>
      </div>
    </div>
  );
}
