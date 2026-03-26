CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  project_name TEXT NOT NULL,
  address TEXT,
  square_footage INTEGER,
  contractor_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  bid_due_date TEXT,
  scope_notes TEXT,
  status TEXT NOT NULL DEFAULT 'SittingOnData',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  competitive_price NUMERIC,
  standard_price NUMERIC,
  premium_price NUMERIC,
  sent_at TIMESTAMPTZ,
  auto_followup_approved BOOLEAN NOT NULL DEFAULT FALSE,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status) WHERE is_deleted=false;
CREATE INDEX IF NOT EXISTS idx_leads_sent_at ON leads(sent_at) WHERE is_deleted=false;
