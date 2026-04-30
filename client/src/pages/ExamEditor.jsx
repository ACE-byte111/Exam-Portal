import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import socket from '../services/socket';
import MonacoWrapper from '../components/editor/MonacoWrapper';
import EditorTabs from '../components/editor/EditorTabs';
import FileExplorer from '../components/editor/FileExplorer';
import EditorToolbar from '../components/editor/EditorToolbar';
import EditorStatusBar from '../components/editor/EditorStatusBar';
import VersionHistory from '../components/editor/VersionHistory';
import FullscreenWarning from '../components/editor/FullscreenWarning';
import SubmitConfirm from '../components/editor/SubmitConfirm';
import SubmitReceipt from '../components/editor/SubmitReceipt';
import RecoveryModal from '../components/editor/RecoveryModal';
import useAutosave from '../hooks/useAutosave';
import useFullscreen from '../hooks/useFullscreen';
import useAntiCheat from '../hooks/useAntiCheat';
import Loader from '../components/Loader';
import OutputPanel from '../components/editor/OutputPanel';

export default function ExamEditor() {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToastStore();
  const store = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryData, setRecoveryData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [output, setOutput] = useState(null);
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [showOutputPanel, setShowOutputPanel] = useState(false);

  const handleAutoSubmit = useCallback(() => {
    handleSubmit('fullscreen_timeout');
  }, [examId, store.files, store.saveCount]);

  const {
    isFullscreen,
    showWarning,
    showInitialEntry,
    countdown,
    enterFullscreen,
    dismissWarning,
    violations,
  } = useFullscreen({
    enabled: exam?.fullscreenRequired,
    onAutoSubmit: handleAutoSubmit,
    examId,
    studentId: user?.id,
  });

  // Anti-cheat hook
  useAntiCheat({
    enabled: !!exam,
    examId,
    studentId: user?.id,
  });

  // Autosave hook
  useAutosave({
    enabled: !!exam && !store.submitted && !store.locked,
    examId,
    studentId: user?.id,
  });

  // Load exam
  useEffect(() => {
    loadExam();
    return () => {
      socket.emit('student:leave', { examId });
    };
  }, [examId]);

  const loadExam = async () => {
    try {
      const data = await api.getExam(examId);
      setExam(data.exam);

      // Check for recovery data
      const storageKey = `portal_autosave_${examId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.files && Object.keys(parsed.files).length > 0) {
          setRecoveryData(parsed);
          setShowRecovery(true);
          setLoading(false);
          return;
        }
      }

      // Initialize editor with starter files
      initEditor(data.exam, null);
    } catch (err) {
      toast.error('Failed to load exam: ' + err.message);
      navigate('/dashboard');
    }
  };

  // Sync code with instructor
  useEffect(() => {
    if (!store.examId || store.submitted) return;

    const syncInterval = setInterval(() => {
      socket.emit('student:code-update', {
        examId: store.examId,
        studentId: store.user?.id,
        files: store.files,
        activeFile: store.activeFile
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(syncInterval);
  }, [store.examId, store.files, store.activeFile, store.submitted]);

  const handleRunCode = async () => {
    if (!store.activeFile) {
      toast.warning('Please select a file to run');
      return;
    }

    const content = store.files[store.activeFile];
    if (!content) return;

    setRunning(true);
    setShowOutputPanel(true);
    setOutput(null); // Clear previous output
    
    // Immediate sync on run
    socket.emit('student:code-update', {
      examId: store.examId,
      studentId: store.user?.id,
      files: store.files,
      activeFile: store.activeFile
    });

    try {
      const result = await api.runCode(store.activeFile, content, stdin);
      setOutput(result);
    } catch (err) {
      toast.error('Execution failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleClearOutput = () => setOutput(null);

  const initEditor = (examData, recoveredData) => {
    const starterFiles = examData.starterFiles || { 'main.cpp': '// Start coding here\n' };
    const files = recoveredData ? recoveredData.files : starterFiles;

    store.initializeExam(
      examId,
      examData.title,
      examData.endTime,
      recoveredData ? files : starterFiles
    );

    if (recoveredData?.versions) {
      useEditorStore.setState({ versions: recoveredData.versions });
    }

    // Join socket room
    socket.emit('student:join', {
      examId,
      studentId: user?.id,
      studentName: user?.name || user?.email,
    });

    setLoading(false);
  };

  const handleRecover = () => {
    initEditor(exam, recoveryData);
    setShowRecovery(false);
    toast.success('Recovered autosaved work!');
  };

  const handleDiscardRecovery = () => {
    const storageKey = `portal_autosave_${examId}`;
    localStorage.removeItem(storageKey);
    initEditor(exam, null);
    setShowRecovery(false);
  };

  const handleSubmit = async (trigger = 'manual') => {
    try {
      const result = await api.submitExam({
        examId,
        studentId: user?.id,
        files: store.files,
        trigger,
        saveCount: store.saveCount,
      });
      store.setSubmitted();
      setReceiptData(result.submission);
      setShowSubmitConfirm(false);
      setShowReceipt(true);
      toast.success('Exam submitted successfully!');

      // Clean up localStorage
      localStorage.removeItem(`portal_autosave_${examId}`);

      socket.emit('student:submitted', {
        examId,
        studentId: user?.id,
      });
    } catch (err) {
      toast.error('Submission failed: ' + err.message);
    }
  };

  // Timer auto-submit
  useEffect(() => {
    if (!exam?.endTime || store.submitted) return;
    const end = new Date(exam.endTime).getTime();
    const check = setInterval(() => {
      if (Date.now() >= end) {
        clearInterval(check);
        handleSubmit('time_expired');
      }
    }, 1000);
    return () => clearInterval(check);
  }, [exam?.endTime, store.submitted]);

  if (loading) return <Loader fullScreen text="Preparing exam workspace..." />;

  if (showRecovery && recoveryData) {
    return (
      <RecoveryModal
        recoveryData={recoveryData}
        onRecover={handleRecover}
        onDiscard={handleDiscardRecovery}
      />
    );
  }

  if (showReceipt && receiptData) {
    return <SubmitReceipt data={receiptData} examTitle={exam?.title} onGoBack={() => navigate('/dashboard')} />;
  }

  return (
    <div className="h-full w-full flex flex-col bg-bg-editor overflow-hidden">
      {/* Toolbar */}
      <EditorToolbar
        examTitle={store.examTitle}
        endTime={store.examEndTime}
        onSubmit={() => setShowSubmitConfirm(true)}
        onRun={handleRunCode}
        running={running}
        submitted={store.submitted}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {sidebarOpen && (
          <div className="w-56 flex-shrink-0 border-r border-border bg-bg-secondary overflow-auto animate-fade-in">
            <FileExplorer />
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorTabs />
          <div className="flex-1 overflow-hidden">
            <MonacoWrapper />
          </div>
        </div>

        {/* Version History */}
        {store.showHistory && (
          <div className="w-72 flex-shrink-0 border-l border-border bg-bg-secondary overflow-auto animate-fade-in">
            <VersionHistory />
          </div>
        )}
      </div>

      {/* Output Panel */}
      {(showOutputPanel || output || running) && (
        <OutputPanel
          output={output}
          loading={running}
          stdin={stdin}
          setStdin={setStdin}
          onClose={() => setShowOutputPanel(false)}
          onClear={handleClearOutput}
        />
      )}

      {/* Status Bar */}
      <EditorStatusBar violations={violations} />

      {/* Modals */}
      {showInitialEntry && !showWarning && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-bg-primary backdrop-blur-md">
          <div className="text-center max-w-md mx-4 glass p-8 rounded-2xl animate-slide-up border border-border">
            <div className="w-16 h-16 rounded-full bg-accent-blue/20 border-2 border-accent-blue/40 flex items-center justify-center mx-auto mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-blue"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Fullscreen Required</h2>
            <p className="text-sm text-text-secondary mb-6">This exam requires you to be in fullscreen mode to continue. Please click below to enter fullscreen.</p>
            <button onClick={enterFullscreen} className="px-6 py-3 bg-accent-blue text-white rounded-xl font-bold tracking-wide w-full hover:bg-accent-blue/90 transition-colors">
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {showWarning && (
        <FullscreenWarning
          countdown={countdown}
          violations={violations}
          onReturn={enterFullscreen}
        />
      )}

      {showSubmitConfirm && (
        <SubmitConfirm
          onConfirm={() => handleSubmit('manual')}
          onCancel={() => setShowSubmitConfirm(false)}
          saveCount={store.saveCount}
          fileCount={Object.keys(store.files).length}
        />
      )}
    </div>
  );
}
