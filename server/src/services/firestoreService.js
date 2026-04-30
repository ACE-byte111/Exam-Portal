const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin (safe guard to ensure it only initializes once)
if (!admin.apps.length) {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // For Production (Render.com) environment
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // For Local Development fallback
    serviceAccount = require('../../serviceAccountKey.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const firestoreService = {
  // Users
  getUser: async (email) => {
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
  },
  getUserById: async (id) => {
    const doc = await db.collection('users').doc(id).get();
    return doc.exists ? doc.data() : null;
  },
  createUser: async (userData) => {
    await db.collection('users').doc(userData.id).set(userData);
    return userData;
  },

  // Exams
  createExam: async (examData) => {
    await db.collection('exams').doc(examData.id).set(examData);
    return examData;
  },
  getExams: async () => {
    const snapshot = await db.collection('exams').get();
    return snapshot.docs.map(doc => doc.data());
  },
  getExam: async (id) => {
    const doc = await db.collection('exams').doc(id).get();
    return doc.exists ? doc.data() : null;
  },
  updateExam: async (id, data) => {
    const docRef = db.collection('exams').doc(id);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.update(data);
      const updated = await docRef.get();
      return updated.data();
    }
    return null;
  },
  deleteExam: async (id) => {
    await db.collection('exams').doc(id).delete();
    // Also cleanup related submissions (optional but recommended)
    const subs = await db.collection('submissions').where('examId', '==', id).get();
    const batch = db.batch();
    subs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return true;
  },

  // Autosaves (Using a resilient sub-collection pattern)
  // This completely eliminates the 1MB limit for massive coding sessions!
  saveVersion: async (examId, studentId, versionData) => {
    const docId = `${examId}_${studentId}`;
    const versionWithId = {
      id: crypto.randomUUID(),
      ...versionData,
      serverTimestamp: Date.now() // For reliable chronological ordering
    };
    
    await db.collection('autosaves')
      .doc(docId)
      .collection('versions')
      .doc(versionWithId.id)
      .set(versionWithId);
      
    return true;
  },
  getVersions: async (examId, studentId) => {
    const docId = `${examId}_${studentId}`;
    const snapshot = await db.collection('autosaves')
      .doc(docId)
      .collection('versions')
      .orderBy('serverTimestamp', 'asc')
      .get();
      
    return snapshot.docs.map(doc => doc.data());
  },

  // Submissions
  createSubmission: async (submissionData) => {
    await db.collection('submissions').doc(submissionData.id).set(submissionData);
    return submissionData;
  },
  getSubmissionsForExam: async (examId) => {
    const snapshot = await db.collection('submissions').where('examId', '==', examId).get();
    const subs = snapshot.docs.map(doc => doc.data());
    
    // Join with user data for each submission if missing
    return Promise.all(subs.map(async sub => {
      if (sub.studentName && sub.studentEmail) return sub;
      
      const user = await firestoreService.getUserById(sub.studentId);
      if (user) {
        return {
          ...sub,
          studentName: user.name,
          studentEmail: user.email
        };
      }
      return sub;
    }));
  },
  getSubmission: async (id) => {
    const doc = await db.collection('submissions').doc(id).get();
    return doc.exists ? doc.data() : null;
  },
};

module.exports = firestoreService;
