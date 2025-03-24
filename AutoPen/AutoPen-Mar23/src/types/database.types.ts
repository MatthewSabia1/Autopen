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
          username: string | null
          avatar_url: string | null
          updated_at: string
          bio: string | null
          dark_mode: boolean | null
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
          bio?: string | null
          dark_mode?: boolean | null
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
          bio?: string | null
          dark_mode?: boolean | null
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
          status: string | null
          content: Json | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
          status?: string | null
          content?: Json | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
          status?: string | null
          content?: Json | null
        }
      }
      project_folders: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      folder_projects: {
        Row: {
          id: string
          folder_id: string
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          folder_id: string
          project_id: string
          created_at?: string
        }
        Update: {
          id?: string
          folder_id?: string
          project_id?: string
          created_at?: string
        }
      }
      brain_dumps: {
        Row: {
          id: string
          title: string
          content: string | null
          user_id: string
          created_at: string
          updated_at: string
          project_id: string | null
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
          project_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
          project_id?: string | null
        }
      }
      creator_contents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          content: Json | null
          type: string
          status: string
          user_id: string
          project_id: string | null
          metadata: Json | null
          version: number
          workflow_step: string | null
          generation_progress: Json | null
          ai_model_settings: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          content?: Json | null
          type: string
          status?: string
          user_id: string
          project_id?: string | null
          metadata?: Json | null
          version?: number
          workflow_step?: string | null
          generation_progress?: Json | null
          ai_model_settings?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          content?: Json | null
          type?: string
          status?: string
          user_id?: string
          project_id?: string | null
          metadata?: Json | null
          version?: number
          workflow_step?: string | null
          generation_progress?: Json | null
          ai_model_settings?: Json | null
        }
      }
      ebook_chapters: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          content_id: string
          title: string
          content: string | null
          chapter_index: number
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          content_id: string
          title: string
          content?: string | null
          chapter_index: number
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          content_id?: string
          title?: string
          content?: string | null
          chapter_index?: number
          metadata?: Json | null
        }
      }
      ebook_versions: {
        Row: {
          id: string
          created_at: string
          content_id: string
          version_number: number
          pdf_url: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          content_id: string
          version_number: number
          pdf_url?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          content_id?: string
          version_number?: number
          pdf_url?: string | null
          metadata?: Json | null
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
