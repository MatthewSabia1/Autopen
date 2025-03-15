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
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          avatar_url: string | null
          bio: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          title: string
          description: string | null
          content: Json | null
          status: string | null
          user_id: string
          progress: number | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          title: string
          description?: string | null
          content?: Json | null
          status?: string | null
          user_id: string
          progress?: number | null
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          title?: string
          description?: string | null
          content?: Json | null
          status?: string | null
          user_id?: string
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      creator_contents: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          title: string
          description: string | null
          content: Json | null
          type: string
          status: string | null
          user_id: string
          project_id: string | null
          metadata: Json | null
          version: number | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          title: string
          description?: string | null
          content?: Json | null
          type: string
          status?: string | null
          user_id: string
          project_id?: string | null
          metadata?: Json | null
          version?: number | null
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          title?: string
          description?: string | null
          content?: Json | null
          type?: string
          status?: string | null
          user_id?: string
          project_id?: string | null
          metadata?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_contents_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_contents_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
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