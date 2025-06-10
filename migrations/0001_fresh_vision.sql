CREATE TABLE "parsha_vorts" (
	"id" serial PRIMARY KEY NOT NULL,
	"week" date NOT NULL,
	"parsha" text NOT NULL,
	"hebrew_parsha" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"audio_url" text NOT NULL,
	"duration" text,
	"speaker" text NOT NULL,
	"source" text,
	"summary" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shabbat_recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"week" date NOT NULL,
	"hebrew_date" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"ingredients" text NOT NULL,
	"instructions" text NOT NULL,
	"servings" text,
	"prep_time" text,
	"cook_time" text,
	"difficulty" text,
	"image_url" text,
	"tags" text,
	"created_at" timestamp DEFAULT now()
);
