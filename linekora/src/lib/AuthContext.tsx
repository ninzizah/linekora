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

/** Races a promise against a deadline so slow/hung requests can't block the UI forever. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/** Tries to fetch user profile from DB with retries (handles signup race condition) */
async function fetchProfileWithRetry(firebaseUser: User, retries = 3, delayMs = 700, attemptTimeoutMs = 8000): Promise<UserProfile | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await withTimeout(getUser(firebaseUser.uid), attemptTimeoutMs);
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
  // Monotonic request id: stale profile responses (e.g. from a previous login/user)
  // must never overwrite a newer auth state.
  const profileReqId = useRef(0);

  const fetchProfile = async (firebaseUser: User) => {
    const reqId = ++profileReqId.current;
    const data = await fetchProfileWithRetry(firebaseUser);
    if (profileReqId.current === reqId) {
      setProfile(data);
    }
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

    // Last-resort guard: if Firebase auth never resolves (SDK hang), release
    // the loading spinner after a fixed delay instead of spinning forever.
    const authTimeout = setTimeout(() => {
      profileReqId.current += 1;
      setLoading(false);
    }, 15000);

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Invalidate any in-flight profile fetch for a previous session/user.
      profileReqId.current += 1;
      userRef.current = firebaseUser;
      setUser(firebaseUser);
      if (firebaseUser) {
        // Keep loading=true until the profile resolves so routes never render
        // with a null profile right after login (avoids false /select-role redirects).
        // Hard cap the whole wait so "Securing session..." can never spin forever.
        await withTimeout(fetchProfile(firebaseUser), 10000).catch(() => {});
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(authTimeout);
      unsubAuth();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

