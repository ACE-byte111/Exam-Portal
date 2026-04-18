const express = require('express');
const firestore = require('../services/firestoreService');
const { requireAuth } = require('../middleware/auth');
const auditLog = require('../services/auditLog');
const router = express.Router();

// Save version snapshot
router.post('/', requireAuth, async (req, res) => {
  const { examId, studentId, files, timestamp } = req.body;
  
  if (req.user.id !== studentId && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Iterate files and save them
  // In a real app we'd compare hash and only save diffs or modified files
  // For demo, we just dump them
  for (const [filename, content] of Object.entries(files)) {
    await firestore.saveVersion(examId, studentId, {
      file: filename,
      content,
      timestamp
    });
  }

  await auditLog.logEvent(examId, studentId, 'autosave', { timestamp });
  res.json({ success: true });
});

// Get versions
router.get('/:examId/:studentId', requireAuth, async (req, res) => {
  const { examId, studentId } = req.params;

  if (req.user.id !== studentId && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const versions = await firestore.getVersions(examId, studentId);
  res.json({ versions });
});

module.exports = router;
