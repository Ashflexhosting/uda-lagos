export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      association_updates: {
        Row: {
          body: string
          created_at: string
          event_date: string | null
          id: string
          image_url: string | null
          is_memorial: boolean
          kind: string
          location: string | null
          published: boolean
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_memorial?: boolean
          kind?: string
          location?: string | null
          published?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_memorial?: boolean
          kind?: string
          location?: string | null
          published?: boolean
          title?: string
        }
        Relationships: []
      }
      birthday_announcements: {
        Row: {
          birthday: string
          created_at: string
          id: string
          image_url: string | null
          message: string
          name: string
          published: boolean
        }
        Insert: {
          birthday: string
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          name: string
          published?: boolean
        }
        Update: {
          birthday?: string
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          name?: string
          published?: boolean
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          id?: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      dues_settings: {
        Row: {
          dev_levy: number
          dues: number
          updated_at: string
          welfare: number
          year: number
        }
        Insert: {
          dev_levy?: number
          dues?: number
          updated_at?: string
          welfare?: number
          year: number
        }
        Update: {
          dev_levy?: number
          dues?: number
          updated_at?: string
          welfare?: number
          year?: number
        }
        Relationships: []
      }
      members: {
        Row: {
          address: string | null
          created_at: string
          dev_levy: number
          dues: number
          email: string | null
          id: string
          name: string
          opening: number
          phone: string | null
          photo_path: string | null
          user_id: string | null
          welfare: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          dev_levy?: number
          dues?: number
          email?: string | null
          id: string
          name: string
          opening?: number
          phone?: string | null
          photo_path?: string | null
          user_id?: string | null
          welfare?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          dev_levy?: number
          dues?: number
          email?: string | null
          id?: string
          name?: string
          opening?: number
          phone?: string | null
          photo_path?: string | null
          user_id?: string | null
          welfare?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          amount: number
          created_at: string
          file_path: string
          id: string
          member_id: string
          note: string | null
          paid_on: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          file_path: string
          id?: string
          member_id: string
          note?: string | null
          paid_on?: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          file_path?: string
          id?: string
          member_id?: string
          note?: string | null
          paid_on?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          member_id: string
          note: string | null
          paid_on: string
          recorded_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          member_id: string
          note?: string | null
          paid_on?: string
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          member_id?: string
          note?: string | null
          paid_on?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      member_balances: {
        Row: {
          address: string | null
          balance: number | null
          created_at: string | null
          dev_levy: number | null
          dues: number | null
          email: string | null
          id: string | null
          name: string | null
          opening: number | null
          paid: number | null
          phone: string | null
          photo_path: string | null
          user_id: string | null
          welfare: number | null
        }
        Insert: {
          address?: string | null
          balance?: never
          created_at?: string | null
          dev_levy?: number | null
          dues?: number | null
          email?: string | null
          id?: string | null
          name?: string | null
          opening?: number | null
          paid?: never
          phone?: string | null
          photo_path?: string | null
          user_id?: string | null
          welfare?: number | null
        }
        Update: {
          address?: string | null
          balance?: never
          created_at?: string | null
          dev_levy?: number | null
          dues?: number | null
          email?: string | null
          id?: string | null
          name?: string | null
          opening?: number | null
          paid?: never
          phone?: string | null
          photo_path?: string | null
          user_id?: string | null
          welfare?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_member_id: { Args: never; Returns: string }
      review_proof: {
        Args: { _approve: boolean; _proof_id: string }
        Returns: undefined
      }
      update_my_contact: {
        Args: {
          _address: string
          _email: string
          _phone: string
          _photo_path: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const
