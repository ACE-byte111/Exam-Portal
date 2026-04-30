const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('portal_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } else {
    const text = await res.text();
    if (!res.ok) throw new Error(`Server Error (${res.status}): ${text.slice(0, 100)}`);
    return text;
  }
};

export const api = {
  // Auth
  sendOtp: (email) =>
    fetch(`${API_URL}/auth/send-otp`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ email }) }).then(handleResponse),
  verifyOtp: (email, otp) =>
    fetch(`${API_URL}/auth/verify-otp`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ email, otp }) }).then(handleResponse),
  getMe: () =>
    fetch(`${API_URL}/auth/me`, { headers: getHeaders() }).then(handleResponse),

  // Exams
  createExam: (data) =>
    fetch(`${API_URL}/exams`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getExams: () =>
    fetch(`${API_URL}/exams`, { headers: getHeaders() }).then(handleResponse),
  getExam: (id) =>
    fetch(`${API_URL}/exams/${id}`, { headers: getHeaders() }).then(handleResponse),
  startExam: (id) =>
    fetch(`${API_URL}/exams/${id}/start`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
  stopExam: (id) =>
    fetch(`${API_URL}/exams/${id}/stop`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
  joinExam: (id) =>
    fetch(`${API_URL}/exams/${id}/join`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
  deleteExam: (id) =>
    fetch(`${API_URL}/exams/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Autosave
  saveVersion: (data) =>
    fetch(`${API_URL}/autosave`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getVersions: (examId, studentId) =>
    fetch(`${API_URL}/autosave/${examId}/${studentId}`, { headers: getHeaders() }).then(handleResponse),

  // Submissions
  submitExam: (data) =>
    fetch(`${API_URL}/submissions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getSubmission: (id) =>
    fetch(`${API_URL}/submissions/${id}`, { headers: getHeaders() }).then(handleResponse),
  getExamSubmissions: (examId) =>
    fetch(`${API_URL}/submissions/exam/${examId}`, { headers: getHeaders() }).then(handleResponse),
  getTimeline: (examId, studentId) =>
    fetch(`${API_URL}/submissions/${examId}/${studentId}/timeline`, { headers: getHeaders() }).then(handleResponse),

  // Compiler
  runCode: (fileName, content, stdin) =>
    fetch(`${API_URL}/compiler/run`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ fileName, content, stdin }) 
    }).then(handleResponse),
};

export default api;
