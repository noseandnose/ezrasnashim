CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"hebrew_date" text NOT NULL,
	"gregorian_date" text NOT NULL,
	"recurring" boolean DEFAULT true,
	"years" integer DEFAULT 20
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"audio_url" text,
	"date" text NOT NULL,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "daily_chizuk" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"hebrew_date" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"audio_url" text NOT NULL,
	"duration" text,
	"speaker" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_halacha" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"hebrew_date" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_mussar" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"hebrew_date" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author" text,
	"source" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_tehillim_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"current_perek" integer DEFAULT 1 NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"completed_by" text
);
--> statement-breakpoint
CREATE TABLE "jewish_times" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"location" text DEFAULT 'New York, NY' NOT NULL,
	"sunrise" text NOT NULL,
	"sunset" text NOT NULL,
	"candle_lighting" text,
	"havdalah" text,
	"hebrew_date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loshon_horah" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"hebrew_date" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"halachic_source" text,
	"practical_tip" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mincha_prayers" (
	"id" serial PRIMARY KEY NOT NULL,
	"prayer_type" text NOT NULL,
	"hebrew_text" text NOT NULL,
	"english_translation" text NOT NULL,
	"transliteration" text,
	"order_index" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "perakim_texts" (
	"id" serial PRIMARY KEY NOT NULL,
	"perek_number" integer NOT NULL,
	"hebrew_text" text,
	"english_translation" text,
	"transliteration" text,
	CONSTRAINT "perakim_texts_perek_number_unique" UNIQUE("perek_number")
);
--> statement-breakpoint
CREATE TABLE "shop_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"price" text,
	"image_url" text,
	"external_url" text
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hebrew_name" text,
	"sponsorship_date" text NOT NULL,
	"message" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tehillim_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"hebrew_name" text NOT NULL,
	"reason" text NOT NULL,
	"reason_english" text,
	"date_added" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE "tehillim_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"current_perek" integer DEFAULT 1,
	"current_name_id" integer,
	"last_updated" timestamp DEFAULT now(),
	"user_id" integer
);
