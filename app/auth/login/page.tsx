'use client';

import { useState, Suspense } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BarChart2, AlertCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Params を取得するためのコンポーネント
function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('メールアドレスまたはパスワードが正しくありません。');
        } else {
          setError(`ログインエラー: ${error.message}`);
        }
        return;
      }

      if (data.user) {
        console.log('ログイン成功:', data.user.id);
        router.refresh();
        router.push(redirectPath);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('予期せぬエラーが発生しました。しばらく時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px] p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <BarChart2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">ログイン</h1>
          <p className="text-muted-foreground mt-2">
            アカウントにサインインして始めましょう
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="8文字以上の強力なパスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'ログインしています...' : 'ログイン'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            アカウントをお持ちでない方は
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/auth/register">新規登録</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

// メインのページコンポーネント
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-[400px] p-8 flex items-center justify-center">
          <p>読み込み中...</p>
        </Card>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}