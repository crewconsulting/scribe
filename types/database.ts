export interface Database {
  public: {
    Tables: {
      tags: {
        Row: {
          id: string
          name: string
          color: string
          category: string
          is_master: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          category: string
          is_master?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          category?: string
          is_master?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tag_rules: {
        Row: {
          id: string
          tag_id: string
          pattern: string
          type: 'exact' | 'prefix' | 'suffix' | 'contains'
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tag_id: string
          pattern: string
          type: 'exact' | 'prefix' | 'suffix' | 'contains'
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tag_id?: string
          pattern?: string
          type?: 'exact' | 'prefix' | 'suffix' | 'contains'
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      imported_transactions_tags: {
        Row: {
          transaction_id: string
          tag_id: string
        }
        Insert: {
          transaction_id: string
          tag_id: string
        }
        Update: {
          transaction_id?: string
          tag_id?: string
        }
      }
    }
  }
} 