-- Migration: Promo System V2 (Professional Features)
-- Run on VPS: psql -U kerabatuser -d kerabatpos -f migrate_promo_v2.sql

-- Add exclusive flag
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN NOT NULL DEFAULT FALSE;

-- Financial Controls
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS discount_cap NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS budget_limit NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS budget_used NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Quota & Fraud Prevention
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS total_quota INTEGER DEFAULT NULL;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS total_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS limit_per_user INTEGER DEFAULT NULL;

-- Priority & Distribution
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 5;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS voucher_code TEXT UNIQUE DEFAULT NULL;

-- Audit Trail
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES "user"(id);
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS updated_by TEXT REFERENCES "user"(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS discounts_voucher_code_idx ON discounts(voucher_code);
CREATE INDEX IF NOT EXISTS discounts_priority_idx ON discounts(priority);

SELECT 'Migration promo_v2 SELESAI!' as status;
