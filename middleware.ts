import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // デフォルトのレスポンスを準備
    const res = NextResponse.next();
    
    // 静的ファイルやコールバックなどの除外パスはスキップ
    if (
      req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.startsWith('/static') ||
      req.nextUrl.pathname.startsWith('/api/') ||
      req.nextUrl.pathname.startsWith('/auth/callback') ||
      req.nextUrl.pathname.includes('favicon.ico')
    ) {
      return res;
    }
    
    // Supabaseクライアントの初期化
    const supabase = createMiddlewareClient({ req, res });
    
    // セッションの確認
    const { data: { session } } = await supabase.auth.getSession();
    
    // 認証関連ページへのアクセス処理
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    
    // 認証済みユーザーが認証ページにアクセスした場合はダッシュボードへリダイレクト
    if (isAuthPage && session) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // 未認証ユーザーが保護されたページにアクセスした場合はログインページへリダイレクト
    if (!isAuthPage && !session) {
      const redirectUrl = new URL('/auth/login', req.url);
      
      // リダイレクト後の戻り先URLを保存（ただし認証ページ自体は除外）
      if (
        req.nextUrl.pathname !== '/' && 
        !req.nextUrl.pathname.startsWith('/_next')
      ) {
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      }
      
      return NextResponse.redirect(redirectUrl);
    }
    
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // エラーの場合はログインページへリダイレクト（ただし無限ループを避ける）
    if (!req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/auth/login?error=middleware_error', req.url));
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - auth/callback (auth callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth/callback).*)',
  ],
};