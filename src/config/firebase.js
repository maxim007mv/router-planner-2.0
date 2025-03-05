import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBzTZyKg8fOa8aD7JBO5B4WQI-RtAjZvtk",
  authDomain: "router-planner-2443d.firebaseapp.com",
  projectId: "router-planner-2443d",
  storageBucket: "router-planner-2443d.appspot.com",
  messagingSenderId: "511462756597",
  appId: "1:511462756597:web:a1b2c3d4e5f6a7b8c9d0e1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 