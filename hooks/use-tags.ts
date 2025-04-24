import { useCallback } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Tag, MatchRule } from '@/types/tags';

export function useTags() {
  const { supabase } = useSupabase();

  const fetchTags = useCallback(async () => {
    const { data: tags, error } = await supabase
      .from('tags')
      .select(`
        *,
        rules:tag_rules(*)
      `)
      .order('created_at');

    if (error) throw error;
    return tags as Tag[];
  }, [supabase]);

  const createTag = useCallback(async (tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [supabase]);

  const updateTag = useCallback(async (id: string, updates: Partial<Tag>) => {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [supabase]);

  const deleteTag = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, [supabase]);

  const createRule = useCallback(async (rule: Omit<MatchRule, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('tag_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [supabase]);

  const updateRule = useCallback(async (id: string, updates: Partial<MatchRule>) => {
    const { data, error } = await supabase
      .from('tag_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [supabase]);

  const deleteRule = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('tag_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, [supabase]);

  return {
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    createRule,
    updateRule,
    deleteRule,
  };
} 