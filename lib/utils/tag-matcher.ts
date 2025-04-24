import { Tag, MatchRule } from '@/types/tags';

export function findMatchingTag(description: string, tags: Tag[]): string | null {
  for (const tag of tags) {
    // タグのルールが無効の場合はスキップ
    if (!tag.rules || tag.rules.length === 0) continue;

    // 有効なルールのみを使用
    const activeRules = tag.rules.filter(rule => rule.enabled);
    
    for (const rule of activeRules) {
      let isMatch = false;
      const pattern = rule.pattern;

      switch (rule.type) {
        case 'exact':
          isMatch = description === pattern;
          break;
        case 'prefix':
          isMatch = description.startsWith(pattern);
          break;
        case 'suffix':
          isMatch = description.endsWith(pattern);
          break;
        case 'contains':
          isMatch = description.includes(pattern);
          break;
      }

      if (isMatch) {
        return tag.name;
      }
    }
  }

  return null;
}