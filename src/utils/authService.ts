import type { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignUpResponse extends AuthResponse {
  requiresEmailConfirmation: boolean;
}

/**
 * Registrazione nuovo utente con metadati (username, real_name)
 */
export async function signUp(
  email: string,
  password: string,
  username: string,
  realName: string
): Promise<SignUpResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          real_name: realName.trim(),
        },
      },
    });

    const user = data?.user ?? null;
    const session = data?.session ?? null;
    // Se l'utente è creato ma la sessione è null (e non c'è errore bloccante), è richiesta la conferma email
    const requiresEmailConfirmation = !error && !!user && !session;

    return {
      user,
      session,
      error,
      requiresEmailConfirmation,
    };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error: err instanceof Error ? (err as AuthError) : ({ message: String(err) } as AuthError),
      requiresEmailConfirmation: false,
    };
  }
}

/**
 * Accesso con email e password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return {
      user: data?.user ?? null,
      session: data?.session ?? null,
      error,
    };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error: err instanceof Error ? (err as AuthError) : ({ message: String(err) } as AuthError),
    };
  }
}

/**
 * Logout sessione corrente
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err: any) {
    return {
      error: err instanceof Error ? (err as AuthError) : ({ message: String(err) } as AuthError),
    };
  }
}

/**
 * Recupera l'utente autenticato corrente
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) return data.user;
  } catch {
    // Network or offline error: fall back to local stored session
  }
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData?.session?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Recupera la sessione corrente attiva
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data) return null;
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Listener per i cambi di stato autenticazione Supabase
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return subscription;
}
