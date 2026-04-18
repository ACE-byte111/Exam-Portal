import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Toast from './components/Toast';
import Loader from './components/Loader';

// Pages
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorSubmissions from './pages/InstructorSubmissions';
import ExamEditor from './pages/ExamEditor';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuthStore();

  if (loading) return <Loader fullScreen text="Verifying session..." />;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'instructor' ? '/instructor' : '/dashboard'} replace />;
  }

  return children;
}

export default function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-bg-primary flex items-center justify-center">
        <Loader text="Initializing..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Student Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/exam/:id" 
          element={
            <ProtectedRoute role="student">
              <ExamEditor />
            </ProtectedRoute>
          } 
        />

        {/* Instructor Routes */}
        <Route 
          path="/instructor" 
          element={
            <ProtectedRoute role="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/instructor/exam/:id/submissions" 
          element={
            <ProtectedRoute role="instructor">
              <InstructorSubmissions />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
