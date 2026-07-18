ALTER TABLE dreams ADD COLUMN IF NOT EXISTS caption_override text;
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS show_date boolean NOT NULL DEFAULT true;
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS show_time boolean NOT NULL DEFAULT true;
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS display_at timestamptz;
