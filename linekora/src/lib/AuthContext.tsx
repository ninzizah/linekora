import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, getRedirectResult, User } from 'firebase/auth';
import { getUser, UserProfile } from './api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

/** Tries to fetch user profile from DB with retries (handles signup race condition) */
async function fetchProfileWithRetry(firebaseUser: User, retries = 4, delayMs = 800): Promise<UserProfile | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await getUser(firebaseUser.uid);
      return data;
    } catch {
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  const fetchProfile = async (firebaseUser: User) => {
    const data = await fetchProfileWithRetry(firebaseUser);
    setProfile(data);
  };

  const refreshProfile = async () => {
    if (userRef.current) await fetchProfile(userRef.current);
  };

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch {
        // Redirect result errors are non-critical; onAuthStateChanged handles state
      }
    };
    handleRedirect();

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      userRef.current = firebaseUser;
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

