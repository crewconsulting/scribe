'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, LogIn, Loader2 } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function UserButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('認証エラー:', error.message);
          setError(error.message);
        } else {
          setEmail(user?.email || null);
        }
      } catch (err) {
        console.error('認証チェック例外:', err);
        setError(err instanceof Error ? err.message : '認証エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    getUser();
    
    // 認証状態変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setEmail(session.user.email || null);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setEmail(null);
        setIsLoading(false);
      }
    });
    
    // クリーンアップ関数
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      setEmail(null);
      router.refresh();
      router.push('/auth/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // ローディング中は読み込みアイコンを表示
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin opacity-50" />
      </Button>
    );
  }

  // 未認証の場合はログインボタンを表示
  if (!email) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/auth/login" className="flex items-center gap-1">
          <LogIn className="h-4 w-4 mr-1" />
          ログイン
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
        <DropdownMenuLabel className="font-normal text-xs truncate max-w-[200px]">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ログアウト中...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}