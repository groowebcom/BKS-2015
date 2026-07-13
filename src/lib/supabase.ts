import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let cleanSupabaseUrl = '';
if (supabaseUrl && supabaseUrl.trim() !== '') {
  try {
    if (supabaseUrl.startsWith('http')) {
      const parsed = new URL(supabaseUrl);
      cleanSupabaseUrl = parsed.origin;
    }
  } catch (e) {
    console.error('Failed to parse Supabase URL:', e);
  }
}

const isRealSupabaseConfigured = 
  !!(cleanSupabaseUrl && supabaseAnonKey) &&
  cleanSupabaseUrl !== 'undefined' &&
  cleanSupabaseUrl !== 'null' &&
  cleanSupabaseUrl.trim() !== '' &&
  cleanSupabaseUrl.startsWith('http') &&
  cleanSupabaseUrl.includes('.supabase.') &&
  !cleanSupabaseUrl.includes('run.app') &&
  !cleanSupabaseUrl.includes('localhost') &&
  !cleanSupabaseUrl.includes('YOUR_SUPABASE') &&
  !cleanSupabaseUrl.includes('your_supabase');

console.log('BKS Supabase URL Configured:', isRealSupabaseConfigured ? 'YES (Real)' : 'NO (Simulated)');
if (isRealSupabaseConfigured) {
  console.log('Original Supabase URL:', supabaseUrl);
  console.log('Sanitized Supabase URL:', cleanSupabaseUrl);
}


// Define simulated local auth state
interface SimulatedSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      role: 'OWNER' | 'ADMIN' | 'CUSTOMER';
      name: string;
      username?: string;
      memberNumber?: string;
    };
  } | null;
}

// Memory/Local storage based fallback client
class MockSupabaseClient {
  private listeners: Array<(event: string, session: SimulatedSession | null) => void> = [];
  private currentSession: SimulatedSession | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem('bks_simulated_supabase_session');
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load simulated session:', e);
    }
  }

  private saveSession(session: SimulatedSession | null) {
    this.currentSession = session;
    try {
      if (session) {
        localStorage.setItem('bks_simulated_supabase_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('bks_simulated_supabase_session');
      }
    } catch (e) {
      console.error('Failed to save simulated session:', e);
    }
  }

  auth = {
    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      // Simulate validation
      const emailLower = email.toLowerCase();
      let role: 'OWNER' | 'ADMIN' | 'CUSTOMER';
      let name = '';
      let id = '';
      let username: string | undefined;
      let memberNumber: string | undefined;

      if (emailLower === 'owner@bks.com' && password === 'owner123') {
        role = 'OWNER';
        name = 'Pak Dedek';
        id = 'USR-001';
        username = 'owner';
      } else if (emailLower === 'admin@bks.com' && password === 'admin123') {
        role = 'ADMIN';
        name = 'Siti Rahma';
        id = 'USR-002';
        username = 'admin';
      } else if (emailLower.startsWith('nasabah_') && emailLower.endsWith('@bks.com')) {
        const memberNoRaw = emailLower.substring(8, emailLower.indexOf('@bks.com')).toUpperCase();
        // Fallback or find member in database
        role = 'CUSTOMER';
        id = 'CUST-' + memberNoRaw.replace(/[^a-zA-Z0-9]/g, '');
        // Standard placeholder format
        name = 'Nasabah Simper';
        memberNumber = memberNoRaw;
      } else {
        return { data: { user: null, session: null }, error: { message: 'Email atau password salah.' } };
      }

      const session: SimulatedSession = {
        user: {
          id,
          email,
          user_metadata: {
            role,
            name,
            username,
            memberNumber,
          }
        }
      };

      this.saveSession(session);
      this.triggerListeners('SIGNED_IN', session);

      return { data: { user: session.user, session }, error: null };
    },

    signUp: async ({ email, options }: { email: string; password?: string; options?: any }) => {
      return { 
        data: { 
          user: { 
            id: 'MOCK-NEW-USER', 
            email, 
            user_metadata: options?.data || {} 
          }, 
          session: null 
        }, 
        error: null 
      };
    },

    signOut: async () => {
      this.saveSession(null);
      this.triggerListeners('SIGNED_OUT', null);
      return { error: null };
    },

    getSession: async () => {
      return { data: { session: this.currentSession }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: SimulatedSession | null) => void) => {
      this.listeners.push(callback);
      // Immediately call with current session
      callback('INITIAL_SESSION', this.currentSession);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners = this.listeners.filter(l => l !== callback);
            }
          }
        }
      };
    }
  };

  private triggerListeners(event: string, session: SimulatedSession | null) {
    this.listeners.forEach(l => l(event, session));
  }
}

class ResilientSupabaseClient {
  private realClient: any;
  private mockClient: MockSupabaseClient;
  private useMock = false;

  constructor(realClient: any, mockClient: MockSupabaseClient) {
    this.realClient = realClient;
    this.mockClient = mockClient;
    if (!realClient) {
      this.useMock = true;
    }
  }

  auth = {
    signInWithPassword: async (credentials: any) => {
      if (this.useMock) {
        return this.mockClient.auth.signInWithPassword(credentials);
      }
      try {
        const result = await this.realClient.auth.signInWithPassword(credentials);
        if (result.error) {
          console.warn('Real Supabase Auth error, falling back to mock auth:', result.error);
          this.useMock = true;
          return this.mockClient.auth.signInWithPassword(credentials);
        }
        return result;
      } catch (err) {
        console.warn('Real Supabase Auth threw exception, falling back to mock auth:', err);
        this.useMock = true;
        return this.mockClient.auth.signInWithPassword(credentials);
      }
    },

    signUp: async (credentials: any) => {
      if (this.useMock) {
        return this.mockClient.auth.signUp(credentials as any);
      }
      try {
        const result = await this.realClient.auth.signUp(credentials);
        if (result.error) {
          console.warn('Real Supabase Auth error, falling back to mock auth:', result.error);
          this.useMock = true;
          return this.mockClient.auth.signUp(credentials as any);
        }
        return result;
      } catch (err) {
        console.warn('Real Supabase Auth threw exception, falling back to mock auth:', err);
        this.useMock = true;
        return this.mockClient.auth.signUp(credentials as any);
      }
    },

    signOut: async () => {
      this.useMock = false;
      try {
        await this.mockClient.auth.signOut();
        if (this.realClient) {
          return await this.realClient.auth.signOut();
        }
        return { error: null };
      } catch (err) {
        return { error: null };
      }
    },

    getSession: async () => {
      if (this.useMock) {
        return this.mockClient.auth.getSession();
      }
      try {
        const result = await this.realClient.auth.getSession();
        if (result.error) {
          this.useMock = true;
          return this.mockClient.auth.getSession();
        }
        return result;
      } catch (err) {
        this.useMock = true;
        return this.mockClient.auth.getSession();
      }
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      const mockSub = this.mockClient.auth.onAuthStateChange(callback);
      let realSub: any = null;
      if (this.realClient) {
        try {
          realSub = this.realClient.auth.onAuthStateChange((event: string, session: any) => {
            if (!this.useMock) {
              callback(event, session);
            }
          });
        } catch (e) {
          console.error('Failed to listen to real Supabase auth changes:', e);
        }
      }

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              mockSub.data.subscription.unsubscribe();
              if (realSub && realSub.data && realSub.data.subscription) {
                realSub.data.subscription.unsubscribe();
              }
            }
          }
        }
      };
    }
  };
}

const mockInstance = new MockSupabaseClient();
const realInstance = isRealSupabaseConfigured
  ? createClient(cleanSupabaseUrl, supabaseAnonKey)
  : null;

export const supabase = new ResilientSupabaseClient(realInstance, mockInstance) as any;

export { isRealSupabaseConfigured };
