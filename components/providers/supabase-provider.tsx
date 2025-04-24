'use client';

import { createContext, useContext, useState } from 'react';
import { type SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { type Database } from '@/types/supabase';
import { getSupabaseClient } from '@/utils/supabase-client';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // シングルトンクライアントを使用
  const [supabase] = useState(() => getSupabaseClient());

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}; 