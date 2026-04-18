import { CheckCircle2, FileCode, Save, Clock, Download, ArrowLeft, Shield } from 'lucide-react';
import Button from '../Button';

export default function SubmitReceipt({ data, examTitle, onGoBack }) {
  const submittedAt = data?.submittedAt ? new Date(data.submittedAt).toLocaleString() : new Date().toLocaleString();
  const files = data?.files ? Object.keys(data.files) : [];

  return (
    <div className="h-full w-full gradient-bg flex items-center justify-center p-4">
      <div className="max-w-lg w-full animate-slide-up">
        {/* Success icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-accent-green/15 border-2 border-accent-green/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-accent-green" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Exam Submitted!</h1>
          <p className="text-text-secondary mt-1">Your work has been saved successfully</p>
        </div>

        {/* Receipt card */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="text-center pb-4 border-b border-border">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Exam</p>
            <p className="text-lg font-semibold text-text-primary">{examTitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-primary/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={13} className="text-accent-blue" />
                <span className="text-xs text-text-muted">Submitted At</span>
              </div>
              <p className="text-sm font-medium text-text-primary">{submittedAt}</p>
            </div>

            <div className="bg-bg-primary/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Save size={13} className="text-accent-green" />
                <span className="text-xs text-text-muted">Autosaves</span>
              </div>
              <p className="text-sm font-medium text-text-primary">{data?.autosaveCount || 0} recorded</p>
            </div>
          </div>

          {/* Files */}
          <div className="bg-bg-primary/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileCode size={13} className="text-accent-purple" />
              <span className="text-xs text-text-muted">Files Submitted ({files.length})</span>
            </div>
            <div className="space-y-1">
              {files.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Trigger */}
          <div className="bg-bg-primary/50 rounded-xl p-3 flex items-center gap-2">
            <Shield size={13} className="text-accent-blue" />
            <span className="text-xs text-text-muted">Trigger:</span>
            <span className="text-xs text-text-secondary capitalize">{(data?.trigger || 'manual').replace('_', ' ')}</span>
          </div>

          {/* Submission ID */}
          {data?.id && (
            <div className="text-center pt-2 border-t border-border">
              <p className="text-xs text-text-muted">Submission ID</p>
              <p className="text-xs font-mono text-accent-blue mt-0.5">{data.id}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button icon={ArrowLeft} variant="secondary" onClick={onGoBack}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
