'use client';

import { Suspense } from 'react';
import Link from 'next/link';

// not-foundコンテンツコンポーネント
function NotFoundContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">ページが見つかりません</h2>
      <p className="text-muted-foreground mb-8">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        ホームに戻る
      </Link>
    </div>
  );
}

// メインのページコンポーネント
export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p>読み込み中...</p>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
} 