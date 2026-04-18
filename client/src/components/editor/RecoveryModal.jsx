import { RotateCcw, Trash2, Clock, FileCode, AlertCircle } from 'lucide-react';
import Button from '../Button';

export default function RecoveryModal({ recoveryData, onRecover, onDiscard }) {
  const lastSaved = recoveryData?.lastSaved
    ? new Date(recoveryData.lastSaved).toLocaleString()
    : 'Unknown';
  const fileCount = recoveryData?.files ? Object.keys(recoveryData.files).length : 0;
  const versionCount = recoveryData?.versions
    ? Object.values(recoveryData.versions).reduce((sum, v) => sum + v.length, 0)
    : 0;

  return (
    <div className="h-full w-full gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-accent-orange/15 border-2 border-accent-orange/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-accent-orange" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Work Recovered</h1>
          <p className="text-text-secondary mt-1">
            We found autosaved work from a previous session
          </p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-primary/50 rounded-xl p-3 text-center">
              <FileCode size={16} className="text-accent-blue mx-auto mb-1" />
              <p className="text-lg font-bold text-text-primary">{fileCount}</p>
              <p className="text-xs text-text-muted">Files</p>
            </div>
            <div className="bg-bg-primary/50 rounded-xl p-3 text-center">
              <RotateCcw size={16} className="text-accent-green mx-auto mb-1" />
              <p className="text-lg font-bold text-text-primary">{versionCount}</p>
              <p className="text-xs text-text-muted">Versions</p>
            </div>
            <div className="bg-bg-primary/50 rounded-xl p-3 text-center">
              <Clock size={16} className="text-accent-purple mx-auto mb-1" />
              <p className="text-xs font-medium text-text-primary mt-1">{lastSaved}</p>
              <p className="text-xs text-text-muted">Last Save</p>
            </div>
          </div>

          {/* File list */}
          {recoveryData?.files && (
            <div className="bg-bg-primary/50 rounded-xl p-3">
              <p className="text-xs text-text-muted mb-2">Recovered files:</p>
              {Object.keys(recoveryData.files).map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-text-secondary py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" icon={Trash2} onClick={onDiscard} className="flex-1">
            Start Fresh
          </Button>
          <Button icon={RotateCcw} onClick={onRecover} className="flex-1">
            Restore Work
          </Button>
        </div>
      </div>
    </div>
  );
}
