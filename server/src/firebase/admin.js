const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let adminDb = null;

try {
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    adminDb = admin.firestore();
    console.log('Firebase Admin SDK initialized successfully.');
  } else {
    console.warn(`
      ⚠️ Firebase Service Account Key not found at ${serviceAccountPath}. 
      Backend Firebase features will be mocked or throw errors until configured.
      Please create a project, generate a key, and place it in the server root.
    `);
    
    // Mock the db for the demo if no key is provided just so the server doesn't crash on boot
    adminDb = {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false, data: () => ({}) }),
          set: async () => {},
          update: async () => {},
          delete: async () => {},
          collection: () => ({
            add: async () => ({ id: 'mock-id' }),
            get: async () => ({ empty: true, docs: [] })
          })
        }),
        get: async () => ({ empty: true, docs: [] }),
        add: async () => ({ id: 'mock-id' }),
        where: () => ({
          get: async () => ({ empty: true, docs: [] })
        })
      })
    };
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

module.exports = { adminDb, admin };
