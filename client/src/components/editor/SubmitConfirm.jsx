import { Send, AlertCircle, FileCode, Save } from 'lucide-react';
import Button from '../Button';
import Modal from '../Modal';

export default function SubmitConfirm({ onConfirm, onCancel, saveCount, fileCount }) {
  return (
    <Modal isOpen={true} onClose={onCancel} title="Submit Exam" showClose={false}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center mx-auto mb-4">
          <Send size={24} className="text-accent-blue" />
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Ready to submit?
        </h3>
        <p className="text-sm text-text-secondary mb-6">
          This action cannot be undone. Make sure you've saved all your work.
        </p>

        <div className="bg-bg-primary rounded-xl border border-border p-4 mb-6 text-left">
          <div className="flex items-center gap-3 mb-2">
            <FileCode size={14} className="text-accent-blue" />
            <span className="text-sm text-text-primary">{fileCount} file{fileCount !== 1 ? 's' : ''} to submit</span>
          </div>
          <div className="flex items-center gap-3">
            <Save size={14} className="text-accent-green" />
            <span className="text-sm text-text-primary">{saveCount} autosave{saveCount !== 1 ? 's' : ''} recorded</span>
          </div>
        </div>

        <div className="bg-accent-orange/10 rounded-xl border border-accent-orange/20 p-3 mb-6 flex items-start gap-2">
          <AlertCircle size={14} className="text-accent-orange mt-0.5 flex-shrink-0" />
          <p className="text-xs text-accent-orange text-left">
            After submission, you will not be able to edit your code. The editor will be locked.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Go Back
          </Button>
          <Button variant="primary" icon={Send} onClick={onConfirm} className="flex-1">
            Submit Exam
          </Button>
        </div>
      </div>
    </Modal>
  );
}
