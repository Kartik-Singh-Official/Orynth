import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import {
  getSupabase,
  getCurrentUser,
  getCurrentSession,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  isSupabaseConfigured,
  fetchSavedQuestions,
  fetchSavedChecklists,
} from "../supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  authModalOpen: boolean;
  authModalMode: "login" | "signup" | "config";
  savedWorkDrawerOpen: boolean;
  savedQuestionsCount: number;
  savedChecklistsCount: number;
  openAuthModal: (mode?: "login" | "signup" | "config") => void;
  closeAuthModal: () => void;
  openSavedWorkDrawer: () => void;
  closeSavedWorkDrawer: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSavedCounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(isSupabaseConfigured());
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup" | "config">("login");
  const [savedWorkDrawerOpen, setSavedWorkDrawerOpen] = useState<boolean>(false);
  const [savedQuestionsCount, setSavedQuestionsCount] = useState<number>(0);
  const [savedChecklistsCount, setSavedChecklistsCount] = useState<number>(0);

  const refreshSavedCounts = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      if (!u) {
        setSavedQuestionsCount(0);
        setSavedChecklistsCount(0);
        return;
      }
      const questions = await fetchSavedQuestions();
      const checklists = await fetchSavedChecklists();
      setSavedQuestionsCount(questions.length);
      setSavedChecklistsCount(checklists.length);
    } catch (err) {
      console.warn("Failed to refresh saved counts:", err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      setIsConfigured(isSupabaseConfigured());
      const u = await getCurrentUser();
      const s = await getCurrentSession();
      setUser(u);
      setSession(s);
      if (u) {
        await refreshSavedCounts();
      }
    } catch (err) {
      console.error("Error refreshing auth:", err);
    } finally {
      setLoading(false);
    }
  }, [refreshSavedCounts]);

  useEffect(() => {
    refreshUser();

    const client = getSupabase();
    if (client) {
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        refreshSavedCounts();
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [refreshUser, refreshSavedCounts]);

  const openAuthModal = (mode: "login" | "signup" | "config" = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setIsConfigured(isSupabaseConfigured());
  };

  const openSavedWorkDrawer = () => {
    setSavedWorkDrawerOpen(true);
    refreshSavedCounts();
  };

  const closeSavedWorkDrawer = () => {
    setSavedWorkDrawerOpen(false);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmail(email, password);
    await refreshUser();
    closeAuthModal();
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    await signUpWithEmail(email, password, fullName);
    await refreshUser();
    closeAuthModal();
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
    setSavedQuestionsCount(0);
    setSavedChecklistsCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        authModalOpen,
        authModalMode,
        savedWorkDrawerOpen,
        savedQuestionsCount,
        savedChecklistsCount,
        openAuthModal,
        closeAuthModal,
        openSavedWorkDrawer,
        closeSavedWorkDrawer,
        signIn,
        signUp,
        signOut,
        refreshSavedCounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
