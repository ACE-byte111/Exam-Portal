import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Editor from '@monaco-editor/react';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Badge from '../components/Badge';
import OutputPanel from '../components/editor/OutputPanel';
import { useToastStore } from '../stores/toastStore';
import { ChevronLeft, Users, FileCode, Clock, FileJson, Play, Terminal as TerminalIcon } from 'lucide-react';

export default function InstructorSubmissions() {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore();
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [activeFile, setActiveFile] = useState('');
  
  // Execution state
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [stdin, setStdin] = useState('');
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    try {
      const [examData, subsData] = await Promise.all([
        api.getExam(examId),
        api.getExamSubmissions(examId)
      ]);
      setExam(examData.exam);
      setSubmissions(subsData.submissions || []);
      if (subsData.submissions?.length > 0) {
        selectSubmission(subsData.submissions[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectSubmission = (sub) => {
    setActiveSubmission(sub);
    setOutput(null);
    if (sub && sub.files) {
      const files = Object.keys(sub.files);
      if (files.length > 0) setActiveFile(files[0]);
    }
  };

  const handleRunCode = async () => {
    if (!activeFile || !activeSubmission) return;
    const content = activeSubmission.files[activeFile];
    if (!content) return;

    setRunning(true);
    setShowConsole(true); // Ensure console is visible when running
    setOutput(null);
    try {
      const result = await api.runCode(activeFile, content, stdin);
      setOutput(result);
    } catch (err) {
      toast.error('Execution failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading submissions..." />;

  return (
    <div className="h-full w-full flex flex-col bg-bg-editor">
      {/* Header */}
      <header className="h-14 border-b border-border bg-bg-primary flex items-center px-4 shrink-0">
        <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => navigate('/instructor')}>
          Back
        </Button>
        <div className="mx-4 h-6 w-px bg-border" />
        <h1 className="font-semibold text-text-primary truncate">
          Reviewing: <span className="text-accent-blue">{exam?.title || 'Unknown'}</span>
        </h1>
        <div className="ml-auto flex items-center gap-3">
          {activeSubmission && (
            <>
              <Button 
                size="sm" 
                variant="secondary" 
                icon={TerminalIcon} 
                onClick={() => setShowConsole(!showConsole)}
              >
                {showConsole ? 'Hide Console' : 'Show Console'}
              </Button>
              <Button 
                size="sm" 
                variant="success" 
                icon={Play} 
                onClick={handleRunCode}
                loading={running}
              >
                Run Code
              </Button>
            </>
          )}
          <Badge variant="success">{submissions.length} Submissions</Badge>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-bg-secondary flex flex-col shrink-0">
          <div className="p-4 border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Users size={14} /> Student Submissions
          </div>
          <div className="flex-1 overflow-auto">
            {submissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => selectSubmission(sub)}
                className={`w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-bg-hover
                  ${activeSubmission?.id === sub.id ? 'bg-accent-blue/10 border-l-2 border-l-accent-blue' : 'border-l-2 border-l-transparent'}
                `}
              >
                <div className="font-bold text-text-primary truncate">
                  {sub.studentName || (sub.studentEmail ? sub.studentEmail.split('@')[0] : sub.studentId)}
                </div>
                <div className="text-[10px] text-text-muted truncate mb-1">
                  {sub.studentEmail || 'No email recorded'}
                </div>
                <div className="text-[10px] text-text-muted flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(sub.submittedAt).toLocaleTimeString()}
                </div>
              </button>
            ))}
            {submissions.length === 0 && (
              <div className="p-6 text-center text-text-muted text-sm italic">
                No submissions yet.
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeSubmission ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* File Tabs */}
              <div className="h-10 border-b border-border bg-bg-secondary flex overflow-x-auto shrink-0">
                {Object.keys(activeSubmission.files || {}).map(filename => (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`px-4 h-full flex items-center gap-2 text-sm border-r border-border min-w-max transition-colors
                      ${activeFile === filename 
                        ? 'bg-bg-editor text-text-primary border-t-2 border-t-accent-blue font-medium' 
                        : 'text-text-muted hover:bg-bg-hover hover:text-text-primary border-t-2 border-t-transparent'
                      }
                    `}
                  >
                    <FileCode size={14} className={activeFile === filename ? 'text-accent-blue' : ''} />
                    {filename}
                  </button>
                ))}
              </div>
              
              {/* Editor Workspace */}
              <div className="flex-1 relative flex flex-col overflow-hidden">
                <div className="flex-1 relative">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    path={activeFile}
                    value={activeSubmission.files[activeFile]}
                    options={{
                      readOnly: true,
                      minimap: { enabled: true },
                      fontSize: 14,
                      wordWrap: 'on',
                      padding: { top: 16 },
                      automaticLayout: true
                    }}
                  />
                </div>

                {/* Force-visible Console Panel */}
                {showConsole && (
                  <div className="absolute bottom-0 left-0 right-0 h-96 bg-bg-editor border-t-4 border-accent-blue z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col">
                    <OutputPanel
                      output={output}
                      loading={running}
                      stdin={stdin}
                      setStdin={setStdin}
                      onClear={() => setOutput(null)}
                      onClose={() => setShowConsole(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-4">
              <FileJson size={48} className="opacity-10" />
              <p className="italic">Select a submission to review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
