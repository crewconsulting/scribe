import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// グローバルな状態としてSupabaseクライアントを保持
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

// Supabaseクライアントの取得（シングルトンパターン）
export const getSupabaseClient = () => {
  console.log('【デバッグ】getSupabaseClient が呼び出されました');
  
  if (!supabaseClient) {
    console.log('【デバッグ】新しいSupabaseクライアントを作成します');
    supabaseClient = createClientComponentClient<Database>();
  } else {
    console.log('【デバッグ】既存のSupabaseクライアントを返します');
  }
  
  return supabaseClient;
};

// 認証状態のチェック
export const checkAuthStatus = async () => {
  try {
    console.log('【デバッグ】認証状態をチェックします');
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('【デバッグ】認証エラーが発生しました:', error.message);
      return { isAuthenticated: false, user: null, error };
    }
    
    if (!user) {
      console.log('【デバッグ】ユーザーは認証されていません');
      return { isAuthenticated: false, user: null, error: null };
    }
    
    console.log('【デバッグ】ユーザーは認証されています:', user.id);
    return { isAuthenticated: true, user, error: null };
  } catch (e) {
    console.error('【デバッグ】認証チェック中に例外が発生しました:', e);
    return { isAuthenticated: false, user: null, error: e };
  }
}; 