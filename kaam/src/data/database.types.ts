// Generated from the Kaam Supabase project (public schema). Regenerate after database changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      households: {
        Row: { created_at: string; id: string; invite_code: string; invite_expires_at: string; kind: string; name: string };
        Insert: { created_at?: string; id?: string; invite_code: string; invite_expires_at?: string; kind?: string; name: string };
        Update: { created_at?: string; id?: string; invite_code?: string; invite_expires_at?: string; kind?: string; name?: string };
        Relationships: [];
      };
      members: {
        Row: { color: string; household_id: string; id: string; joined_at: string; name: string; role: string; user_id: string | null };
        Insert: { color: string; household_id: string; id?: string; joined_at?: string; name: string; role?: string; user_id?: string | null };
        Update: { color?: string; household_id?: string; id?: string; joined_at?: string; name?: string; role?: string; user_id?: string | null };
        Relationships: [];
      };
      profiles: {
        Row: { created_at: string; id: string; language: string; name: string };
        Insert: { created_at?: string; id: string; language?: string; name?: string };
        Update: { created_at?: string; id?: string; language?: string; name?: string };
        Relationships: [];
      };
      tasks: {
        Row: {
          assignee_id: string | null;
          created_at: string;
          created_by: string | null;
          done_at: string | null;
          done_by: string | null;
          due_date: string;
          due_time: string | null;
          household_id: string;
          id: string;
          is_private: boolean;
          note: string | null;
          reminder: string;
          repeat: string;
          series_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          assignee_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          done_at?: string | null;
          done_by?: string | null;
          due_date: string;
          due_time?: string | null;
          household_id: string;
          id?: string;
          is_private?: boolean;
          note?: string | null;
          reminder?: string;
          repeat?: string;
          series_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          assignee_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          done_at?: string | null;
          done_by?: string | null;
          due_date?: string;
          due_time?: string | null;
          household_id?: string;
          id?: string;
          is_private?: boolean;
          note?: string | null;
          reminder?: string;
          repeat?: string;
          series_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      weekly_scores: {
        Row: { household_id: string | null; member_id: string | null; score: number | null };
        Relationships: [];
      };
    };
    Functions: {
      add_member_without_app: { Args: { p_household: string; p_name: string }; Returns: Database['public']['Tables']['members']['Row'] };
      complete_task: { Args: { p_task: string }; Returns: Database['public']['Tables']['tasks']['Row'] };
      create_household: { Args: { p_kind?: string; p_name: string }; Returns: Database['public']['Tables']['households']['Row'] };
      is_admin: { Args: { h: string }; Returns: boolean };
      is_member: { Args: { h: string }; Returns: boolean };
      join_household: { Args: { p_code: string }; Returns: Database['public']['Tables']['households']['Row'] };
      leave_household: { Args: { p_household: string }; Returns: undefined };
      my_member_id: { Args: { h: string }; Returns: string };
      remove_member: { Args: { p_member: string }; Returns: undefined };
      reset_invite_code: { Args: { p_household: string }; Returns: string };
      set_member_role: { Args: { p_member: string; p_role: string }; Returns: Database['public']['Tables']['members']['Row'] };
      today_ist: { Args: never; Returns: string };
      uncomplete_task: { Args: { p_task: string }; Returns: Database['public']['Tables']['tasks']['Row'] };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
