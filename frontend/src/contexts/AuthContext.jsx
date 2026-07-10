import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';

const AuthContext = createContext();

const hasFirebaseConfig =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_firebase_api_key_here' &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID;

let firebaseAuth = null;

if (hasFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    const app = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(app);
  } catch (err) {
    console.error(err);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    } else {
      // MOCK MODE
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mock_token');

      setUser(null);
      setToken(null);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    if (firebaseAuth) {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await result.user.getIdToken();
      setUser(result.user);
      setToken(idToken);
      return;
    }

    // Mock login
    const mockUid = `mock-${Date.now()}`;
    const mockUser = {
      uid: mockUid,
      email
    };

    setUser(mockUser);
    setToken(mockUid);

    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    localStorage.setItem('mock_token', mockUid);
  };

  const signup = async (email, password, name) => {
    if (firebaseAuth) {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      setUser(result.user);
      return;
    }

    const mockUser = {
      uid: `mock-${Date.now()}`,
      email,
      name
    };

    setUser(mockUser);
  };

  const logout = async () => {
    if (firebaseAuth) {
      await signOut(firebaseAuth);
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem('mock_user');
    localStorage.removeItem('mock_token');
  };

  const loginWithGoogle = async () => {
    if (firebaseAuth) {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      setUser(result.user);
    } else {
      await login('google@test.com', '123456');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        loginWithGoogle
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};