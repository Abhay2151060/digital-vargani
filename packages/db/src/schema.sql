-- ==============================================================================
-- DIGITAL VARGANI / MANDAL FUND & RECEIPT MANAGEMENT PLATFORM
-- Schema Version 2.0 (PostgreSQL 14+)
-- Multi-tenant with Row Level Security (RLS) & Immutable Financial Ledger
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'TREASURER', 'VOLUNTEER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('CASH', 'UPI', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
ALTER TYPE payment_mode ADD VALUE IF NOT EXISTS 'PENDING';

DO $$ BEGIN
    CREATE TYPE payment_verification_status AS ENUM ('NOT_REQUIRED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM ('MANDAP', 'SOUND_LIGHTING', 'PRASAD', 'IDOL', 'SECURITY', 'PERMISSIONS', 'MARKETING', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discrepancy_status AS ENUM ('NONE', 'OPEN', 'RESOLVED', 'WRITTEN_OFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE language_code AS ENUM ('mr', 'en');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE festival_type AS ENUM ('GANESHOTSAV', 'NAVRATRI', 'SHIV_JAYANTI', 'DAHI_HANDI', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    preferred_language language_code NOT NULL DEFAULT 'mr',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MANDALS (TENANTS)
CREATE TABLE IF NOT EXISTS mandals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    registration_number VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100),
    festival_type festival_type NOT NULL DEFAULT 'GANESHOTSAV',
    receipt_prefix VARCHAR(10) NOT NULL DEFAULT 'G',
    logo_url TEXT,
    upi_id VARCHAR(100),
    upi_qr_url TEXT,
    ahwal_url TEXT,
    ahwal_title VARCHAR(200),
    preset_amounts INTEGER[] NOT NULL DEFAULT '{101, 251, 501, 1001, 2101, 5001}',
    hide_phone_numbers BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MANDAL MEMBERS (TENANT USER ROLES)
CREATE TABLE IF NOT EXISTS mandal_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'VOLUNTEER',
    status member_status NOT NULL DEFAULT 'PENDING',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mandal_user UNIQUE (mandal_id, user_id)
);

-- 4. RECEIPT NUMBER ALLOCATIONS (SERVER-ALLOCATED RANGES FOR OFFLINE SAFETY)
CREATE TABLE IF NOT EXISTS receipt_number_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    range_start INTEGER NOT NULL,
    range_end INTEGER NOT NULL,
    current_number INTEGER NOT NULL,
    festival_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_valid_range CHECK (range_end >= range_start AND current_number >= range_start AND current_number <= range_end + 1)
);

-- 5. DONATIONS (IMMUTABLE LEDGER)
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE RESTRICT,
    volunteer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    receipt_number VARCHAR(50) NOT NULL,
    donor_name VARCHAR(150) NOT NULL,
    donor_phone VARCHAR(15),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode payment_mode NOT NULL DEFAULT 'CASH',
    payment_reference VARCHAR(100),
    flat_wing VARCHAR(50),
    language language_code NOT NULL DEFAULT 'mr',
    payment_verification_status payment_verification_status NOT NULL DEFAULT 'NOT_REQUIRED',
    client_id UUID, -- Offline idempotency key
    is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    reconciliation_id UUID,
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    voided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    voided_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mandal_receipt UNIQUE (mandal_id, receipt_number),
    CONSTRAINT uq_mandal_client_id UNIQUE (mandal_id, client_id)
);

-- 6. DONATION CORRECTIONS (APPEND-ONLY AUDIT FOR CORRECTIONS)
CREATE TABLE IF NOT EXISTS donation_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE RESTRICT,
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE RESTRICT,
    corrected_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    previous_amount NUMERIC(12, 2) NOT NULL,
    new_amount NUMERIC(12, 2) NOT NULL CHECK (new_amount > 0),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CASH RECONCILIATIONS (VOLUNTEER TO TREASURER HANDOVER)
CREATE TABLE IF NOT EXISTS cash_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE RESTRICT,
    volunteer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    treasurer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    expected_amount NUMERIC(12, 2) NOT NULL CHECK (expected_amount >= 0),
    received_amount NUMERIC(12, 2) NOT NULL CHECK (received_amount >= 0),
    discrepancy_amount NUMERIC(12, 2) GENERATED ALWAYS AS (received_amount - expected_amount) STORED,
    discrepancy_status discrepancy_status NOT NULL DEFAULT 'NONE',
    discrepancy_reason TEXT,
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key from donations to cash_reconciliations
ALTER TABLE donations DROP CONSTRAINT IF EXISTS fk_donations_reconciliation;
ALTER TABLE donations ADD CONSTRAINT fk_donations_reconciliation 
    FOREIGN KEY (reconciliation_id) REFERENCES cash_reconciliations(id) ON DELETE SET NULL;

-- 8. EXPENSES TABLE (CATEGORIZED WITH APPROVAL WORKFLOW)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE RESTRICT,
    logged_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category expense_category NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    bill_photo_url TEXT,
    status expense_status NOT NULL DEFAULT 'PENDING',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR SCALE & QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_mandal_members_mandal ON mandal_members(mandal_id);
CREATE INDEX IF NOT EXISTS idx_mandal_members_user ON mandal_members(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_mandal ON donations(mandal_id);
CREATE INDEX IF NOT EXISTS idx_donations_volunteer ON donations(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_donations_reconciliation ON donations(reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_unreconciled_cash ON donations(mandal_id, volunteer_id) 
    WHERE payment_mode = 'CASH' AND is_reconciled = FALSE AND is_voided = FALSE;
CREATE INDEX IF NOT EXISTS idx_donation_corrections_donation ON donation_corrections(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_corrections_corrected_by ON donation_corrections(corrected_by);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_volunteer ON cash_reconciliations(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_treasurer ON cash_reconciliations(treasurer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_mandal ON expenses(mandal_id);
CREATE INDEX IF NOT EXISTS idx_expenses_logged_by ON expenses(logged_by);
CREATE INDEX IF NOT EXISTS idx_expenses_approved_by ON expenses(approved_by);
CREATE INDEX IF NOT EXISTS idx_expenses_approved ON expenses(mandal_id, status) WHERE status = 'APPROVED' AND is_voided = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_logs_mandal ON audit_logs(mandal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE mandals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandal_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_number_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user has access to mandal
CREATE OR REPLACE FUNCTION current_mandal_access(target_mandal_id UUID) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN (
        current_setting('app.current_mandal_ids', true) IS NOT NULL 
        AND target_mandal_id::TEXT = ANY(string_to_array(current_setting('app.current_mandal_ids', true), ','))
    );
END;
$$;

-- RLS Policies for Mandals & Users (Allow public read for active mandals / profile auth)
DROP POLICY IF EXISTS mandals_read_policy ON mandals;
CREATE POLICY mandals_read_policy ON mandals
    FOR SELECT
    USING (is_active = TRUE OR current_mandal_access(id));

DROP POLICY IF EXISTS users_read_policy ON users;
CREATE POLICY users_read_policy ON users
    FOR ALL
    USING (TRUE);

-- RLS Isolation Policies
DROP POLICY IF EXISTS mandal_members_isolation_policy ON mandal_members;
CREATE POLICY mandal_members_isolation_policy ON mandal_members
    FOR ALL
    USING (current_mandal_access(mandal_id));

DROP POLICY IF EXISTS donations_isolation_policy ON donations;
CREATE POLICY donations_isolation_policy ON donations
    FOR ALL
    USING (current_mandal_access(mandal_id));

DROP POLICY IF EXISTS donation_corrections_isolation_policy ON donation_corrections;
CREATE POLICY donation_corrections_isolation_policy ON donation_corrections
    FOR ALL
    USING (current_mandal_access(mandal_id));

DROP POLICY IF EXISTS cash_reconciliations_isolation_policy ON cash_reconciliations;
CREATE POLICY cash_reconciliations_isolation_policy ON cash_reconciliations
    FOR ALL
    USING (current_mandal_access(mandal_id));

DROP POLICY IF EXISTS expenses_isolation_policy ON expenses;
CREATE POLICY expenses_isolation_policy ON expenses
    FOR ALL
    USING (current_mandal_access(mandal_id));

DROP POLICY IF EXISTS receipt_number_allocations_isolation_policy ON receipt_number_allocations;
CREATE POLICY receipt_number_allocations_isolation_policy ON receipt_number_allocations
    FOR ALL
    USING (current_mandal_access(mandal_id));

DROP POLICY IF EXISTS audit_logs_isolation_policy ON audit_logs;
CREATE POLICY audit_logs_isolation_policy ON audit_logs
    FOR ALL
    USING (current_mandal_access(mandal_id));

