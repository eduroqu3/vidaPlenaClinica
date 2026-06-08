import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const hasCredentials = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('YOUR_') &&
  !supabaseUrl.includes('MY_')
);

if (!hasCredentials) {
  console.warn('Supabase credentials are missing or invalid. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in settings or .env.');
}

// Recursive Proxy that catches all method calls, chaining, and properties, returning safe empty responses where async/then is needed.
function createMockSupabase(): any {
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'then') {
        // Allow it to act like a promise resolving with empty data
        return (resolve: any) => resolve({ data: [], error: null, count: 0 });
      }
      if (prop === 'auth') {
        return {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithPassword: async () => ({ data: {}, error: new Error('Supabase is not configured.') }),
          signOut: async () => ({ data: {}, error: null }),
        };
      }
      // For any normal method call, return a function that returns the same proxy for chaining
      return (...args: any[]) => {
        return new Proxy(() => {}, handler);
      };
    }
  };
  return new Proxy(() => {}, handler);
}

export const supabase = hasCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabase();
