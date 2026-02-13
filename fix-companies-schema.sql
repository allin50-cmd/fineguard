-- Fix companies table schema to match import script expectations
-- This adds missing columns and ensures the table is ready for the 5.8M import

-- Check if companies table exists, if not create it
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(500),
  company_number VARCHAR(8) UNIQUE NOT NULL,
  company_category VARCHAR(100),
  company_status VARCHAR(50),
  country_of_origin VARCHAR(100),
  dissolution_date DATE,
  incorporation_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing address columns if they don't exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reg_address_care_of VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reg_address_po_box VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reg_address_line1 VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reg_address_line2 VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reg_address_post_town VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reg_address_county VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reg_address_country VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reg_address_postcode VARCHAR(20);

-- Add missing accounts columns if they don't exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS accounts_ref_day INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS accounts_ref_month INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS accounts_next_due_date DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS accounts_last_made_up_date DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS accounts_category VARCHAR(100);

-- Add missing SIC code columns if they don't exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sic_code_1 VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sic_code_2 VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sic_code_3 VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sic_code_4 VARCHAR(255);

-- Ensure company_status column exists (this was the main issue)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_status VARCHAR(50);

-- Create indexes for better query performance (will be dropped during import)
CREATE INDEX IF NOT EXISTS idx_companies_number ON companies(company_number);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(company_status);
CREATE INDEX IF NOT EXISTS idx_companies_postcode ON companies(reg_address_postcode);

-- Show table structure
\d companies;

-- Show row count
SELECT COUNT(*) as total_companies FROM companies;
