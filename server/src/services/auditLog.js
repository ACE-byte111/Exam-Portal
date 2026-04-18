const firestoreService = require('./firestoreService');
const crypto = require('crypto');

// Using the mock store directly for the demo
const store = require('./firestoreService'); // Using the same store reference

const auditLog = {
  logEvent: async (examId, studentId, eventName, metadata = {}) => {
    const event = {
      id: crypto.randomUUID(),
      action: eventName,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    // Simulating Firestore subcollection 'auditLogs/{examId}_{studentId}/events'
    // For demo purposes, we log it to console or we can append to our mock store.
    console.log(`[AUDIT] ${examId}/${studentId} | ${eventName} |`, metadata);
    return event;
  }
};

module.exports = auditLog;
