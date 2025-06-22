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
      user_profiles: {
        Row: {
          id: string
          nickname: string
          avatar_url: string | null
          bio: string | null
          total_rewards: number
          post_count: number
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname: string
          avatar_url?: string | null
          bio?: string | null
          total_rewards?: number
          post_count?: number
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          avatar_url?: string | null
          bio?: string | null
          total_rewards?: number
          post_count?: number
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          audio_url: string | null
          location_data: Json | null
          weather_data: Json | null
          likes_count: number
          comments_count: number
          rewards_count: number
          rewards_amount: number
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          audio_url?: string | null
          location_data?: Json | null
          weather_data?: Json | null
          likes_count?: number
          comments_count?: number
          rewards_count?: number
          rewards_amount?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          audio_url?: string | null
          location_data?: Json | null
          weather_data?: Json | null
          likes_count?: number
          comments_count?: number
          rewards_count?: number
          rewards_amount?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          content: string
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          content: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          content?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          post_id: string
          amount: number
          payment_method: string
          transaction_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          post_id: string
          amount?: number
          payment_method: string
          transaction_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          post_id?: string
          amount?: number
          payment_method?: string
          transaction_id?: string
          status?: string
          created_at?: string
        }
      }
      payment_accounts: {
        Row: {
          id: string
          user_id: string
          payment_type: string
          account_info: Json
          real_name: string
          is_verified: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_type: string
          account_info: Json
          real_name: string
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_type?: string
          account_info?: Json
          real_name?: string
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 