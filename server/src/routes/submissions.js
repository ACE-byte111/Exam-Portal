const express = require('express');
const crypto = require('crypto');
const firestore = require('../services/firestoreService');
const { requireAuth, requireInstructor } = require('../middleware/auth');
const auditLog = require('../services/auditLog');
const router = express.Router();

// Final submit
router.post('/', requireAuth, async (req, res) => {
  const { examId, studentId, files, trigger, saveCount } = req.body;

  if (req.user.id !== studentId && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const exam = await firestore.getExam(examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const submission = {
    id: crypto.randomUUID(),
    examId,
    studentId,
    studentName: req.user.name,
    studentEmail: req.user.email,
    files,
    trigger,
    autosaveCount: saveCount,
    submittedAt: new Date().toISOString()
  };

  await firestore.createSubmission(submission);
  await auditLog.logEvent(examId, studentId, 'submitted', { trigger });

  res.status(201).json({ submission });
});

// Get submissions for an exam (instructor only)
router.get('/exam/:examId', requireAuth, requireInstructor, async (req, res) => {
  const submissions = await firestore.getSubmissionsForExam(req.params.examId);
  res.json({ submissions });
});

// Get specific submission
router.get('/:id', requireAuth, async (req, res) => {
  const submission = await firestore.getSubmission(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Not found' });
  
  if (req.user.id !== submission.studentId && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({ submission });
});

module.exports = router;
