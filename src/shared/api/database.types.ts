// Schema contract for supabase/migrations/20260724183930_foundation.sql.
// Regenerate from a running local stack with: npm run supabase:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountStatus = "active" | "suspended" | "closed";
export type OrganizationStatus = "active" | "suspended" | "archived";
export type MembershipRole =
  "owner" | "manager" | "tenant" | "maintenance_staff";
export type MembershipStatus = "invited" | "active" | "suspended" | "revoked";
export type PropertyType =
  "apartment" | "house" | "pg" | "hostel" | "commercial" | "other";
export type PropertyStatus = "active" | "archived";
export type RoomType = "private" | "shared" | "studio" | "other";
export type InventoryStatus = "active" | "inactive" | "archived";
export type ResidentStatus = "active" | "inactive" | "archived";
export type TenancyStatus =
  "draft" | "active" | "notice_period" | "ended" | "cancelled";
export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "waived"
  | "void";
export type PaymentStatus =
  "submitted" | "approved" | "rejected" | "partially_refunded" | "refunded";
export type PaymentMethod = "cash" | "upi" | "bank_transfer" | "other";
export type ComplaintStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened"
  | "rejected";
export type ComplaintPriority = "low" | "normal" | "high" | "urgent";

type Timestamped = { created_at: string; updated_at: string };
type TimestampInsert = { created_at?: string; updated_at?: string };

export type ProfileRow = Timestamped & {
  id: string;
  full_name: string;
  phone_e164: string | null;
  avatar_path: string | null;
  account_status: AccountStatus;
};
export type ProfileInsert = TimestampInsert & {
  id: string;
  full_name: string;
  phone_e164?: string | null;
  avatar_path?: string | null;
  account_status?: AccountStatus;
};
export type ProfileUpdate = Partial<Omit<ProfileRow, "id" | "created_at">>;

export type OrganizationRow = Timestamped & {
  id: string;
  name: string;
  slug: string;
  default_currency: string;
  default_timezone: string;
  created_by: string;
  status: OrganizationStatus;
  idempotency_key: string | null;
};
export type OrganizationInsert = TimestampInsert & {
  id?: string;
  name: string;
  slug: string;
  default_currency?: string;
  default_timezone?: string;
  created_by: string;
  status?: OrganizationStatus;
  idempotency_key?: string | null;
};
export type OrganizationUpdate = Partial<
  Omit<OrganizationRow, "id" | "created_at" | "created_by">
>;

export type OrganizationMembershipRow = Timestamped & {
  id: string;
  organization_id: string;
  profile_id: string;
  role: MembershipRole;
  status: MembershipStatus;
  invited_at: string | null;
  joined_at: string | null;
};
export type OrganizationMembershipInsert = TimestampInsert & {
  id?: string;
  organization_id: string;
  profile_id: string;
  role: MembershipRole;
  status?: MembershipStatus;
  invited_at?: string | null;
  joined_at?: string | null;
};
export type OrganizationMembershipUpdate = Partial<
  Omit<
    OrganizationMembershipRow,
    "id" | "created_at" | "organization_id" | "profile_id"
  >
>;

export type PropertyRow = Timestamped & {
  id: string;
  organization_id: string;
  name: string;
  property_type: PropertyType;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
  timezone: string;
  rules: string | null;
  description: string | null;
  status: PropertyStatus;
  archived_at: string | null;
};
export type PropertyInsert = TimestampInsert & {
  id?: string;
  organization_id: string;
  name: string;
  property_type: PropertyType;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country_code?: string;
  timezone?: string;
  rules?: string | null;
  description?: string | null;
  status?: PropertyStatus;
  archived_at?: string | null;
};
export type PropertyUpdate = Partial<
  Omit<PropertyRow, "id" | "created_at" | "organization_id">
>;

export type PropertyMembershipRow = Timestamped & {
  id: string;
  organization_id: string;
  organization_membership_id: string;
  property_id: string;
  role_override: MembershipRole | null;
};
export type PropertyMembershipInsert = TimestampInsert & {
  id?: string;
  organization_id: string;
  organization_membership_id: string;
  property_id: string;
  role_override?: MembershipRole | null;
};
export type PropertyMembershipUpdate = Partial<
  Omit<
    PropertyMembershipRow,
    | "id"
    | "created_at"
    | "organization_id"
    | "organization_membership_id"
    | "property_id"
  >
>;

export type RoomRow = Timestamped & {
  id: string;
  organization_id: string;
  property_id: string;
  code: string;
  floor_label: string | null;
  room_type: RoomType;
  default_rent_paise: number;
  default_deposit_paise: number;
  currency: string;
  capacity: number;
  status: InventoryStatus;
  archived_at: string | null;
};
export type RoomInsert = TimestampInsert & {
  id?: string;
  organization_id: string;
  property_id: string;
  code: string;
  floor_label?: string | null;
  room_type: RoomType;
  default_rent_paise?: number;
  default_deposit_paise?: number;
  currency?: string;
  capacity?: number;
  status?: InventoryStatus;
  archived_at?: string | null;
};
export type RoomUpdate = Partial<
  Omit<RoomRow, "id" | "created_at" | "organization_id" | "property_id">
>;

export type BedRow = Timestamped & {
  id: string;
  organization_id: string;
  room_id: string;
  code: string;
  status: InventoryStatus;
  archived_at: string | null;
};
export type BedInsert = TimestampInsert & {
  id?: string;
  organization_id: string;
  room_id: string;
  code: string;
  status?: InventoryStatus;
  archived_at?: string | null;
};
export type BedUpdate = Partial<
  Omit<BedRow, "id" | "created_at" | "organization_id" | "room_id">
>;

type DomainTable<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
export type ResidentRow = {
  id: string;
  organization_id: string;
  profile_id: string | null;
  full_name: string;
  email_normalized: string | null;
  phone_e164: string | null;
  emergency_name: string | null;
  emergency_phone_e164: string | null;
  status: ResidentStatus;
  created_at: string;
  updated_at: string;
};
export type TenancyRow = {
  id: string;
  organization_id: string;
  resident_id: string;
  property_id: string;
  start_date: string;
  end_date: string | null;
  due_day: number;
  rent_paise: number;
  deposit_paise: number;
  currency: string;
  status: TenancyStatus;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
};
export type OccupancyAssignmentRow = {
  id: string;
  organization_id: string;
  tenancy_id: string;
  room_id: string;
  bed_id: string | null;
  starts_at: string;
  ends_at: string | null;
  reason: string | null;
  created_by: string;
  created_at: string;
};
export type InvoiceRow = {
  id: string;
  organization_id: string;
  tenancy_id: string;
  property_id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  currency: string;
  subtotal_paise: number;
  adjustment_paise: number;
  total_paise: number;
  paid_paise: number;
  balance_paise: number;
  status: InvoiceStatus;
  invoice_number: string;
  created_at: string;
  updated_at: string;
};
export type InvoiceItemRow = {
  id: string;
  organization_id: string;
  invoice_id: string;
  item_type:
    "rent" | "utilities" | "mess" | "discount" | "late_fee" | "adjustment";
  description: string;
  quantity: number;
  unit_amount_paise: number;
  total_amount_paise: number;
  metadata: Json;
  created_at: string;
};
export type PaymentRow = {
  id: string;
  organization_id: string;
  payer_resident_id: string;
  amount_paise: number;
  currency: string;
  method: PaymentMethod;
  paid_on: string;
  transaction_reference: string | null;
  proof_storage_path: string | null;
  status: PaymentStatus;
  submitted_by: string;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
};
export type ReceiptRow = {
  id: string;
  organization_id: string;
  payment_id: string;
  receipt_number: string;
  pdf_storage_path: string | null;
  generated_at: string;
  created_at: string;
};
export type ComplaintRow = {
  id: string;
  organization_id: string;
  tenancy_id: string | null;
  resident_id: string;
  property_id: string;
  room_id: string | null;
  category: string;
  priority: ComplaintPriority;
  title: string;
  description: string;
  status: ComplaintStatus;
  assigned_membership_id: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};
export type ComplaintEventRow = {
  id: string;
  organization_id: string;
  complaint_id: string;
  actor_id: string;
  event_type: string;
  previous_status: ComplaintStatus | null;
  new_status: ComplaintStatus | null;
  note: string | null;
  created_at: string;
};
export type AttachmentRow = {
  id: string;
  organization_id: string;
  entity_type: "complaint" | "payment";
  entity_id: string;
  storage_path: string;
  media_type: string;
  uploaded_by: string;
  created_at: string;
};
export type NoticeRow = {
  id: string;
  organization_id: string;
  author_id: string;
  title: string;
  body: string;
  category: string;
  is_pinned: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};
export type NoticeTargetRow = {
  id: string;
  organization_id: string;
  notice_id: string;
  target_type: "organization" | "property" | "room" | "resident";
  target_id: string;
  created_at: string;
};
export type DocumentRow = {
  id: string;
  organization_id: string;
  resident_id: string | null;
  profile_id: string | null;
  document_type: string;
  storage_path: string;
  verification_status: "pending" | "verified" | "rejected";
  expires_on: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};
export type NotificationRow = {
  id: string;
  organization_id: string;
  recipient_profile_id: string;
  notification_type: string;
  title: string;
  body: string;
  deep_link_path: string | null;
  read_at: string | null;
  created_at: string;
};
export type PushDeviceRow = {
  id: string;
  profile_id: string;
  expo_push_token: string;
  platform: "ios" | "android";
  app_version: string;
  last_seen_at: string;
  enabled: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      organizations: {
        Row: OrganizationRow;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
        Relationships: [];
      };
      organization_memberships: {
        Row: OrganizationMembershipRow;
        Insert: OrganizationMembershipInsert;
        Update: OrganizationMembershipUpdate;
        Relationships: [];
      };
      properties: {
        Row: PropertyRow;
        Insert: PropertyInsert;
        Update: PropertyUpdate;
        Relationships: [];
      };
      property_memberships: {
        Row: PropertyMembershipRow;
        Insert: PropertyMembershipInsert;
        Update: PropertyMembershipUpdate;
        Relationships: [];
      };
      rooms: {
        Row: RoomRow;
        Insert: RoomInsert;
        Update: RoomUpdate;
        Relationships: [];
      };
      beds: {
        Row: BedRow;
        Insert: BedInsert;
        Update: BedUpdate;
        Relationships: [];
      };
      residents: DomainTable<ResidentRow>;
      tenancies: DomainTable<TenancyRow>;
      occupancy_assignments: DomainTable<OccupancyAssignmentRow>;
      invoices: DomainTable<InvoiceRow>;
      invoice_items: DomainTable<InvoiceItemRow>;
      payments: DomainTable<PaymentRow>;
      receipts: DomainTable<ReceiptRow>;
      complaints: DomainTable<ComplaintRow>;
      complaint_events: DomainTable<ComplaintEventRow>;
      attachments: DomainTable<AttachmentRow>;
      notices: DomainTable<NoticeRow>;
      notice_targets: DomainTable<NoticeTargetRow>;
      documents: DomainTable<DocumentRow>;
      notifications: DomainTable<NotificationRow>;
      push_devices: DomainTable<PushDeviceRow>;
    };
    Views: Record<never, never>;
    Functions: {
      can_access_property: {
        Args: { requested_property_id: string };
        Returns: boolean;
      };
      create_organization_with_owner: {
        Args: {
          organization_name: string;
          organization_slug: string;
          request_idempotency_key: string;
        };
        Returns: string;
      };
      is_org_member: {
        Args: {
          requested_organization_id: string;
          allowed_roles?: MembershipRole[] | null;
        };
        Returns: boolean;
      };
      shares_organization_with: {
        Args: { requested_profile_id: string };
        Returns: boolean;
      };
      owner_dashboard: {
        Args: { requested_organization_id: string };
        Returns: Json;
      };
      generate_monthly_invoices: {
        Args: {
          requested_organization_id: string;
          requested_period_start: string;
        };
        Returns: Json;
      };
      submit_payment: {
        Args: {
          requested_invoice_id: string;
          requested_amount_paise: number;
          requested_method: PaymentMethod;
          requested_paid_on: string;
          requested_reference: string | null;
          requested_proof_path: string | null;
          request_idempotency_key: string;
        };
        Returns: string;
      };
      decide_payment: {
        Args: {
          requested_payment_id: string;
          approve: boolean;
          reason: string | null;
          allocations?: Json;
        };
        Returns: string | null;
      };
      transition_complaint: {
        Args: {
          requested_complaint_id: string;
          requested_status: ComplaintStatus;
          transition_note: string | null;
        };
        Returns: string;
      };
      create_tenancy_with_assignment: {
        Args: {
          requested_organization_id: string;
          requested_resident_id: string;
          requested_property_id: string;
          requested_room_id: string;
          requested_bed_id: string | null;
          requested_start_date: string;
          requested_due_day: number;
          requested_rent_paise: number;
          requested_deposit_paise: number;
          request_idempotency_key: string;
        };
        Returns: string;
      };
      transfer_occupancy: {
        Args: {
          requested_tenancy_id: string;
          requested_room_id: string | null;
          requested_bed_id: string | null;
          effective_at: string;
          transfer_reason: string | null;
          request_idempotency_key: string;
        };
        Returns: string | null;
      };
      create_invitation: {
        Args: {
          requested_organization_id: string;
          requested_resident_id: string | null;
          requested_role: MembershipRole;
          requested_email: string | null;
          requested_phone: string | null;
          requested_expires_at: string;
        };
        Returns: Json;
      };
      accept_invitation: {
        Args: { raw_token: string };
        Returns: string;
      };
    };
    Enums: {
      account_status: AccountStatus;
      organization_status: OrganizationStatus;
      membership_role: MembershipRole;
      membership_status: MembershipStatus;
      property_type: PropertyType;
      property_status: PropertyStatus;
      room_type: RoomType;
      inventory_status: InventoryStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
