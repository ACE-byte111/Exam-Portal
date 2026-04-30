const firestore = require('./firestoreService');

const CLEANUP_INTERVAL = 1000 * 60 * 60; // Every 1 hour
const EXPIRY_DAYS = 3;

const runCleanup = async () => {
  console.log('[Cleanup] Checking for expired exams...');
  try {
    const exams = await firestore.getExams();
    const now = Date.now();
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    for (const exam of exams) {
      // Use createdAt or endTime as the basis for deletion
      const referenceTime = exam.endTime ? new Date(exam.endTime).getTime() : new Date(exam.createdAt).getTime();
      
      if (now - referenceTime > expiryMs) {
        console.log(`[Cleanup] Deleting expired exam: ${exam.title} (${exam.id})`);
        await firestore.deleteExam(exam.id);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      console.log(`[Cleanup] Successfully removed ${deletedCount} expired exams.`);
    } else {
      console.log('[Cleanup] No expired exams found.');
    }
  } catch (err) {
    console.error('[Cleanup] Error during automatic cleanup:', err);
  }
};

const initCleanup = () => {
  // Run once on startup
  runCleanup();
  // Then run periodically
  setInterval(runCleanup, CLEANUP_INTERVAL);
};

module.exports = { initCleanup };
