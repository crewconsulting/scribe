import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// クライアントサイドでのみストレージを使用
const getStorage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  return undefined;
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: getStorage(),
      storageKey: 'supabase.auth.token',
      debug: process.env.NODE_ENV === 'development'
    }
  }
);

// セッション更新後のリダイレクト設定
export const refreshSessionAndRedirect = async (redirectPath = '/') => {
  try {
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
    
    // ブラウザ環境の場合のみリダイレクト
    if (typeof window !== 'undefined') {
      window.location.href = redirectPath;
    }
  } catch (error) {
    console.error('セッション更新エラー:', error);
    // エラー時はログインページへリダイレクト
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }
};