import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import socket from '../services/socket';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import {
  LogOut, Plus, Play, Square, Users, Shield, Eye, Download,
  Clock, FileCode, BarChart3, AlertTriangle, Monitor,
  ChevronDown, ChevronUp, Copy, ExternalLink, Settings, Code2, Trash2
} from 'lucide-react';
import LiveCodeViewer from '../components/instructor/LiveCodeViewer';

export default function InstructorDashboard() {
  const { user, logout } = useAuthStore();
  const toast = useToastStore();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [monitorExam, setMonitorExam] = useState(null);
  const [students, setStudents] = useState({});
  const [events, setEvents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => { loadExams(); }, []);

  useEffect(() => {
    socket.on('student:status', (data) => {
      setStudents(prev => ({ ...prev, [data.studentId]: data }));
    });
    socket.on('student:anti-cheat-event', (data) => {
      setEvents(prev => [data, ...prev].slice(0, 100));
    });
    socket.on('student:fullscreen-violation', (data) => {
      setEvents(prev => [{ ...data, event: 'fullscreen violation' }, ...prev].slice(0, 100));
      toast.warning(`${data.studentName || data.studentId} left fullscreen!`);
    });
    socket.on('student:code-snapshot', (data) => {
      setStudents(prev => ({
        ...prev,
        [data.studentId]: {
          ...(prev[data.studentId] || {}),
          ...data,
          lastSync: new Date().toISOString()
        }
      }));
    });
    return () => {
      socket.off('student:status');
      socket.off('student:anti-cheat-event');
      socket.off('student:fullscreen-violation');
    };
  }, []);

  const loadExams = async () => {
    try {
      const data = await api.getExams();
      setExams(data.exams || []);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  const handleStartExam = async (id) => {
    try {
      await api.startExam(id);
      toast.success('Exam started!');
      loadExams();
    } catch (err) { toast.error(err.message); }
  };

  const handleStopExam = async (id) => {
    try {
      await api.stopExam(id);
      toast.success('Exam stopped');
      loadExams();
    } catch (err) { toast.error(err.message); }
  };
  
  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure? This will delete the exam and ALL student submissions permanently.')) return;
    try {
      await api.deleteExam(id);
      toast.success('Exam deleted');
      loadExams();
    } catch (err) { toast.error(err.message); }
  };

  const openMonitor = (exam) => {
    setMonitorExam(exam);
    socket.emit('instructor:monitor', { examId: exam.id });
  };

  if (loading) return <Loader fullScreen text="Loading dashboard..." />;

  return (
    <div className="h-full w-full overflow-auto gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
              <Settings size={24} className="text-accent-purple" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-text-primary leading-tight">Instructor Panel</h1>
              <p className="text-sm text-text-secondary leading-snug tracking-wide">Exam Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button icon={Plus} onClick={() => setShowCreate(true)}>Create Exam</Button>
            <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Exams', value: exams.length, icon: FileCode, color: 'text-accent-blue' },
            { label: 'Active', value: exams.filter(e => e.status === 'active').length, icon: Play, color: 'text-accent-green' },
            { label: 'Students Online', value: Object.keys(students).length, icon: Users, color: 'text-accent-purple' },
            { label: 'Violations', value: events.filter(e => e.event === 'fullscreen violation').length, icon: AlertTriangle, color: 'text-accent-orange' },
          ].map(stat => (
            <div key={stat.label} className="gradient-card rounded-2xl border border-border p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-text-secondary">
                <stat.icon size={18} className={stat.color} />
                <span className="text-sm font-medium tracking-wide">{stat.label}</span>
              </div>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Exams List */}
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-4">All Exams</h3>
          <div className="space-y-3">
            {exams.map(exam => (
              <ExamRow
                key={exam.id}
                exam={exam}
                onStart={() => handleStartExam(exam.id)}
                onStop={() => handleStopExam(exam.id)}
                onMonitor={() => openMonitor(exam)}
                onViewSubmissions={() => window.location.href = `/instructor/exam/${exam.id}/submissions`}
                onDelete={() => handleDeleteExam(exam.id)}
              />
            ))}
            {exams.length === 0 && (
              <div className="text-center py-12 gradient-card rounded-2xl border border-border">
                <FileCode size={32} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary">No exams created yet</p>
                <Button className="mt-4" icon={Plus} onClick={() => setShowCreate(true)}>
                  Create Your First Exam
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Live Monitor */}
        {monitorExam && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Monitor size={18} className="text-accent-green" />
                <h3 className="text-lg font-semibold text-text-primary">
                  Live Monitor: {monitorExam.title}
                </h3>
                <Badge variant="live" dot>LIVE</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMonitorExam(null)}>Close</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Connected Students */}
              <div className="gradient-card rounded-xl border border-border p-4">
                <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                  <Users size={14} /> Connected Students
                </h4>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {Object.values(students).length === 0 && (
                    <p className="text-xs text-text-muted py-4 text-center">No students connected yet</p>
                  )}
                  {Object.values(students).map(s => (
                    <div key={s.studentId} className="flex items-center justify-between bg-bg-primary/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.isFullscreen ? 'bg-accent-green' : 'bg-accent-red'}`} />
                        <span className="text-sm text-text-primary">{s.studentName || s.studentId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.violations > 0 && (
                          <Badge variant="danger">{s.violations} violations</Badge>
                        )}
                        <Button 
                          size="xs" 
                          variant="ghost" 
                          icon={Code2}
                          onClick={() => setSelectedStudent(s)}
                        >
                          View Code
                        </Button>
                        <Badge variant={s.isFullscreen ? 'active' : 'danger'}>
                          {s.isFullscreen ? 'Fullscreen' : 'Not Fullscreen'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Log */}
              <div className="gradient-card rounded-xl border border-border p-4">
                <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} /> Security Events
                </h4>
                <div className="space-y-1.5 max-h-64 overflow-auto">
                  {events.length === 0 && (
                    <p className="text-xs text-text-muted py-4 text-center">No events recorded</p>
                  )}
                  {events.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-bg-primary/50 rounded-lg px-3 py-2">
                      <span className="text-text-muted">{new Date(ev.timestamp || ev.time).toLocaleTimeString()}</span>
                      <span className="text-text-secondary">{ev.studentName || ev.studentId}:</span>
                      <span className={`font-medium ${
                        ev.event?.includes('fullscreen') ? 'text-accent-red' :
                        ev.event?.includes('copy') ? 'text-accent-orange' :
                        'text-accent-blue'
                      }`}>{ev.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); loadExams(); }}
      />

      <LiveCodeViewer
        student={selectedStudent ? students[selectedStudent.studentId] : null}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}

function ExamRow({ exam, onStart, onStop, onMonitor, onViewSubmissions, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = {
    draft: 'upcoming',
    active: 'active',
    ended: 'ended',
  };

  return (
    <div className="gradient-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded-md bg-bg-tertiary text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <div className="flex flex-col gap-1">
            <h4 className="font-semibold text-lg text-text-primary leading-tight">{exam.title}</h4>
            <p className="text-sm text-text-secondary leading-tight">{exam.course || 'No course'} · {exam.duration} min</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusColor[exam.status] || 'upcoming'}>
            {exam.status || 'draft'}
          </Badge>
          {exam.status !== 'active' && exam.status !== 'ended' && (
            <Button size="sm" variant="success" icon={Play} onClick={onStart}>Start</Button>
          )}
          {exam.status === 'active' && (
            <>
              <Button size="sm" variant="outline" icon={Eye} onClick={onMonitor}>Monitor</Button>
              <Button size="sm" variant="danger" icon={Square} onClick={onStop}>Stop</Button>
            </>
          )}
          {exam.status === 'ended' && (
            <Button size="sm" variant="outline" icon={FileCode} onClick={onViewSubmissions}>Submissions</Button>
          )}
          {exam.status !== 'active' && (
            <button 
              onClick={onDelete}
              className="p-2 text-text-muted hover:text-accent-red transition-colors"
              title="Delete Exam"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-4 pt-2 border-t border-border animate-slide-down">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className="text-text-muted">Start:</span> <span className="text-text-secondary">{exam.startTime ? new Date(exam.startTime).toLocaleString() : '—'}</span></div>
            <div><span className="text-text-muted">Duration:</span> <span className="text-text-secondary">{exam.duration} min</span></div>
            <div><span className="text-text-muted">Files:</span> <span className="text-text-secondary">{(exam.allowedExtensions || []).join(', ') || 'All'}</span></div>
            <div><span className="text-text-muted">Fullscreen:</span> <span className="text-text-secondary">{exam.fullscreenRequired ? 'Required' : 'Optional'}</span></div>
            {exam.repoTemplate && (
              <div className="col-span-2"><span className="text-text-muted">Repo:</span> <span className="text-accent-blue">{exam.repoTemplate}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateExamModal({ isOpen, onClose, onCreated }) {
  const toast = useToastStore();
  const [form, setForm] = useState({
    title: '',
    course: '',
    duration: 90,
    allowedExtensions: 'cpp,h,py,java',
    fullscreenRequired: true,
    repoTemplate: '',
    starterFiles: {},
  });
  const [creating, setCreating] = useState(false);
  const [starterFilesList, setStarterFilesList] = useState([
    { name: 'main.cpp', content: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    \n    return 0;\n}\n' },
  ]);

  const addStarterFile = () => {
    setStarterFilesList([...starterFilesList, { name: '', content: '' }]);
  };

  const updateStarterFile = (index, field, value) => {
    const updated = [...starterFilesList];
    updated[index][field] = value;
    setStarterFilesList(updated);
  };

  const removeStarterFile = (index) => {
    setStarterFilesList(starterFilesList.filter((_, i) => i !== index));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.warning('Please enter a title');
    setCreating(true);
    try {
      const starterFiles = {};
      starterFilesList.forEach(f => {
        if (f.name.trim()) starterFiles[f.name.trim()] = f.content;
      });

      await api.createExam({
        ...form,
        allowedExtensions: form.allowedExtensions.split(',').map(s => s.trim()).filter(Boolean),
        starterFiles,
      });
      toast.success('Exam created successfully!');
      onCreated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Exam" maxWidth="max-w-2xl">
      <form onSubmit={handleCreate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Exam Title"
            placeholder="OOP Lab Midterm"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Course"
            placeholder="CS201"
            value={form.course}
            onChange={e => setForm({ ...form, course: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duration (minutes)"
            type="number"
            min={5}
            max={300}
            value={form.duration}
            onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 90 })}
          />
          <Input
            label="Allowed Extensions"
            placeholder="cpp,h,py,java"
            value={form.allowedExtensions}
            onChange={e => setForm({ ...form, allowedExtensions: e.target.value })}
          />
        </div>
        <Input
          label="GitHub Repo Template (optional)"
          placeholder="https://github.com/org/repo-template"
          value={form.repoTemplate}
          onChange={e => setForm({ ...form, repoTemplate: e.target.value })}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.fullscreenRequired}
            onChange={e => setForm({ ...form, fullscreenRequired: e.target.checked })}
            className="w-4 h-4 rounded border-border bg-bg-primary text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-sm text-text-primary">Require fullscreen mode</span>
        </label>

        {/* Starter Files */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary">Starter Files</label>
            <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addStarterFile}>Add File</Button>
          </div>
          <div className="space-y-2">
            {starterFilesList.map((file, i) => (
              <div key={i} className="bg-bg-primary rounded-xl border border-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
                    placeholder="filename.cpp"
                    value={file.name}
                    onChange={e => updateStarterFile(i, 'name', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeStarterFile(i)}
                    className="text-text-muted hover:text-accent-red transition-colors p-1"
                  >×</button>
                </div>
                <textarea
                  className="w-full h-20 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent-blue resize-none"
                  placeholder="// starter code..."
                  value={file.content}
                  onChange={e => updateStarterFile(i, 'content', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={creating} icon={Plus}>Create Exam</Button>
        </div>
      </form>
    </Modal>
  );
}
