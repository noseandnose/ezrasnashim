-- Migration: Add nishmas_text table for storing complete Hebrew and English prayer texts
-- This table will store the authentic Nishmas prayer text from Nishmas.net

CREATE TABLE IF NOT EXISTS "nishmas_text" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"full_text" text NOT NULL,
	"transliteration" text,
	"source" text DEFAULT 'Nishmas.net',
	"version" text DEFAULT '1.0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create unique index on language to ensure only one entry per language
CREATE UNIQUE INDEX IF NOT EXISTS "idx_nishmas_language" ON "nishmas_text" ("language");

-- Insert sample entries to show the structure
-- You can replace these with the complete authentic texts from Nishmas.net
INSERT INTO "nishmas_text" ("language", "full_text", "transliteration", "source", "version") VALUES 
(
  'hebrew',
  'נשמת כל חי תברך את שמך ה׳ אלהינו ורוח כל בשר תפאר ותרומם זכרך מלכנו תמיד...',
  'Nishmat kol chai tevarech et shimcha Hashem Eloheinu, v''ruach kol basar te''fa''er u''teromem zicharcha malkeinu tamid...',
  'Nishmas.net',
  '1.0'
),
(
  'english',
  'The soul of every living being shall bless Your Name, Hashem, our G-d, and the spirit of all flesh shall always glorify and exalt Your remembrance, our King...',
  NULL,
  'Nishmas.net',
  '1.0'
);