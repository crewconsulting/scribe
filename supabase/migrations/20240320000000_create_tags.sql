-- タグテーブルの作成
create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text not null,
  category text not null,
  is_master boolean default false,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  constraint tags_name_user_id_key unique (name, user_id)
);

-- タグルールテーブルの作成
create table tag_rules (
  id uuid primary key default uuid_generate_v4(),
  tag_id uuid references tags(id) on delete cascade,
  pattern text not null,
  type text not null check (type in ('exact', 'prefix', 'suffix', 'contains')),
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 取引とタグの中間テーブルの作成
create table imported_transactions_tags (
  transaction_id uuid references imported_transactions(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

-- タグテーブルのRLSポリシー
alter table tags enable row level security;

-- マスタータグの参照ポリシー（全ユーザーが参照可能）
create policy "マスタータグは全ユーザーが参照可能" on tags
  for select
  using (is_master = true);

-- カスタムタグの参照ポリシー（所有者のみ）
create policy "カスタムタグは所有者のみ参照可能" on tags
  for select
  using (auth.uid() = user_id);

-- カスタムタグの作成ポリシー（認証済みユーザーのみ）
create policy "認証済みユーザーはカスタムタグを作成可能" on tags
  for insert
  with check (
    auth.uid() = user_id
    and is_master = false
  );

-- カスタムタグの更新ポリシー（所有者のみ）
create policy "カスタムタグは所有者のみ更新可能" on tags
  for update
  using (
    auth.uid() = user_id
    and is_master = false
  );

-- カスタムタグの削除ポリシー（所有者のみ）
create policy "カスタムタグは所有者のみ削除可能" on tags
  for delete
  using (
    auth.uid() = user_id
    and is_master = false
  );

-- タグルールテーブルのRLSポリシー
alter table tag_rules enable row level security;

-- タグルールの参照ポリシー
create policy "タグルールは関連タグにアクセス可能なユーザーが参照可能" on tag_rules
  for select
  using (
    exists (
      select 1 from tags
      where tags.id = tag_rules.tag_id
      and (
        tags.is_master = true
        or tags.user_id = auth.uid()
      )
    )
  );

-- タグルールの作成ポリシー
create policy "タグルールは関連タグの所有者のみ作成可能" on tag_rules
  for insert
  with check (
    exists (
      select 1 from tags
      where tags.id = tag_rules.tag_id
      and tags.user_id = auth.uid()
    )
  );

-- タグルールの更新ポリシー
create policy "タグルールは関連タグの所有者のみ更新可能" on tag_rules
  for update
  using (
    exists (
      select 1 from tags
      where tags.id = tag_rules.tag_id
      and tags.user_id = auth.uid()
    )
  );

-- タグルールの削除ポリシー
create policy "タグルールは関連タグの所有者のみ削除可能" on tag_rules
  for delete
  using (
    exists (
      select 1 from tags
      where tags.id = tag_rules.tag_id
      and tags.user_id = auth.uid()
    )
  );

-- 取引タグ中間テーブルのRLSポリシー
alter table imported_transactions_tags enable row level security;

-- 取引タグの参照ポリシー
create policy "取引タグは関連取引の所有者のみ参照可能" on imported_transactions_tags
  for select
  using (
    exists (
      select 1 from imported_transactions
      where imported_transactions.id = imported_transactions_tags.transaction_id
      and imported_transactions.user_id = auth.uid()
    )
  );

-- 取引タグの作成ポリシー
create policy "取引タグは関連取引の所有者のみ作成可能" on imported_transactions_tags
  for insert
  with check (
    exists (
      select 1 from imported_transactions
      where imported_transactions.id = imported_transactions_tags.transaction_id
      and imported_transactions.user_id = auth.uid()
    )
  );

-- 取引タグの削除ポリシー
create policy "取引タグは関連取引の所有者のみ削除可能" on imported_transactions_tags
  for delete
  using (
    exists (
      select 1 from imported_transactions
      where imported_transactions.id = imported_transactions_tags.transaction_id
      and imported_transactions.user_id = auth.uid()
    )
  );

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