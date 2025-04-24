'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px] p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <BarChart2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Expense Tracker</h1>
          <p className="text-muted-foreground mt-2">
            支出を簡単に管理・分析
          </p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary))',
                  inputBackground: 'hsl(var(--background))',
                  inputBorder: 'hsl(var(--border))',
                  inputBorderFocus: 'hsl(var(--ring))',
                  inputBorderHover: 'hsl(var(--ring))',
                },
              }
            },
            className: {
              container: 'space-y-4',
              label: 'text-sm font-medium',
              button: 'font-medium',
              input: 'bg-background',
              divider: 'bg-border',
            },
          }}
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                email_input_placeholder: 'your@email.com',
                password_input_placeholder: '8文字以上の強力なパスワード',
                button_label: 'サインイン',
                loading_button_label: 'サインインしています...',
                link_text: 'アカウントをお持ちでない方',
              },
              sign_up: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                email_input_placeholder: 'your@email.com',
                password_input_placeholder: '8文字以上の強力なパスワード',
                button_label: 'アカウント作成',
                loading_button_label: '作成しています...',
                link_text: 'すでにアカウントをお持ちの方',
              },
              forgotten_password: {
                link_text: 'パスワードをお忘れの方',
                button_label: 'パスワードをリセット',
                loading_button_label: '送信しています...',
              },
            }
          }}
        />

        <p className="text-center text-xs text-muted-foreground mt-8">
          アカウントを作成することで、利用規約とプライバシーポリシーに同意したことになります。
        </p>
      </Card>
    </div>
  );
}