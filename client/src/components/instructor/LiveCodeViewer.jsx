import { useState } from 'react';
import Editor from '@monaco-editor/react';
import Modal from '../Modal';
import Badge from '../Badge';
import Button from '../Button';
import OutputPanel from '../editor/OutputPanel';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { FileCode, Clock, User, HardDrive, Play } from 'lucide-react';

export default function LiveCodeViewer({ student, isOpen, onClose }) {
  const toast = useToastStore();
  const [activeFile, setActiveFile] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [stdin, setStdin] = useState('');

  if (!student) return null;

  const files = student.files || {};
  const fileList = Object.keys(files);
  const currentActiveFile = activeFile || student.activeFile || fileList[0];

  const handleRunCode = async () => {
    const content = files[currentActiveFile];
    if (!content) return;

    setRunning(true);
    setOutput(null);
    try {
      const result = await api.runCode(currentActiveFile, content, stdin);
      setOutput(result);
    } catch (err) {
      toast.error('Execution failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live View: ${student.studentName || student.studentId}`}
      maxWidth="max-w-6xl"
    >
      <div className="flex flex-col h-[85vh]">
        {/* Student Info Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <User size={16} className="text-text-muted" />
              <span className="text-text-secondary font-medium">{student.studentName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-text-muted" />
              <span className="text-text-secondary">
                Last Sync: {new Date(student.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <HardDrive size={16} className="text-text-muted" />
              <span className="text-text-secondary">
                {fileList.length} Files
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              variant="success" 
              icon={Play} 
              onClick={handleRunCode}
              loading={running}
            >
              Run Student's Code
            </Button>
            <Badge variant={student.isFullscreen ? 'active' : 'danger'}>
              {student.isFullscreen ? 'In Fullscreen' : 'Left Fullscreen'}
            </Badge>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-xl bg-bg-editor">
          <div className="flex-1 flex overflow-hidden">
            {/* File Sidebar */}
            <div className="w-64 bg-bg-secondary border-r border-border overflow-auto">
              <div className="p-3 text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-border/50">
                Student Workspace
              </div>
              <div className="p-2 space-y-1">
                {fileList.map(name => (
                  <button
                    key={name}
                    onClick={() => setActiveFile(name)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      currentActiveFile === name
                        ? 'bg-accent-blue/10 text-accent-blue font-medium'
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`}
                  >
                    <FileCode size={14} />
                    <span className="truncate">{name}</span>
                    {name === student.activeFile && (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-blue ml-auto animate-pulse" title="Currently editing" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Viewer */}
            <div className="flex-1 relative">
              <Editor
                height="100%"
                path={currentActiveFile}
                language={currentActiveFile.split('.').pop()}
                value={files[currentActiveFile] || ''}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 14,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  automaticLayout: true,
                }}
              />
              <div className="absolute top-4 right-8 z-10 flex gap-2">
                <Badge variant="outline" className="bg-bg-editor/80 backdrop-blur-sm border-white/5">
                  Live Snapshot
                </Badge>
              </div>
            </div>
          </div>

          {/* Instructor Output Panel (Mini) */}
          {(output || running) && (
            <div className="border-t border-border">
              <OutputPanel
                output={output}
                loading={running}
                stdin={stdin}
                setStdin={setStdin}
                onClear={() => setOutput(null)}
                onClose={() => setOutput(null)}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
