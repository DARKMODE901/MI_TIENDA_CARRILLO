// src/context/AuthContext.tsx
// Contexto de autenticación global con Supabase.
// Gestiona sesión, usuario actual y operaciones de auth (login, registro, logout).

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AuthContextValue {
  /** Sesión activa de Supabase (null si no está autenticado) */
  session: Session | null;
  /** Usuario autenticado (null si no está autenticado) */
  user: User | null;
  /** Indica si el usuario está autenticado */
  isAuthenticated: boolean;
  /** Indica si se está restaurando la sesión al iniciar la app */
  loading: boolean;
  /** Inicia sesión con email y contraseña */
  signIn: (email: string, password: string) => Promise<void>;
  /** Registra un nuevo usuario con email y contraseña */
  signUp: (email: string, password: string) => Promise<void>;
  /** Cierra la sesión activa */
  signOut: () => Promise<void>;
  /** Fuerza la recarga de la sesión actual */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      // Timeout preventivo de 3s para evitar que la UI quede congelada si la red está lenta
      const getSessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: Session | null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 3000)
      );

      const { data } = await Promise.race([getSessionPromise, timeoutPromise]);
      const currentSession = data?.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    } catch (error) {
      console.warn('[AuthContext] Error restaurando sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Escuchar eventos de cambio de estado (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshSession = async (): Promise<void> => {
    await fetchSession();
  };

  const value: AuthContextValue = {
    session,
    user,
    isAuthenticated: !!user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticación en cualquier componente.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un <AuthProvider>');
  }
  return context;
}

