export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      import_history: {
        Row: {
          id: string
          user_id: string
          file_name: string
          status: 'processing' | 'completed' | 'error'
          success_count: number
          error_count: number
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          status?: 'processing' | 'completed' | 'error'
          success_count?: number
          error_count?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          status?: 'processing' | 'completed' | 'error'
          success_count?: number
          error_count?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
