import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';

interface SimpleUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  currentUser: SimpleUser | null;
  userProfile: DocumentData | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  userProfile: null, 
  loading: true,
  refreshUserProfile: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SimpleUser | null>(null);
  const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (uid: string) => {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const profileData = userDocSnap.data();
      const mutableProfileData = profileData as any;
      if (mutableProfileData?.createdAt && typeof mutableProfileData.createdAt.toDate === 'function') {
        mutableProfileData.createdAt = mutableProfileData.createdAt.toDate().toISOString();
      }
      setUserProfile(mutableProfileData);
    } else {
      console.log("No such user profile in Firestore!");
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const simpleUser: SimpleUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
        };
        setCurrentUser(simpleUser);
        await fetchUserProfile(user.uid);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid);
    }
  }, [currentUser, fetchUserProfile]);

  const value = {
    currentUser,
    userProfile,
    loading,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
