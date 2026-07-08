export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_drafts: {
        Row: {
          consult_id: string
          created_at: string
          id: string
          raw_response: Json | null
          recommendation: Json | null
        }
        Insert: {
          consult_id: string
          created_at?: string
          id?: string
          raw_response?: Json | null
          recommendation?: Json | null
        }
        Update: {
          consult_id?: string
          created_at?: string
          id?: string
          raw_response?: Json | null
          recommendation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_drafts_consult_id_fkey"
            columns: ["consult_id"]
            isOneToOne: false
            referencedRelation: "consults"
            referencedColumns: ["id"]
          },
        ]
      }
      consult_events: {
        Row: {
          actor: string
          actor_id: string | null
          consult_id: string
          created_at: string
          event_type: string
          hospital_id: string
          id: string
          payload: Json
        }
        Insert: {
          actor: string
          actor_id?: string | null
          consult_id: string
          created_at?: string
          event_type: string
          hospital_id: string
          id?: string
          payload?: Json
        }
        Update: {
          actor?: string
          actor_id?: string | null
          consult_id?: string
          created_at?: string
          event_type?: string
          hospital_id?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "consult_events_consult_id_fkey"
            columns: ["consult_id"]
            isOneToOne: false
            referencedRelation: "consults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consult_events_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospital_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consult_events_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      consult_media: {
        Row: {
          ai_findings: Json | null
          consult_id: string
          created_at: string
          id: string
          kind: string
          storage_path: string
        }
        Insert: {
          ai_findings?: Json | null
          consult_id: string
          created_at?: string
          id?: string
          kind: string
          storage_path: string
        }
        Update: {
          ai_findings?: Json | null
          consult_id?: string
          created_at?: string
          id?: string
          kind?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "consult_media_consult_id_fkey"
            columns: ["consult_id"]
            isOneToOne: false
            referencedRelation: "consults"
            referencedColumns: ["id"]
          },
        ]
      }
      consult_messages: {
        Row: {
          ai_note: string | null
          consult_id: string
          content: string | null
          created_at: string
          id: string
          sender: string
        }
        Insert: {
          ai_note?: string | null
          consult_id: string
          content?: string | null
          created_at?: string
          id?: string
          sender: string
        }
        Update: {
          ai_note?: string | null
          consult_id?: string
          content?: string | null
          created_at?: string
          id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "consult_messages_consult_id_fkey"
            columns: ["consult_id"]
            isOneToOne: false
            referencedRelation: "consults"
            referencedColumns: ["id"]
          },
        ]
      }
      consults: {
        Row: {
          ai_confidence: number | null
          ai_flags: Json
          chief_complaint: string | null
          created_at: string
          hospital_id: string
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["consult_status"]
          submitted_at: string | null
          urgency: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_flags?: Json
          chief_complaint?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["consult_status"]
          submitted_at?: string | null
          urgency?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_flags?: Json
          chief_complaint?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["consult_status"]
          submitted_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consults_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospital_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consults_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consults_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          ai_config: Json
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          theme: Json
        }
        Insert: {
          ai_config?: Json
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          theme?: Json
        }
        Update: {
          ai_config?: Json
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          theme?: Json
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          hospital_id: string
          id: string
          profile_id: string
          role: string
        }
        Insert: {
          created_at?: string
          hospital_id: string
          id?: string
          profile_id: string
          role?: string
        }
        Update: {
          created_at?: string
          hospital_id?: string
          id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospital_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mira_feedback: {
        Row: {
          category: string
          consult_id: string | null
          created_at: string
          doctor_id: string
          feedback: string | null
          hospital_id: string
          id: string
        }
        Insert: {
          category: string
          consult_id?: string | null
          created_at?: string
          doctor_id: string
          feedback?: string | null
          hospital_id: string
          id?: string
        }
        Update: {
          category?: string
          consult_id?: string | null
          created_at?: string
          doctor_id?: string
          feedback?: string | null
          hospital_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mira_feedback_consult_id_fkey"
            columns: ["consult_id"]
            isOneToOne: false
            referencedRelation: "consults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mira_feedback_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mira_feedback_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospital_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mira_feedback_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_details: {
        Row: {
          allergies: Json
          blood_group: string | null
          conditions: Json
          dob: string | null
          medications: Json
          profile_id: string
          sex: string | null
          updated_at: string
        }
        Insert: {
          allergies?: Json
          blood_group?: string | null
          conditions?: Json
          dob?: string | null
          medications?: Json
          profile_id: string
          sex?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: Json
          blood_group?: string | null
          conditions?: Json
          dob?: string | null
          medications?: Json
          profile_id?: string
          sex?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          advice: string | null
          approved_at: string
          consult_id: string
          doctor_id: string
          edited_from_draft: boolean
          hospital_id: string
          id: string
          items: Json
          patient_id: string
          supersedes_id: string | null
        }
        Insert: {
          advice?: string | null
          approved_at?: string
          consult_id: string
          doctor_id: string
          edited_from_draft?: boolean
          hospital_id: string
          id?: string
          items?: Json
          patient_id: string
          supersedes_id?: string | null
        }
        Update: {
          advice?: string | null
          approved_at?: string
          consult_id?: string
          doctor_id?: string
          edited_from_draft?: boolean
          hospital_id?: string
          id?: string
          items?: Json
          patient_id?: string
          supersedes_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_consult_id_fkey"
            columns: ["consult_id"]
            isOneToOne: false
            referencedRelation: "consults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospital_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      review_messages: {
        Row: {
          citations: Json
          consult_id: string
          content: string | null
          created_at: string
          doctor_id: string
          id: string
          sender: string
        }
        Insert: {
          citations?: Json
          consult_id: string
          content?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          sender: string
        }
        Update: {
          citations?: Json
          consult_id?: string
          content?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_messages_consult_id_fkey"
            columns: ["consult_id"]
            isOneToOne: false
            referencedRelation: "consults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_messages_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          action: string
          consult_id: string
          created_at: string
          diff: Json | null
          doctor_id: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          consult_id: string
          created_at?: string
          diff?: Json | null
          doctor_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          consult_id?: string
          created_at?: string
          diff?: Json | null
          doctor_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_consult_id_fkey"
            columns: ["consult_id"]
            isOneToOne: false
            referencedRelation: "consults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      consult_trace: {
        Row: {
          actor: string | null
          actor_id: string | null
          at: string | null
          consult_id: string | null
          hospital_id: string | null
          kind: string | null
          payload: Json | null
          summary: string | null
        }
        Relationships: []
      }
      hospital_public: {
        Row: {
          id: string | null
          logo_url: string | null
          name: string | null
          slug: string | null
          theme: Json | null
        }
        Insert: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          theme?: Json | null
        }
        Update: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          theme?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      consult_transition_allowed: {
        Args: {
          from_status: Database["public"]["Enums"]["consult_status"]
          to_status: Database["public"]["Enums"]["consult_status"]
        }
        Returns: boolean
      }
      current_role_of: { Args: never; Returns: string }
      export_consult_trace: { Args: { p_consult_id: string }; Returns: Json }
      is_member: { Args: { h: string }; Returns: boolean }
    }
    Enums: {
      consult_status:
        | "active"
        | "pending_review"
        | "approved"
        | "rejected"
        | "escalated"
        | "communicated"
        | "closed"
        | "superseded"
        | "abandoned"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      consult_status: [
        "active",
        "pending_review",
        "approved",
        "rejected",
        "escalated",
        "communicated",
        "closed",
        "superseded",
        "abandoned",
        "expired",
      ],
    },
  },
} as const

