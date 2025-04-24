'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BarChart2, AlertCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // パスワードの強度チェック
      if (password.length < 8) {
        setError('パスワードは8文字以上である必要があります');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        console.error('登録エラー:', error);
        if (error.message.includes('email')) {
          setError('このメールアドレスは既に使用されているか、無効です');
        } else if (error.message.includes('password')) {
          setError('パスワードが要件を満たしていません（8文字以上で強力なパスワードを設定してください）');
        } else {
          setError(`登録エラー: ${error.message}`);
        }
        return;
      }

      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          setError('このメールアドレスは既に登録されています。ログインしてください。');
          return;
        }

        setSuccess('アカウントが作成されました！確認メールをご確認ください。');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err) {
      console.error('登録エラー:', err);
      setError('アカウントの作成に失敗しました。入力内容を確認してください。');
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
          <h1 className="text-2xl font-bold">アカウント作成</h1>
          <p className="text-muted-foreground mt-2">
            新しいアカウントを作成して始めましょう
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              8文字以上で、大文字・小文字・数字を含むパスワードを設定してください
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '作成しています...' : 'アカウントを作成'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            すでにアカウントをお持ちの方は
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/auth/login">ログイン</Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          アカウントを作成することで、利用規約とプライバシーポリシーに同意したことになります。
        </p>
      </Card>
    </div>
  );
}