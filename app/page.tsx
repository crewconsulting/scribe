import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardPage } from '@/components/pages/dashboard';

export default async function Home() {
  try {
    // Next.js 14の正しい方法でSupabaseクライアントを初期化
    const supabase = createServerComponentClient({
      cookies
    });
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('認証セッション取得エラー:', error.message);
      redirect('/auth/login');
    }
    
    if (!session) {
      redirect('/auth/login');
    }
    
    return <DashboardPage />;
  } catch (err) {
    console.error('ホームページでの認証エラー:', err);
    redirect('/auth/login');
  }
}