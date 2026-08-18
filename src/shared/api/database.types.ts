export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          media_type: string;
          organization_id: string;
          storage_path: string;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          media_type: string;
          organization_id: string;
          storage_path: string;
          uploaded_by: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          media_type?: string;
          organization_id?: string;
          storage_path?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          after_data: Json | null;
          before_data: Json | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          organization_id: string;
          request_id: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          organization_id: string;
          request_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          organization_id?: string;
          request_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      beds: {
        Row: {
          archived_at: string | null;
          code: string;
          created_at: string;
          id: string;
          organization_id: string;
          room_id: string;
          status: Database["public"]["Enums"]["inventory_status"];
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          code: string;
          created_at?: string;
          id?: string;
          organization_id: string;
          room_id: string;
          status?: Database["public"]["Enums"]["inventory_status"];
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          code?: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
          room_id?: string;
          status?: Database["public"]["Enums"]["inventory_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "beds_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "beds_room_id_organization_id_fkey";
            columns: ["room_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      complaint_events: {
        Row: {
          actor_id: string;
          complaint_id: string;
          created_at: string;
          event_type: string;
          id: string;
          new_status: Database["public"]["Enums"]["complaint_status"] | null;
          note: string | null;
          organization_id: string;
          previous_status:
            Database["public"]["Enums"]["complaint_status"] | null;
        };
        Insert: {
          actor_id: string;
          complaint_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          new_status?: Database["public"]["Enums"]["complaint_status"] | null;
          note?: string | null;
          organization_id: string;
          previous_status?:
            Database["public"]["Enums"]["complaint_status"] | null;
        };
        Update: {
          actor_id?: string;
          complaint_id?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          new_status?: Database["public"]["Enums"]["complaint_status"] | null;
          note?: string | null;
          organization_id?: string;
          previous_status?:
            Database["public"]["Enums"]["complaint_status"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "complaint_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaint_events_complaint_id_fkey";
            columns: ["complaint_id"];
            isOneToOne: false;
            referencedRelation: "complaints";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaint_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      complaints: {
        Row: {
          assigned_membership_id: string | null;
          category: string;
          closed_at: string | null;
          created_at: string;
          description: string;
          id: string;
          organization_id: string;
          priority: Database["public"]["Enums"]["complaint_priority"];
          property_id: string;
          resident_id: string;
          room_id: string | null;
          status: Database["public"]["Enums"]["complaint_status"];
          tenancy_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_membership_id?: string | null;
          category: string;
          closed_at?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          organization_id: string;
          priority?: Database["public"]["Enums"]["complaint_priority"];
          property_id: string;
          resident_id: string;
          room_id?: string | null;
          status?: Database["public"]["Enums"]["complaint_status"];
          tenancy_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_membership_id?: string | null;
          category?: string;
          closed_at?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          organization_id?: string;
          priority?: Database["public"]["Enums"]["complaint_priority"];
          property_id?: string;
          resident_id?: string;
          room_id?: string | null;
          status?: Database["public"]["Enums"]["complaint_status"];
          tenancy_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "complaints_assigned_membership_id_fkey";
            columns: ["assigned_membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_property_organization_fk";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "complaints_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_resident_organization_fk";
            columns: ["resident_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "complaints_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_room_organization_fk";
            columns: ["room_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "complaints_tenancy_id_fkey";
            columns: ["tenancy_id"];
            isOneToOne: false;
            referencedRelation: "tenancies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_tenancy_organization_fk";
            columns: ["tenancy_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "tenancies";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string;
          document_type: string;
          expires_on: string | null;
          id: string;
          organization_id: string;
          profile_id: string | null;
          resident_id: string | null;
          storage_path: string;
          updated_at: string;
          uploaded_by: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
        };
        Insert: {
          created_at?: string;
          document_type: string;
          expires_on?: string | null;
          id?: string;
          organization_id: string;
          profile_id?: string | null;
          resident_id?: string | null;
          storage_path: string;
          updated_at?: string;
          uploaded_by: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Update: {
          created_at?: string;
          document_type?: string;
          expires_on?: string | null;
          id?: string;
          organization_id?: string;
          profile_id?: string | null;
          resident_id?: string | null;
          storage_path?: string;
          updated_at?: string;
          uploaded_by?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_resident_organization_fk";
            columns: ["resident_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invitation_properties: {
        Row: {
          created_at: string;
          invitation_id: string;
          organization_id: string;
          property_id: string;
        };
        Insert: {
          created_at?: string;
          invitation_id: string;
          organization_id: string;
          property_id: string;
        };
        Update: {
          created_at?: string;
          invitation_id?: string;
          organization_id?: string;
          property_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitation_properties_invitation_id_organization_id_fkey";
            columns: ["invitation_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "invitations";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "invitation_properties_property_id_organization_id_fkey";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email_normalized: string | null;
          expires_at: string;
          id: string;
          invited_by: string;
          organization_id: string;
          phone_e164: string | null;
          resident_id: string | null;
          role: Database["public"]["Enums"]["membership_role"];
          token_hash: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email_normalized?: string | null;
          expires_at: string;
          id?: string;
          invited_by: string;
          organization_id: string;
          phone_e164?: string | null;
          resident_id?: string | null;
          role: Database["public"]["Enums"]["membership_role"];
          token_hash: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email_normalized?: string | null;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          organization_id?: string;
          phone_e164?: string | null;
          resident_id?: string | null;
          role?: Database["public"]["Enums"]["membership_role"];
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_resident_fk";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_resident_organization_fk";
            columns: ["resident_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          invoice_id: string;
          item_type: Database["public"]["Enums"]["invoice_item_type"];
          metadata: Json;
          organization_id: string;
          quantity: number;
          total_amount_paise: number;
          unit_amount_paise: number;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          invoice_id: string;
          item_type: Database["public"]["Enums"]["invoice_item_type"];
          metadata?: Json;
          organization_id: string;
          quantity?: number;
          total_amount_paise: number;
          unit_amount_paise: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          invoice_id?: string;
          item_type?: Database["public"]["Enums"]["invoice_item_type"];
          metadata?: Json;
          organization_id?: string;
          quantity?: number;
          total_amount_paise?: number;
          unit_amount_paise?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          adjustment_paise: number;
          balance_paise: number | null;
          created_at: string;
          currency: string;
          due_date: string;
          id: string;
          invoice_number: string;
          organization_id: string;
          paid_paise: number;
          period_end: string;
          period_start: string;
          property_id: string;
          status: Database["public"]["Enums"]["invoice_status"];
          subtotal_paise: number;
          tenancy_id: string;
          total_paise: number;
          updated_at: string;
        };
        Insert: {
          adjustment_paise?: number;
          balance_paise?: number | null;
          created_at?: string;
          currency?: string;
          due_date: string;
          id?: string;
          invoice_number: string;
          organization_id: string;
          paid_paise?: number;
          period_end: string;
          period_start: string;
          property_id: string;
          status?: Database["public"]["Enums"]["invoice_status"];
          subtotal_paise?: number;
          tenancy_id: string;
          total_paise?: number;
          updated_at?: string;
        };
        Update: {
          adjustment_paise?: number;
          balance_paise?: number | null;
          created_at?: string;
          currency?: string;
          due_date?: string;
          id?: string;
          invoice_number?: string;
          organization_id?: string;
          paid_paise?: number;
          period_end?: string;
          period_start?: string;
          property_id?: string;
          status?: Database["public"]["Enums"]["invoice_status"];
          subtotal_paise?: number;
          tenancy_id?: string;
          total_paise?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_property_organization_fk";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "invoices_tenancy_id_fkey";
            columns: ["tenancy_id"];
            isOneToOne: false;
            referencedRelation: "tenancies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_tenancy_organization_fk";
            columns: ["tenancy_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "tenancies";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      notice_reads: {
        Row: {
          notice_id: string;
          profile_id: string;
          read_at: string;
        };
        Insert: {
          notice_id: string;
          profile_id: string;
          read_at?: string;
        };
        Update: {
          notice_id?: string;
          profile_id?: string;
          read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notice_reads_notice_id_fkey";
            columns: ["notice_id"];
            isOneToOne: false;
            referencedRelation: "notices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notice_reads_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notice_targets: {
        Row: {
          created_at: string;
          id: string;
          notice_id: string;
          organization_id: string;
          target_id: string;
          target_type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notice_id: string;
          organization_id: string;
          target_id: string;
          target_type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notice_id?: string;
          organization_id?: string;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notice_targets_notice_id_fkey";
            columns: ["notice_id"];
            isOneToOne: false;
            referencedRelation: "notices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notice_targets_notice_organization_fk";
            columns: ["notice_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "notices";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "notice_targets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notices: {
        Row: {
          author_id: string;
          body: string;
          category: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          is_pinned: boolean;
          organization_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          category?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_pinned?: boolean;
          organization_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          category?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_pinned?: boolean;
          organization_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notices_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          deep_link_path: string | null;
          id: string;
          notification_type: string;
          organization_id: string;
          read_at: string | null;
          recipient_profile_id: string;
          title: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          deep_link_path?: string | null;
          id?: string;
          notification_type: string;
          organization_id: string;
          read_at?: string | null;
          recipient_profile_id: string;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          deep_link_path?: string | null;
          id?: string;
          notification_type?: string;
          organization_id?: string;
          read_at?: string | null;
          recipient_profile_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_profile_id_fkey";
            columns: ["recipient_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      occupancy_assignments: {
        Row: {
          bed_id: string | null;
          created_at: string;
          created_by: string;
          ends_at: string | null;
          id: string;
          organization_id: string;
          reason: string | null;
          room_id: string;
          starts_at: string;
          tenancy_id: string;
        };
        Insert: {
          bed_id?: string | null;
          created_at?: string;
          created_by: string;
          ends_at?: string | null;
          id?: string;
          organization_id: string;
          reason?: string | null;
          room_id: string;
          starts_at: string;
          tenancy_id: string;
        };
        Update: {
          bed_id?: string | null;
          created_at?: string;
          created_by?: string;
          ends_at?: string | null;
          id?: string;
          organization_id?: string;
          reason?: string | null;
          room_id?: string;
          starts_at?: string;
          tenancy_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "occupancy_assignments_bed_id_fkey";
            columns: ["bed_id"];
            isOneToOne: false;
            referencedRelation: "beds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "occupancy_assignments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "occupancy_assignments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "occupancy_assignments_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "occupancy_assignments_tenancy_id_fkey";
            columns: ["tenancy_id"];
            isOneToOne: false;
            referencedRelation: "tenancies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "occupancy_bed_organization_fk";
            columns: ["bed_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "beds";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "occupancy_room_organization_fk";
            columns: ["room_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "occupancy_tenancy_organization_fk";
            columns: ["tenancy_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "tenancies";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      organization_memberships: {
        Row: {
          created_at: string;
          id: string;
          invited_at: string | null;
          joined_at: string | null;
          organization_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["membership_role"];
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          joined_at?: string | null;
          organization_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["membership_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          joined_at?: string | null;
          organization_id?: string;
          profile_id?: string;
          role?: Database["public"]["Enums"]["membership_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_memberships_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string;
          default_currency: string;
          default_timezone: string;
          id: string;
          idempotency_key: string | null;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["organization_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          default_currency?: string;
          default_timezone?: string;
          id?: string;
          idempotency_key?: string | null;
          name: string;
          slug: string;
          status?: Database["public"]["Enums"]["organization_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          default_currency?: string;
          default_timezone?: string;
          id?: string;
          idempotency_key?: string | null;
          name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["organization_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_allocations: {
        Row: {
          amount_paise: number;
          created_at: string;
          id: string;
          invoice_id: string;
          organization_id: string;
          payment_id: string;
        };
        Insert: {
          amount_paise: number;
          created_at?: string;
          id?: string;
          invoice_id: string;
          organization_id: string;
          payment_id: string;
        };
        Update: {
          amount_paise?: number;
          created_at?: string;
          id?: string;
          invoice_id?: string;
          organization_id?: string;
          payment_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "allocations_invoice_organization_fk";
            columns: ["invoice_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "allocations_payment_organization_fk";
            columns: ["payment_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_allocations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_paise: number;
          created_at: string;
          currency: string;
          decided_at: string | null;
          decided_by: string | null;
          decision_reason: string | null;
          id: string;
          idempotency_key: string | null;
          method: Database["public"]["Enums"]["payment_method"];
          organization_id: string;
          paid_on: string;
          payer_resident_id: string;
          proof_storage_path: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          submitted_by: string;
          submitted_invoice_id: string | null;
          transaction_reference: string | null;
          updated_at: string;
        };
        Insert: {
          amount_paise: number;
          created_at?: string;
          currency?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_reason?: string | null;
          id?: string;
          idempotency_key?: string | null;
          method: Database["public"]["Enums"]["payment_method"];
          organization_id: string;
          paid_on: string;
          payer_resident_id: string;
          proof_storage_path?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          submitted_by: string;
          submitted_invoice_id?: string | null;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_paise?: number;
          created_at?: string;
          currency?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_reason?: string | null;
          id?: string;
          idempotency_key?: string | null;
          method?: Database["public"]["Enums"]["payment_method"];
          organization_id?: string;
          paid_on?: string;
          payer_resident_id?: string;
          proof_storage_path?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          submitted_by?: string;
          submitted_invoice_id?: string | null;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_invoice_organization_fk";
            columns: ["submitted_invoice_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "payments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_payer_resident_id_fkey";
            columns: ["payer_resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_resident_organization_fk";
            columns: ["payer_resident_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "payments_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_submitted_invoice_id_fkey";
            columns: ["submitted_invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"];
          avatar_path: string | null;
          created_at: string;
          full_name: string;
          id: string;
          phone_e164: string | null;
          updated_at: string;
        };
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"];
          avatar_path?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          phone_e164?: string | null;
          updated_at?: string;
        };
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"];
          avatar_path?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          phone_e164?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          address_line_1: string;
          address_line_2: string | null;
          archived_at: string | null;
          city: string;
          country_code: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          postal_code: string;
          property_type: Database["public"]["Enums"]["property_type"];
          rules: string | null;
          state: string;
          status: Database["public"]["Enums"]["property_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          address_line_1: string;
          address_line_2?: string | null;
          archived_at?: string | null;
          city: string;
          country_code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          postal_code: string;
          property_type: Database["public"]["Enums"]["property_type"];
          rules?: string | null;
          state: string;
          status?: Database["public"]["Enums"]["property_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          address_line_1?: string;
          address_line_2?: string | null;
          archived_at?: string | null;
          city?: string;
          country_code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          postal_code?: string;
          property_type?: Database["public"]["Enums"]["property_type"];
          rules?: string | null;
          state?: string;
          status?: Database["public"]["Enums"]["property_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      property_media: {
        Row: {
          created_at: string;
          id: string;
          media_type: string;
          organization_id: string;
          property_id: string;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          media_type: string;
          organization_id: string;
          property_id: string;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          media_type?: string;
          organization_id?: string;
          property_id?: string;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_media_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_media_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      property_memberships: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          organization_membership_id: string;
          property_id: string;
          role_override: Database["public"]["Enums"]["membership_role"] | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          organization_membership_id: string;
          property_id: string;
          role_override?: Database["public"]["Enums"]["membership_role"] | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          organization_membership_id?: string;
          property_id?: string;
          role_override?: Database["public"]["Enums"]["membership_role"] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_memberships_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_memberships_organization_membership_id_organizati_fkey";
            columns: ["organization_membership_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "property_memberships_property_id_organization_id_fkey";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      push_devices: {
        Row: {
          app_version: string;
          created_at: string;
          enabled: boolean;
          expo_push_token: string;
          id: string;
          last_seen_at: string;
          platform: string;
          profile_id: string;
        };
        Insert: {
          app_version: string;
          created_at?: string;
          enabled?: boolean;
          expo_push_token: string;
          id?: string;
          last_seen_at?: string;
          platform: string;
          profile_id: string;
        };
        Update: {
          app_version?: string;
          created_at?: string;
          enabled?: boolean;
          expo_push_token?: string;
          id?: string;
          last_seen_at?: string;
          platform?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_devices_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      receipts: {
        Row: {
          created_at: string;
          generated_at: string;
          id: string;
          organization_id: string;
          payment_id: string;
          pdf_storage_path: string | null;
          receipt_number: string;
        };
        Insert: {
          created_at?: string;
          generated_at?: string;
          id?: string;
          organization_id: string;
          payment_id: string;
          pdf_storage_path?: string | null;
          receipt_number: string;
        };
        Update: {
          created_at?: string;
          generated_at?: string;
          id?: string;
          organization_id?: string;
          payment_id?: string;
          pdf_storage_path?: string | null;
          receipt_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "receipts_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: true;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      residents: {
        Row: {
          created_at: string;
          email_normalized: string | null;
          emergency_name: string | null;
          emergency_phone_e164: string | null;
          full_name: string;
          id: string;
          organization_id: string;
          phone_e164: string | null;
          profile_id: string | null;
          status: Database["public"]["Enums"]["resident_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email_normalized?: string | null;
          emergency_name?: string | null;
          emergency_phone_e164?: string | null;
          full_name: string;
          id?: string;
          organization_id: string;
          phone_e164?: string | null;
          profile_id?: string | null;
          status?: Database["public"]["Enums"]["resident_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email_normalized?: string | null;
          emergency_name?: string | null;
          emergency_phone_e164?: string | null;
          full_name?: string;
          id?: string;
          organization_id?: string;
          phone_e164?: string | null;
          profile_id?: string | null;
          status?: Database["public"]["Enums"]["resident_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "residents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "residents_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          archived_at: string | null;
          capacity: number;
          code: string;
          created_at: string;
          currency: string;
          default_deposit_paise: number;
          default_rent_paise: number;
          floor_label: string | null;
          id: string;
          organization_id: string;
          property_id: string;
          room_type: Database["public"]["Enums"]["room_type"];
          status: Database["public"]["Enums"]["inventory_status"];
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          capacity?: number;
          code: string;
          created_at?: string;
          currency?: string;
          default_deposit_paise?: number;
          default_rent_paise?: number;
          floor_label?: string | null;
          id?: string;
          organization_id: string;
          property_id: string;
          room_type: Database["public"]["Enums"]["room_type"];
          status?: Database["public"]["Enums"]["inventory_status"];
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          capacity?: number;
          code?: string;
          created_at?: string;
          currency?: string;
          default_deposit_paise?: number;
          default_rent_paise?: number;
          floor_label?: string | null;
          id?: string;
          organization_id?: string;
          property_id?: string;
          room_type?: Database["public"]["Enums"]["room_type"];
          status?: Database["public"]["Enums"]["inventory_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_property_id_organization_id_fkey";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      tenancies: {
        Row: {
          created_at: string;
          currency: string;
          deposit_paise: number;
          due_day: number;
          end_date: string | null;
          id: string;
          idempotency_key: string | null;
          organization_id: string;
          property_id: string;
          rent_paise: number;
          resident_id: string;
          start_date: string;
          status: Database["public"]["Enums"]["tenancy_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          deposit_paise?: number;
          due_day: number;
          end_date?: string | null;
          id?: string;
          idempotency_key?: string | null;
          organization_id: string;
          property_id: string;
          rent_paise: number;
          resident_id: string;
          start_date: string;
          status?: Database["public"]["Enums"]["tenancy_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          deposit_paise?: number;
          due_day?: number;
          end_date?: string | null;
          id?: string;
          idempotency_key?: string | null;
          organization_id?: string;
          property_id?: string;
          rent_paise?: number;
          resident_id?: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["tenancy_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenancies_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenancies_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenancies_property_organization_fk";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "tenancies_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenancies_resident_organization_fk";
            columns: ["resident_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: { Args: { raw_token: string }; Returns: string };
      assert_room_available: {
        Args: { requested_bed_id: string; requested_room_id: string };
        Returns: string;
      };
      can_access_payment: {
        Args: { requested_payment_id: string };
        Returns: boolean;
      };
      can_access_property: {
        Args: { requested_property_id: string };
        Returns: boolean;
      };
      can_access_resident: {
        Args: { requested_resident_id: string };
        Returns: boolean;
      };
      can_read_notice: {
        Args: { requested_notice_id: string };
        Returns: boolean;
      };
      can_read_profile: {
        Args: { requested_profile_id: string };
        Returns: boolean;
      };
      create_complaint_with_attachment: {
        Args: {
          requested_category: string;
          requested_description: string;
          requested_media_type?: string;
          requested_priority: Database["public"]["Enums"]["complaint_priority"];
          requested_storage_path?: string;
          requested_tenancy_id: string;
          requested_title: string;
        };
        Returns: string;
      };
      create_invitation: {
        Args: {
          requested_email: string;
          requested_organization_id: string;
          requested_property_ids?: string[];
          requested_resident_id: string;
          requested_role: Database["public"]["Enums"]["membership_role"];
        };
        Returns: Json;
      };
      create_organization_with_owner: {
        Args: {
          organization_name: string;
          organization_slug: string;
          request_idempotency_key: string;
        };
        Returns: string;
      };
      create_room_with_beds: {
        Args: {
          requested_capacity: number;
          requested_code: string;
          requested_deposit_paise: number;
          requested_floor_label: string;
          requested_organization_id: string;
          requested_property_id: string;
          requested_rent_paise: number;
          requested_room_type: Database["public"]["Enums"]["room_type"];
        };
        Returns: string;
      };
      create_tenancy_with_assignment: {
        Args: {
          request_idempotency_key: string;
          requested_bed_id: string;
          requested_deposit_paise: number;
          requested_due_day: number;
          requested_organization_id: string;
          requested_property_id: string;
          requested_rent_paise: number;
          requested_resident_id: string;
          requested_room_id: string;
          requested_start_date: string;
        };
        Returns: string;
      };
      decide_payment: {
        Args: {
          allocations?: Json;
          approve: boolean;
          reason: string;
          requested_payment_id: string;
        };
        Returns: string;
      };
      generate_monthly_invoices: {
        Args: {
          requested_organization_id: string;
          requested_period_start: string;
        };
        Returns: Json;
      };
      is_linked_resident: {
        Args: { requested_resident_id: string };
        Returns: boolean;
      };
      is_org_member: {
        Args: {
          allowed_roles?: Database["public"]["Enums"]["membership_role"][];
          requested_organization_id: string;
        };
        Returns: boolean;
      };
      is_org_owner: {
        Args: { requested_organization_id: string };
        Returns: boolean;
      };
      owner_dashboard: {
        Args: { requested_organization_id: string };
        Returns: Json;
      };
      publish_notice: {
        Args: {
          requested_body: string;
          requested_is_pinned: boolean;
          requested_organization_id: string;
          requested_target_ids: string[];
          requested_target_type: string;
          requested_title: string;
        };
        Returns: string;
      };
      register_resident_document: {
        Args: {
          requested_document_type: string;
          requested_organization_id: string;
          requested_resident_id: string;
          requested_storage_path: string;
        };
        Returns: string;
      };
      shares_organization_with: {
        Args: { requested_profile_id: string };
        Returns: boolean;
      };
      submit_payment: {
        Args: {
          request_idempotency_key: string;
          requested_amount_paise: number;
          requested_invoice_id: string;
          requested_method: Database["public"]["Enums"]["payment_method"];
          requested_paid_on: string;
          requested_proof_path: string;
          requested_reference: string;
        };
        Returns: string;
      };
      transfer_occupancy: {
        Args: {
          effective_at: string;
          request_idempotency_key: string;
          requested_bed_id: string;
          requested_room_id: string;
          requested_tenancy_id: string;
          transfer_reason: string;
        };
        Returns: string;
      };
      transition_complaint: {
        Args: {
          requested_complaint_id: string;
          requested_status: Database["public"]["Enums"]["complaint_status"];
          transition_note: string;
        };
        Returns: string;
      };
    };
    Enums: {
      account_status: "active" | "suspended" | "closed";
      complaint_priority: "low" | "normal" | "high" | "urgent";
      complaint_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "closed"
        | "reopened"
        | "rejected";
      inventory_status: "active" | "inactive" | "archived";
      invoice_item_type:
        "rent" | "utilities" | "mess" | "discount" | "late_fee" | "adjustment";
      invoice_status:
        | "draft"
        | "issued"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "waived"
        | "void";
      membership_role: "owner" | "manager" | "tenant" | "maintenance_staff";
      membership_status: "invited" | "active" | "suspended" | "revoked";
      organization_status: "active" | "suspended" | "archived";
      payment_method: "cash" | "upi" | "bank_transfer" | "other";
      payment_status:
        | "submitted"
        | "approved"
        | "rejected"
        | "partially_refunded"
        | "refunded";
      property_status: "active" | "archived";
      property_type:
        "apartment" | "house" | "pg" | "hostel" | "commercial" | "other";
      resident_status: "active" | "inactive" | "archived";
      room_type: "private" | "shared" | "studio" | "other";
      tenancy_status:
        "draft" | "active" | "notice_period" | "ended" | "cancelled";
      verification_status: "pending" | "verified" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["active", "suspended", "closed"],
      complaint_priority: ["low", "normal", "high", "urgent"],
      complaint_status: [
        "open",
        "assigned",
        "in_progress",
        "resolved",
        "closed",
        "reopened",
        "rejected",
      ],
      inventory_status: ["active", "inactive", "archived"],
      invoice_item_type: [
        "rent",
        "utilities",
        "mess",
        "discount",
        "late_fee",
        "adjustment",
      ],
      invoice_status: [
        "draft",
        "issued",
        "partially_paid",
        "paid",
        "overdue",
        "waived",
        "void",
      ],
      membership_role: ["owner", "manager", "tenant", "maintenance_staff"],
      membership_status: ["invited", "active", "suspended", "revoked"],
      organization_status: ["active", "suspended", "archived"],
      payment_method: ["cash", "upi", "bank_transfer", "other"],
      payment_status: [
        "submitted",
        "approved",
        "rejected",
        "partially_refunded",
        "refunded",
      ],
      property_status: ["active", "archived"],
      property_type: [
        "apartment",
        "house",
        "pg",
        "hostel",
        "commercial",
        "other",
      ],
      resident_status: ["active", "inactive", "archived"],
      room_type: ["private", "shared", "studio", "other"],
      tenancy_status: [
        "draft",
        "active",
        "notice_period",
        "ended",
        "cancelled",
      ],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const;

export type MembershipRole = Database["public"]["Enums"]["membership_role"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type ComplaintStatus = Database["public"]["Enums"]["complaint_status"];
export type InvoiceRow = Tables<"invoices">;
export type ReceiptRow = Tables<"receipts">;
