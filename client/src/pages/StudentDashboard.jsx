import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import {
  LogOut, Clock, Calendar, BookOpen, Play, CheckCircle2,
  FileCode, Timer, ChevronRight, Zap, Shield
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { error: showError } = useToastStore();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await api.getExams();
      setExams(data.exams || []);
    } catch (err) {
      showError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinExam = async (examId) => {
    try {
      const exam = exams.find(e => e.id === examId);
      if (exam?.fullscreenRequired && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      await api.joinExam(examId);
      navigate(`/exam/${examId}`);
    } catch (err) {
      showError(err.message);
    }
  };

  const getExamStatus = (exam) => {
    const now = Date.now();
    const start = new Date(exam.startTime).getTime();
    const end = new Date(exam.endTime).getTime();
    if (exam.status === 'ended') return 'ended';
    if (exam.status === 'active' && now >= start && now <= end) return 'active';
    if (now < start) return 'upcoming';
    return 'ended';
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const activeExams = exams.filter(e => getExamStatus(e) === 'active');
  const upcomingExams = exams.filter(e => getExamStatus(e) === 'upcoming');
  const pastExams = exams.filter(e => getExamStatus(e) === 'ended');

  if (loading) return <Loader fullScreen text="Loading your exams..." />;

  return (
    <div className="h-full w-full overflow-auto gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
              <Shield size={18} className="text-accent-blue" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Exam Portal</h1>
              <p className="text-xs text-text-secondary">Student Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">{user?.name || user?.email}</p>
              <p className="text-xs text-text-secondary">{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
        {/* Welcome */}
        <div className="rounded-2xl bg-gradient-to-r from-accent-blue/15 via-accent-purple/10 to-transparent border border-border p-8 shadow-lg">
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Welcome back, {user?.name || 'Student'} 👋
          </h2>
          <p className="text-text-secondary mt-2 text-lg">
            {activeExams.length > 0
              ? `You have ${activeExams.length} active exam(s) ready to join.`
              : 'No active exams right now. Check back later!'}
          </p>
        </div>

        {/* Active Exams */}
        {activeExams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-accent-green" />
              <h3 className="text-lg font-semibold text-text-primary">Active Exams</h3>
              <Badge variant="live" dot>LIVE</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {activeExams.map(exam => (
                <ExamCard key={exam.id} exam={exam} status="active" onJoin={() => handleJoinExam(exam.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcomingExams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-accent-blue" />
              <h3 className="text-lg font-semibold text-text-primary">Upcoming Exams</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingExams.map(exam => (
                <ExamCard key={exam.id} exam={exam} status="upcoming" />
              ))}
            </div>
          </section>
        )}

        {/* Past */}
        {pastExams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-text-muted" />
              <h3 className="text-lg font-semibold text-text-primary">Past Exams</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {pastExams.map(exam => (
                <ExamCard key={exam.id} exam={exam} status="ended" />
              ))}
            </div>
          </section>
        )}

        {exams.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-secondary">No exams yet</h3>
            <p className="text-sm text-text-muted mt-1">
              Your instructor will create exams that appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function ExamCard({ exam, status, onJoin }) {
  const formatTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const statusConfig = {
    active: { badge: 'active', label: 'Active', dot: true },
    upcoming: { badge: 'upcoming', label: 'Upcoming', dot: false },
    ended: { badge: 'ended', label: 'Ended', dot: false },
  };

  const cfg = statusConfig[status];

  return (
    <div className={`
      gradient-card rounded-2xl border border-border p-6 flex flex-col gap-4
      transition-all duration-300 hover:border-accent-blue/40 shadow-md
      ${status === 'active' ? 'ring-2 ring-accent-green/30' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h4 className="font-bold text-text-primary text-xl tracking-tight leading-tight">{exam.title}</h4>
          {exam.course && (
            <p className="text-sm font-medium text-text-secondary">{exam.course}</p>
          )}
        </div>
        <Badge variant={cfg.badge} dot={cfg.dot}>{cfg.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Calendar size={13} />
          <span>{formatTime(exam.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Timer size={13} />
          <span>{exam.duration} min</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <FileCode size={13} />
          <span>{(exam.allowedExtensions || []).join(', ') || 'All files'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Shield size={13} />
          <span>{exam.fullscreenRequired ? 'Fullscreen' : 'Standard'}</span>
        </div>
      </div>

      {status === 'active' && onJoin && (
        <Button onClick={onJoin} className="w-full" icon={Play}>
          Join Exam
        </Button>
      )}
      {status === 'ended' && exam.submissionId && (
        <Button variant="outline" className="w-full" icon={CheckCircle2}>
          View Submission
        </Button>
      )}
    </div>
  );
}
