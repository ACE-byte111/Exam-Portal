import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Editor from '@monaco-editor/react';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Badge from '../components/Badge';
import { ChevronLeft, Users, FileCode, Clock, FileJson } from 'lucide-react';

export default function InstructorSubmissions() {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [activeFile, setActiveFile] = useState('');

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
    if (sub && sub.files) {
      const files = Object.keys(sub.files);
      if (files.length > 0) setActiveFile(files[0]);
    }
  };

  if (loading) return <Loader fullScreen text="Loading submissions..." />;

  return (
    <div className="h-full w-full flex flex-col bg-bg-editor">
      {/* Header */}
      <header className="h-14 border-b border-border bg-bg-primary flex items-center px-4 shrink-0">
        <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => navigate('/instructor')}>
          Back to Dashboard
        </Button>
        <div className="mx-4 h-6 w-px bg-border" />
        <h1 className="font-semibold text-text-primary truncate">
          Submissions: <span className="text-accent-blue">{exam?.title || 'Unknown Exam'}</span>
        </h1>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="success">{submissions.length} Submissions</Badge>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-bg-secondary flex flex-col shrink-0">
          <div className="p-4 border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Users size={14} /> Submitted Students
          </div>
          <div className="flex-1 overflow-auto">
            {submissions.map((sub, i) => (
              <button
                key={sub.id}
                onClick={() => selectSubmission(sub)}
                className={`w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-bg-hover
                  ${activeSubmission?.id === sub.id ? 'bg-accent-blue/10 border-l-2 border-l-accent-blue' : 'border-l-2 border-l-transparent'}
                `}
              >
                <div className="font-medium text-text-primary truncate">{sub.studentId}</div>
                <div className="text-xs text-text-muted mt-1 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(sub.submittedAt).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={sub.trigger === 'time_expired' ? 'danger' : 'success'}>
                    {sub.trigger === 'time_expired' ? 'Timeout' : 'Manual'}
                  </Badge>
                </div>
              </button>
            ))}
            {submissions.length === 0 && (
              <div className="p-6 text-center text-text-muted text-sm">
                No submissions yet.
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-bg-editor">
          {activeSubmission ? (
            <>
              {/* File Tabs */}
              <div className="h-10 border-b border-border bg-bg-secondary flex overflow-x-auto">
                {Object.keys(activeSubmission.files || {}).map(filename => (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`px-4 h-full flex items-center gap-2 text-sm border-r border-border min-w-max transition-colors
                      ${activeFile === filename 
                        ? 'bg-bg-editor text-text-primary border-t-2 border-t-accent-blue' 
                        : 'text-text-muted hover:bg-bg-hover hover:text-text-primary border-t-2 border-t-transparent'
                      }
                    `}
                  >
                    <FileCode size={14} className={activeFile === filename ? 'text-accent-blue' : ''} />
                    {filename}
                  </button>
                ))}
              </div>
              
              {/* Editor */}
              <div className="flex-1">
                {activeFile && activeSubmission.files[activeFile] !== undefined ? (
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
                       padding: { top: 16 }
                     }}
                   />
                ) : (
                  <div className="h-full flex items-center justify-center text-text-muted">
                    No file selected
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-4">
              <FileJson size={48} className="opacity-20" />
              <p>Select a submission from the sidebar to view code.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
