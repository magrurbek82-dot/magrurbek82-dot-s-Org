import { useCallback, useEffect, useState } from 'react';
import {
  type SupabaseAuthSession,
  type SupabaseAuthUser,
  type SupabaseBrowserClient,
} from '../../lib/supabase-browser';

export type AuthSessionState = {
  status: 'loading' | 'authenticated' | 'anonymous' | 'error';
  session: SupabaseAuthSession | null;
  user: SupabaseAuthUser | null;
  error: Error | null;
  refresh: () => Promise<void>;
};

/**
 * The shell passes a configured browser client. A missing client is an explicit
 * anonymous/configuration state rather than an implicit development bypass.
 */
export function useAuthSession(client: SupabaseBrowserClient | null): AuthSessionState {
  const [state, setState] = useState<Omit<AuthSessionState, 'refresh'>>({
    status: 'loading',
    session: null,
    user: null,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!client) {
      setState({ status: 'anonymous', session: null, user: null, error: null });
      return;
    }

    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      const session = data.session;
      setState({
        status: session ? 'authenticated' : 'anonymous',
        session,
        user: session?.user ?? null,
        error: null,
      });
    } catch (error) {
      setState({
        status: 'error',
        session: null,
        user: null,
        error: error instanceof Error ? error : new Error('Could not read the current session.'),
      });
    }
  }, [client]);

  useEffect(() => {
    void refresh();
    if (!client) return undefined;

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setState({
        status: session ? 'authenticated' : 'anonymous',
        session,
        user: session?.user ?? null,
        error: null,
      });
    });
    return () => data.subscription.unsubscribe();
  }, [client, refresh]);

  return { ...state, refresh };
}
