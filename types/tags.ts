export interface MatchRule {
  id: string;
  tag_id: string;
  pattern: string;
  type: 'exact' | 'prefix' | 'suffix' | 'contains';
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  category: string;
  is_master: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  rules?: MatchRule[];
}

export const MATCH_TYPES = {
  exact: '完全一致',
  prefix: '前方一致',
  suffix: '後方一致',
  contains: 'を含む',
} as const;

export const TAG_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEEAD', // Yellow
  '#D4A5A5', // Pink
  '#9B59B6', // Purple
  '#3498DB', // Light Blue
  '#E67E22', // Orange
  '#1ABC9C', // Turquoise
] as const;

export const TAG_CATEGORIES = [
  'クラウドサービス',
  'オフィス関連',
  'コミュニケーション',
  'マーケティング',
  'その他',
] as const;