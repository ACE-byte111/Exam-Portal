const { mockVerifyToken } = require('../middleware/auth');
const auditLog = require('../services/auditLog');

module.exports = (io) => {
  // Middleware to authenticate socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    const user = mockVerifyToken(token);
    if (!user) return next(new Error("Authentication error"));
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.email} (${socket.id})`);

    // Student joins an exam
    socket.on('student:join', (data) => {
      const { examId, studentId, studentName } = data;
      socket.join(`exam_${examId}`);
      
      // Notify instructors
      io.to(`monitor_${examId}`).emit('student:status', {
        studentId,
        studentName,
        status: 'online',
        isFullscreen: true,
        violations: 0,
        lastActive: new Date().toISOString()
      });
    });

    // Student leaves
    socket.on('student:leave', (data) => {
      const { examId } = data;
      socket.leave(`exam_${examId}`);
      
      // Notify instructors (simplified, normally we'd need to know which exam they left gracefully via disconnect)
      io.to(`monitor_${examId}`).emit('student:status', {
        studentId: socket.user.id,
        studentName: socket.user.name,
        status: 'offline',
        lastActive: new Date().toISOString()
      });
    });

    // Fullscreen violations
    socket.on('student:fullscreen-violation', async (data) => {
      const { examId, studentId, timestamp } = data;
      await auditLog.logEvent(examId, studentId, 'fullscreen_exit', { timestamp });
      
      // Tell instructor
      io.to(`monitor_${examId}`).emit('student:fullscreen-violation', {
        studentId,
        studentName: socket.user.name,
        timestamp
      });
      io.to(`monitor_${examId}`).emit('student:status', {
        studentId,
        studentName: socket.user.name,
        isFullscreen: false
      });
    });

    // Anti-cheat events
    socket.on('student:anti-cheat-event', async (data) => {
      const { examId, studentId, event, timestamp, ...details } = data;
      await auditLog.logEvent(examId, studentId, event, details);
      
      io.to(`monitor_${examId}`).emit('student:anti-cheat-event', {
        studentId,
        studentName: socket.user.name,
        event,
        timestamp,
        details
      });
    });

    // Live Code Update
    socket.on('student:code-update', (data) => {
      const { examId, studentId, files, activeFile } = data;
      // Broadcast to instructors monitoring this exam
      io.to(`monitor_${examId}`).emit('student:code-snapshot', {
        studentId,
        studentName: socket.user.name,
        files,
        activeFile,
        timestamp: new Date().toISOString()
      });
    });

    // Instructor starts monitoring
    socket.on('instructor:monitor', (data) => {
      if (socket.user.role !== 'instructor') return;
      socket.join(`monitor_${data.examId}`);
      console.log(`Instructor monitoring exam ${data.examId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.email}`);
    });
  });
};
