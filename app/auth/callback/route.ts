import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // エラーパラメータがある場合は、エラーページにリダイレクト
  if (error || error_description) {
    console.error('【デバッグ】認証エラーパラメータ検出:', { error, error_description });
    const errorRedirectUrl = new URL('/auth/login', requestUrl.origin);
    errorRedirectUrl.searchParams.set('error', error || 'unknown');
    errorRedirectUrl.searchParams.set('error_description', error_description || '不明なエラーが発生しました');
    return NextResponse.redirect(errorRedirectUrl);
  }

  if (!code) {
    console.error('【デバッグ】コードパラメータがありません');
    return NextResponse.redirect(new URL('/auth/login?error=no_code', requestUrl.origin));
  }

  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // コードをセッションと交換
    await supabase.auth.exchangeCodeForSession(code);
    
    // セッションを取得して確認
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('【デバッグ】セッション作成に失敗しました');
      return NextResponse.redirect(new URL('/auth/login?error=session_creation_failed', requestUrl.origin));
    }
    
    console.log('【デバッグ】認証コード交換成功 - ユーザーID:', session.user.id);
    
    // デフォルトはダッシュボードへリダイレクト
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  } catch (error) {
    console.error('【デバッグ】Auth callback error:', error);
    const errorUrl = new URL('/auth/login', requestUrl.origin);
    errorUrl.searchParams.set('error', 'callback_error');
    return NextResponse.redirect(errorUrl);
  }
}