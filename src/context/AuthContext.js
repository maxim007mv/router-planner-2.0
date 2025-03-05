import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [persistenceSet, setPersistenceSet] = useState(false);

  useEffect(() => {
    console.log('AuthProvider - Setting up auth persistence');
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('AuthProvider - Auth persistence set to local');
        setPersistenceSet(true);
      })
      .catch((error) => {
        console.error('AuthProvider - Error setting auth persistence:', error);
        setError(error.message);
      });

    console.log('AuthProvider - Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthProvider - Auth state changed:', user ? `User ${user.uid} detected` : 'No user');
      
      if (user) {
        try {
          console.log('AuthProvider - Fetching additional user data from Firestore');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('AuthProvider - User data found in Firestore:', userData);
            setCurrentUser({
              ...user,
              ...userData
            });
          } else {
            console.log('AuthProvider - No additional user data found in Firestore');
            setCurrentUser(user);
          }
        } catch (error) {
          console.error('AuthProvider - Error fetching user data:', error);
          setCurrentUser(user);
        }
      } else {
        console.log('AuthProvider - No user, setting currentUser to null');
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider - Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('AuthProvider - Attempting login');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthProvider - Login successful');
      return result;
    } catch (error) {
      console.error('AuthProvider - Login error:', error);
      throw error;
    }
  };

  const register = async (email, password, additionalData = {}) => {
    try {
      console.log('AuthProvider - Attempting registration');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      const userDocRef = doc(db, 'users', result.user.uid);
      await setDoc(userDocRef, {
        email: result.user.email,
        createdAt: new Date(),
        ...additionalData
      });
      
      console.log('AuthProvider - Registration successful');
      return result;
    } catch (error) {
      console.error('AuthProvider - Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('AuthProvider - Attempting logout');
      await signOut(auth);
      console.log('AuthProvider - Logout successful');
    } catch (error) {
      console.error('AuthProvider - Logout error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 