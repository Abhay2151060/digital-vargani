import { z } from 'zod';

// ==========================================
// ENUMS
// ==========================================

export enum Role {
  ADMIN = 'ADMIN',
  TREASURER = 'TREASURER',
  VOLUNTEER = 'VOLUNTEER',
}

export enum MemberStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  PENDING = 'PENDING',
}

export enum PaymentVerificationStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ExpenseCategory {
  MANDAP = 'MANDAP',
  SOUND_LIGHTING = 'SOUND_LIGHTING',
  PRASAD = 'PRASAD',
  IDOL = 'IDOL',
  SECURITY = 'SECURITY',
  PERMISSIONS = 'PERMISSIONS',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum DiscrepancyStatus {
  NONE = 'NONE',
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

export enum Language {
  MARATHI = 'mr',
  ENGLISH = 'en',
}

export enum FestivalType {
  GANESHOTSAV = 'GANESHOTSAV',
  NAVRATRI = 'NAVRATRI',
  SHIV_JAYANTI = 'SHIV_JAYANTI',
  DAHI_HANDI = 'DAHI_HANDI',
  OTHER = 'OTHER',
}

// ==========================================
// MODELS
// ==========================================

export interface User {
  id: string;
  phone: string;
  full_name: string;
  preferred_language: Language;
  created_at: string;
  updated_at: string;
}

export interface Mandal {
  id: string;
  name: string;
  slug: string;
  registration_number?: string | null;
  city: string;
  area?: string | null;
  festival_type: FestivalType;
  receipt_prefix: string;
  logo_url?: string | null;
  upi_id?: string | null;
  upi_qr_url?: string | null;
  ahwal_url?: string | null;
  ahwal_title?: string | null;
  preset_amounts: number[];
  hide_phone_numbers: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MandalMember {
  id: string;
  mandal_id: string;
  user_id: string;
  role: Role;
  status: MemberStatus;
  invited_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: User;
  mandal?: Mandal;
}

export interface ReceiptNumberAllocation {
  id: string;
  mandal_id: string;
  user_id: string;
  range_start: number;
  range_end: number;
  current_number: number;
  festival_year: number;
  created_at: string;
}

export interface Donation {
  id: string;
  mandal_id: string;
  volunteer_id: string;
  receipt_number: string;
  donor_name: string;
  donor_phone?: string | null;
  amount: number;
  payment_mode: PaymentMode;
  payment_reference?: string | null;
  flat_wing?: string | null;
  language: Language;
  payment_verification_status: PaymentVerificationStatus;
  client_id?: string | null; // Idempotency key for offline sync
  is_reconciled: boolean;
  reconciliation_id?: string | null;
  is_voided: boolean;
  voided_by?: string | null;
  voided_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  volunteer_name?: string;
  corrections?: DonationCorrection[];
}

export interface DonationCorrection {
  id: string;
  donation_id: string;
  mandal_id: string;
  corrected_by: string;
  previous_amount: number;
  new_amount: number;
  reason: string;
  created_at: string;
}

export interface CashReconciliation {
  id: string;
  mandal_id: string;
  volunteer_id: string;
  treasurer_id: string;
  expected_amount: number;
  received_amount: number;
  discrepancy_amount: number;
  discrepancy_status: DiscrepancyStatus;
  discrepancy_reason?: string | null;
  resolved_at?: string | null;
  notes?: string | null;
  created_at: string;
  // Joined fields
  volunteer_name?: string;
  treasurer_name?: string;
}

export interface Expense {
  id: string;
  mandal_id: string;
  logged_by: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  bill_photo_url?: string | null;
  status: ExpenseStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  is_voided: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  logged_by_name?: string;
  approved_by_name?: string;
}

export interface AuditLog {
  id: string;
  mandal_id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ==========================================
// OFFLINE QUEUE & SYNC
// ==========================================

export interface OfflineDonationEntry {
  client_id: string;
  mandal_id: string;
  volunteer_id: string;
  receipt_number: string;
  donor_name: string;
  donor_phone?: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_reference?: string;
  flat_wing?: string;
  language: Language;
  created_at: string;
  sync_status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  error_message?: string;
}

// ==========================================
// DASHBOARD & REPORTS
// ==========================================

export interface VolunteerTally {
  volunteer_id: string;
  volunteer_name: string;
  today_cash_collected: number;
  today_upi_collected: number;
  today_pending_collected: number;
  total_cash_unreconciled: number;
  total_donations_count: number;
}

export interface TreasurerOverview {
  mandal_id: string;
  festival_total_collected: number;
  today_total_collected: number;
  total_cash_collected: number;
  total_upi_collected: number;
  total_pending_collected: number;
  total_cash_in_hand_volunteers: number;
  total_cash_reconciled: number;
  total_approved_expenses: number;
  total_pending_expenses: number;
  net_balance: number;
  volunteer_tallies: VolunteerTally[];
  recent_reconciliations: CashReconciliation[];
}

export interface PublicTransparencyReport {
  mandal: {
    name: string;
    slug: string;
    registration_number?: string | null;
    city: string;
    area?: string | null;
    festival_type: FestivalType;
    logo_url?: string | null;
    upi_id?: string | null;
    upi_qr_url?: string | null;
    ahwal_url?: string | null;
    ahwal_title?: string | null;
    hide_phone_numbers: boolean;
  };
  total_collected: number;
  total_expenses: number;
  net_balance: number;
  total_donors_count: number;
  collections_by_mode: {
    mode: PaymentMode;
    amount: number;
    count: number;
  }[];
  expenses_by_category: {
    category: ExpenseCategory;
    amount: number;
    count: number;
  }[];
  donor_roll: {
    receipt_number: string;
    donor_name: string;
    donor_phone_masked?: string;
    amount: number;
    payment_mode: PaymentMode;
    created_at: string;
  }[];
  approved_expenses_list: {
    id: string;
    category: ExpenseCategory;
    amount: number;
    description: string;
    bill_photo_url?: string | null;
    created_at: string;
  }[];
  is_audited: boolean;
  audited_at?: string;
}

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

export const loginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Legacy schema aliases for backward compatibility
export const loginOtpRequestSchema = loginSchema;
export type LoginOtpRequestInput = LoginInput;
export const loginOtpVerifySchema = loginSchema.extend({
  otp: z.string().optional(),
});
export type LoginOtpVerifyInput = z.infer<typeof loginOtpVerifySchema>;

export const createDonationSchema = z.object({
  mandal_id: z.string().uuid(),
  donor_name: z.string().min(2, 'Donor name is required (at least 2 characters)'),
  donor_phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid 10-digit mobile number').optional().or(z.literal('')),
  amount: z.number().positive('Donation amount must be greater than zero'),
  payment_mode: z.nativeEnum(PaymentMode),
  payment_reference: z.string().optional(),
  flat_wing: z.string().max(50).optional(),
  language: z.nativeEnum(Language).default(Language.MARATHI),
  client_id: z.string().uuid().optional(),
  receipt_number: z.string().optional(),
});
export type CreateDonationInput = z.infer<typeof createDonationSchema>;

export const syncDonationsBatchSchema = z.object({
  mandal_id: z.string().uuid(),
  donations: z.array(createDonationSchema.extend({
    client_id: z.string().uuid(),
    receipt_number: z.string().min(1),
    created_at: z.string(),
  })),
});
export type SyncDonationsBatchInput = z.infer<typeof syncDonationsBatchSchema>;

export const createCorrectionSchema = z.object({
  donation_id: z.string().uuid(),
  new_amount: z.number().positive(),
  reason: z.string().min(5, 'Reason for correction is required (at least 5 characters)'),
});
export type CreateCorrectionInput = z.infer<typeof createCorrectionSchema>;

export const voidDonationSchema = z.object({
  donation_id: z.string().uuid(),
  reason: z.string().min(5, 'Reason for voiding is required (at least 5 characters)'),
});
export type VoidDonationInput = z.infer<typeof voidDonationSchema>;

export const collectPendingDonationSchema = z.object({
  donation_id: z.string().uuid(),
  payment_mode: z.enum([PaymentMode.CASH, PaymentMode.UPI]),
  payment_reference: z.string().optional(),
});
export type CollectPendingDonationInput = z.infer<typeof collectPendingDonationSchema>;

export const createExpenseSchema = z.object({
  mandal_id: z.string().uuid(),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive('Expense amount must be greater than zero'),
  description: z.string().min(3, 'Description is required'),
  bill_photo_url: z.string().url().optional().or(z.literal('')),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseStatusSchema = z.object({
  expense_id: z.string().uuid(),
  status: z.enum([ExpenseStatus.APPROVED, ExpenseStatus.REJECTED]),
  rejection_reason: z.string().optional(),
});
export type UpdateExpenseStatusInput = z.infer<typeof updateExpenseStatusSchema>;

export const createReconciliationSchema = z.object({
  mandal_id: z.string().uuid(),
  volunteer_id: z.string().uuid(),
  received_amount: z.number().nonnegative('Received amount cannot be negative'),
  discrepancy_reason: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateReconciliationInput = z.infer<typeof createReconciliationSchema>;

export const updateMandalProfileSchema = z.object({
  name: z.string().min(3),
  registration_number: z.string().optional().nullable(),
  city: z.string().min(2),
  area: z.string().optional().nullable(),
  festival_type: z.nativeEnum(FestivalType),
  receipt_prefix: z.string().min(2).max(10),
  logo_url: z.string().optional().nullable().or(z.literal('')),
  upi_id: z.string().optional().nullable().or(z.literal('')),
  upi_qr_url: z.string().optional().nullable().or(z.literal('')),
  ahwal_url: z.string().optional().nullable().or(z.literal('')),
  ahwal_title: z.string().optional().nullable().or(z.literal('')),
  preset_amounts: z.array(z.number().positive()),
  hide_phone_numbers: z.boolean().default(true),
});
export type UpdateMandalProfileInput = z.infer<typeof updateMandalProfileSchema>;

export const createMandalSchema = z.object({
  name: z.string().trim().min(3).max(150),
  city: z.string().trim().min(2).max(100),
  festival_type: z.nativeEnum(FestivalType),
});
export type CreateMandalInput = z.infer<typeof createMandalSchema>;

export const inviteMemberSchema = z.object({
  mandal_id: z.string().uuid(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  full_name: z.string().min(2),
  role: z.nativeEnum(Role),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberStatusSchema = z.object({
  status: z.nativeEnum(MemberStatus),
});
export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(Role),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const resolveDiscrepancySchema = z.object({
  status: z.enum([DiscrepancyStatus.RESOLVED, DiscrepancyStatus.WRITTEN_OFF]),
  notes: z.string().trim().max(2000).optional(),
});
export type ResolveDiscrepancyInput = z.infer<typeof resolveDiscrepancySchema>;

// ==========================================
// API RESPONSE STANDARD
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
  details?: any;
}
