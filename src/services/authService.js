import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const register = async (userData) => {
  console.log('authService - Starting registration process');
  
  const { email, password, ...profileData } = userData;
  
  try {
    // Create authentication user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('authService - Firebase Auth user created:', user.uid);

    // Update profile with displayName and photoURL
    if (profileData.displayName || profileData.photoURL) {
      await updateProfile(user, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });
      console.log('authService - User profile updated');
    }

    // Store additional user data in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      ...profileData,
      email,
      uid: user.uid,
      createdAt: new Date().toISOString()
    });
    console.log('authService - User data stored in Firestore');

    return userCredential;
  } catch (error) {
    console.error('authService - Registration error:', error);
    throw error;
  }
};

export const login = async (email, password) => {
  console.log('authService - Attempting login');
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('authService - Login successful');
    return userCredential;
  } catch (error) {
    console.error('authService - Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  console.log('authService - Attempting logout');
  try {
    await signOut(auth);
    console.log('authService - Logout successful');
  } catch (error) {
    console.error('authService - Logout error:', error);
    throw error;
  }
}; 