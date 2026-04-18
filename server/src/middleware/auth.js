const jwt = require('jsonwebtoken'); // Need to add jsonwebtoken later, or just mock it

// Since we're doing a demo without a real secret, we'll mock JWT token validation
const mockVerifyToken = (token) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('ascii'));
  } catch (e) {
    return null;
  }
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Token missing.' });
  }

  const token = authHeader.split(' ')[1];
  const user = mockVerifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }

  req.user = user;
  next();
};

const requireInstructor = (req, res, next) => {
  if (!req.user || req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Forbidden. Instructor access required.' });
  }
  next();
};

module.exports = { requireAuth, requireInstructor, mockVerifyToken };
