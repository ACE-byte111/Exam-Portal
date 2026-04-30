const express = require('express');
const crypto = require('crypto');
const firestore = require('../services/firestoreService');
const { requireAuth, requireInstructor } = require('../middleware/auth');
const auditLog = require('../services/auditLog');
const router = express.Router();

// Get all exams (Instructors see all, students see active/upcoming/past where applicable)
router.get('/', requireAuth, async (req, res) => {
  const allExams = await firestore.getExams();
  // Simplified logic for demo: return all exams to everyone, usually you'd filter by assigned class for students
  res.json({ exams: allExams });
});

const githubService = require('../services/githubService');

// ... (other routes)

// Create exam
router.post('/', requireAuth, requireInstructor, async (req, res) => {
  const { title, course, duration, allowedExtensions, fullscreenRequired, repoTemplate, starterFiles } = req.body;
  
  let finalStarterFiles = starterFiles || {};

  // Auto-clone logic if GitHub repo is provided
  if (repoTemplate) {
    try {
      const repoInfo = githubService.parseGitHubUrl(repoTemplate);
      if (repoInfo) {
        console.log(`[GitHub] Fetching template from ${repoInfo.owner}/${repoInfo.repo}${repoInfo.path ? ' path: ' + repoInfo.path : ''}...`);
        const githubFiles = await githubService.fetchRepoContents(repoInfo.owner, repoInfo.repo, repoInfo.path);
        finalStarterFiles = { ...githubFiles, ...finalStarterFiles }; // Manual files take precedence
        console.log(`[GitHub] Successfully fetched ${Object.keys(githubFiles).length} files.`);
      }
    } catch (err) {
      console.error(`[GitHub] Failed to fetch repo:`, err.message);
    }
  }

  const newExam = {
    id: crypto.randomUUID(),
    title,
    course,
    duration,
    allowedExtensions,
    fullscreenRequired,
    repoTemplate,
    starterFiles: finalStarterFiles,
    status: 'draft',
    createdAt: new Date().toISOString()
  };

  await firestore.createExam(newExam);
  res.status(201).json({ exam: newExam });
});

// Get single exam details
router.get('/:id', requireAuth, async (req, res) => {
  const exam = await firestore.getExam(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  res.json({ exam });
});

// Start exam
router.put('/:id/start', requireAuth, requireInstructor, async (req, res) => {
  const exam = await firestore.getExam(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const now = new Date();
  const endTime = new Date(now.getTime() + exam.duration * 60000);

  const updated = await firestore.updateExam(req.params.id, {
    status: 'active',
    startTime: now.toISOString(),
    endTime: endTime.toISOString()
  });

  res.json({ exam: updated });
});

// Stop exam
router.put('/:id/stop', requireAuth, requireInstructor, async (req, res) => {
  const updated = await firestore.updateExam(req.params.id, { status: 'ended' });
  if (!updated) return res.status(404).json({ error: 'Exam not found' });
  res.json({ exam: updated });
});

// Student joins exam
router.post('/:id/join', requireAuth, async (req, res) => {
  const exam = await firestore.getExam(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  
  if (exam.status !== 'active') {
    return res.status(400).json({ error: 'Exam is not currently active' });
  }

  await auditLog.logEvent(exam.id, req.user.id, 'exam_joined');
  res.json({ message: 'Joined successfully' });
});

// Delete exam
router.delete('/:id', requireAuth, requireInstructor, async (req, res) => {
  console.log(`[Exam] Deleting exam: ${req.params.id} (Requested by: ${req.user.email})`);
  await firestore.deleteExam(req.params.id);
  res.json({ message: 'Exam and all submissions deleted successfully' });
});

module.exports = router;
