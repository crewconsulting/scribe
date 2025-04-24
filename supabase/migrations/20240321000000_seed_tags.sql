-- マスタータグのシーディング
insert into tags (name, color, category, is_master)
values
  ('Amazon AWS', '#FF6B6B', 'クラウドサービス', true),
  ('Microsoft 365', '#4ECDC4', 'クラウドサービス', true),
  ('Google Cloud', '#45B7D1', 'クラウドサービス', true),
  ('Slack', '#96CEB4', 'コミュニケーション', true),
  ('Zoom', '#FFEEAD', 'コミュニケーション', true),
  ('Facebook Ads', '#D4A5A5', 'マーケティング', true),
  ('Google Ads', '#9B59B6', 'マーケティング', true);

-- マスタータグのルールを追加
insert into tag_rules (tag_id, pattern, type, enabled)
select id, 'AWS', 'exact', true from tags where name = 'Amazon AWS'
union all
select id, 'Amazon Web Services', 'exact', true from tags where name = 'Amazon AWS'
union all
select id, 'EC2', 'contains', true from tags where name = 'Amazon AWS'
union all
select id, 'Microsoft 365', 'exact', true from tags where name = 'Microsoft 365'
union all
select id, 'MS365', 'exact', true from tags where name = 'Microsoft 365'
union all
select id, 'Google Cloud', 'exact', true from tags where name = 'Google Cloud'
union all
select id, 'GCP', 'exact', true from tags where name = 'Google Cloud'
union all
select id, 'Slack', 'exact', true from tags where name = 'Slack'
union all
select id, 'Zoom', 'exact', true from tags where name = 'Zoom'
union all
select id, 'FACEBK', 'contains', true from tags where name = 'Facebook Ads'
union all
select id, 'Google Ads', 'exact', true from tags where name = 'Google Ads'
union all
select id, 'AdWords', 'contains', true from tags where name = 'Google Ads'; 