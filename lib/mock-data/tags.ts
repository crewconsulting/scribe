import { Tag, MatchRule } from '@/types/tags';

export const masterTags: Tag[] = [
  {
    id: '1',
    name: 'Amazon AWS',
    color: '#FF6B6B',
    category: 'クラウドサービス',
    is_master: true,
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rules: [
      { id: '1', tag_id: '1', pattern: 'AWS', type: 'exact', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', tag_id: '1', pattern: 'Amazon Web Services', type: 'exact', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '3', tag_id: '1', pattern: 'EC2', type: 'contains', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]
  },
  {
    id: '2',
    name: 'Microsoft 365',
    color: '#4ECDC4',
    category: 'クラウドサービス',
    is_master: true,
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rules: [
      { id: '1', tag_id: '2', pattern: 'Microsoft 365', type: 'exact', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', tag_id: '2', pattern: 'MS365', type: 'exact', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]
  },
  {
    id: '3',
    name: 'Facebook',
    color: '#45B7D1',
    category: 'マーケティング',
    is_master: true,
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rules: [
      { id: '1', tag_id: '3', pattern: 'FACEBK', type: 'contains', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]
  },
];

export const initialUserTags: Tag[] = [
  {
    id: '4',
    name: 'オフィス賃料',
    color: '#96CEB4',
    category: 'オフィス関連',
    is_master: false,
    user_id: 'user123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rules: [
      { id: '1', tag_id: '4', pattern: 'オフィス賃料', type: 'exact', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', tag_id: '4', pattern: '事務所賃料', type: 'exact', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '3', tag_id: '4', pattern: '家賃', type: 'exact', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]
  },
  {
    id: '5',
    name: '駐車場',
    color: '#FFEEAD',
    category: 'オフィス関連',
    is_master: false,
    user_id: 'user123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rules: [
      { id: '1', tag_id: '5', pattern: '駐車場', type: 'exact', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', tag_id: '5', pattern: 'パーキング', type: 'exact', enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]
  }
];