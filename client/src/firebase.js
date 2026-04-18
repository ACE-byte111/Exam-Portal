import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCsfTy29Otegf0o0SAktm373lTBz1F3990",
  authDomain: "exam-portal-a5394.firebaseapp.com",
  projectId: "exam-portal-a5394",
  storageBucket: "exam-portal-a5394.firebasestorage.app",
  messagingSenderId: "857193806773",
  appId: "1:857193806773:web:51c5019599fbdee0a877fc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
