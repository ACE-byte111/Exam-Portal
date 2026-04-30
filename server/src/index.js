require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.get('origin')}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/autosave', require('./routes/autosave'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/compiler', require('./routes/compiler'));

// Socket
require('./socket/examSocket')(io);

// Background Services
try {
  require('./services/cleanupService').initCleanup();
} catch (err) {
  console.error('[Startup] Failed to initialize cleanup service:', err);
}

// Basic health check
app.get('/', (req, res) => res.send('Portal API is running.'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
