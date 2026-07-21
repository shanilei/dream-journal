-- Caption/date-time font size overrides (see "Edit image details" sheet's
-- +/- steppers). Nullable — existing dreams fall back to the app's own
-- defaults (CAPTION_FONT_SIZE_DEFAULT/META_FONT_SIZE_DEFAULT in
-- src/lib/caption.ts) until a dream is explicitly edited.
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS caption_font_size integer;
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS meta_font_size integer;
