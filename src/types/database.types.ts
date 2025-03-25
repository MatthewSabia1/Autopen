export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Define workflow step types
export type BaseWorkflowStep =
  | 'creator'       // Initial product creator form
  | 'brain-dump'    // Brain dump input
  | 'idea-selection'// Select an idea from the brain dump analysis
  | 'completed';    // Workflow completed

// Define eBook specific workflow steps
export type EbookWorkflowStep =
  | BaseWorkflowStep
  | 'ebook-structure' // Define ebook structure/outline
  | 'ebook-writing'   // Generate ebook content
  | 'ebook-preview';  // Preview and download options

// Combined type for all possible workflow steps
export type WorkflowStep = EbookWorkflowStep; // | CourseWorkflowStep | VideoWorkflowStep;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          bio: string | null
          avatar_url: string | null
          updated_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          bio?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          bio?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add other tables here as needed
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