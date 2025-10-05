


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'Enhancement Engine Schema: Complete database structure for Novel Enchant AI-powered story enhancement system. Supports images, audio, animations, and character consistency tracking.';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."delete_owned_media"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Delete media owned by the deleted enhancement
  DELETE FROM media
  WHERE owner_type = 'enhancement'
    AND owner_id = OLD.id;

  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_owned_media"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_owned_media"() IS 'Automatically deletes media records when their owning entity is deleted';



CREATE OR REPLACE FUNCTION "public"."delete_storage_file_on_media_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Delete from storage.objects table
  -- This removes both the metadata AND triggers Supabase to delete the actual S3 file
  DELETE FROM storage.objects
  WHERE bucket_id = 'enhancements'
    AND name = OLD.storage_path;

  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_storage_file_on_media_delete"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_storage_file_on_media_delete"() IS 'Automatically deletes storage files when media records are deleted. Removes orphaned files from S3.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, display_name, preferences)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'Trigger function that automatically updates the updated_at column to current timestamp on row updates';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."anchors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "active_enhancement_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "after_paragraph_index" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "anchors_after_paragraph_index_check" CHECK (("after_paragraph_index" >= 0))
);


ALTER TABLE "public"."anchors" OWNER TO "postgres";


COMMENT ON TABLE "public"."anchors" IS 'Position markers in chapter text where enhancements (images, animations, audio) are placed. Anchors are stable even if text is edited.';



COMMENT ON COLUMN "public"."anchors"."id" IS 'Unique anchor identifier. Auto-generated UUID.';



COMMENT ON COLUMN "public"."anchors"."chapter_id" IS 'Parent chapter. Foreign key to chapters table. Cascade deletes anchor when chapter is deleted.';



COMMENT ON COLUMN "public"."anchors"."active_enhancement_id" IS 'Currently displayed enhancement. Foreign key to enhancements table (added later). Null if no enhancement selected. Set null if enhancement deleted.';



COMMENT ON COLUMN "public"."anchors"."created_at" IS 'Anchor creation timestamp. Set automatically.';



COMMENT ON COLUMN "public"."anchors"."updated_at" IS 'Last modification timestamp. Auto-updated by trigger.';



COMMENT ON COLUMN "public"."anchors"."after_paragraph_index" IS 'Paragraph index after which the enhancement appears. 0 = after first paragraph, 1 = after second paragraph, etc. Must be >= 0.';



CREATE TABLE IF NOT EXISTS "public"."chapters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "title" "text",
    "text_content" "text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chapters_order_index_check" CHECK (("order_index" >= 0))
);


ALTER TABLE "public"."chapters" OWNER TO "postgres";


COMMENT ON TABLE "public"."chapters" IS 'Individual chapters within a story. Contains the actual text content and ordering.';



COMMENT ON COLUMN "public"."chapters"."id" IS 'Unique chapter identifier. Auto-generated UUID.';



COMMENT ON COLUMN "public"."chapters"."story_id" IS 'Parent story. Foreign key to stories table. Cascade deletes chapter when story is deleted.';



COMMENT ON COLUMN "public"."chapters"."title" IS 'Optional chapter title. Can be null for untitled chapters.';



COMMENT ON COLUMN "public"."chapters"."text_content" IS 'The full text content of the chapter. Required field.';



COMMENT ON COLUMN "public"."chapters"."order_index" IS 'Zero-based position within story. Used for sorting chapters. Must be >= 0.';



COMMENT ON COLUMN "public"."chapters"."created_at" IS 'Chapter creation timestamp. Set automatically.';



COMMENT ON COLUMN "public"."chapters"."updated_at" IS 'Last modification timestamp. Auto-updated by trigger.';



CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "name" "text",
    "short_desc" "text",
    "aliases" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "text" DEFAULT 'candidate'::"text" NOT NULL,
    "confidence" numeric DEFAULT 0.5 NOT NULL,
    "merged_into_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "characters_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "characters_status_check" CHECK (("status" = ANY (ARRAY['candidate'::"text", 'confirmed'::"text", 'ignored'::"text", 'merged'::"text"])))
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


COMMENT ON TABLE "public"."characters" IS 'Character registry for maintaining visual consistency across AI-generated images. Tracks character names, descriptions, and merge history.';



COMMENT ON COLUMN "public"."characters"."id" IS 'Unique character identifier. Auto-generated UUID.';



COMMENT ON COLUMN "public"."characters"."story_id" IS 'Parent story. Foreign key to stories table. Cascade deletes character when story is deleted.';



COMMENT ON COLUMN "public"."characters"."name" IS 'Character name. Can be null if character detected but name not yet determined.';



COMMENT ON COLUMN "public"."characters"."short_desc" IS 'Brief physical description used in AI prompts to maintain visual consistency (e.g., "tall woman with red hair and green eyes").';



COMMENT ON COLUMN "public"."characters"."aliases" IS 'Array of alternative names: nicknames, titles, name variations. Used to match character references in text.';



COMMENT ON COLUMN "public"."characters"."status" IS 'Registry status. "candidate" = AI detected but not confirmed, "confirmed" = user verified, "ignored" = not a real character, "merged" = duplicate merged into another character.';



COMMENT ON COLUMN "public"."characters"."confidence" IS 'AI confidence score for character detection. Range 0.0-1.0. Higher = more confident this is a real character.';



COMMENT ON COLUMN "public"."characters"."merged_into_id" IS 'If status is "merged", points to the main character this was merged into. Null otherwise.';



COMMENT ON COLUMN "public"."characters"."created_at" IS 'Character detection/creation timestamp. Set automatically.';



COMMENT ON COLUMN "public"."characters"."updated_at" IS 'Last modification timestamp. Auto-updated by trigger.';



CREATE TABLE IF NOT EXISTS "public"."enhancement_characters" (
    "enhancement_id" "uuid" NOT NULL,
    "character_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."enhancement_characters" OWNER TO "postgres";


COMMENT ON TABLE "public"."enhancement_characters" IS 'Junction table linking enhancements to characters depicted in them. Supports character-based image queries and consistency tracking.';



COMMENT ON COLUMN "public"."enhancement_characters"."enhancement_id" IS 'The enhancement (AI-generated image) containing this character. Cascade deletes when enhancement is deleted.';



COMMENT ON COLUMN "public"."enhancement_characters"."character_id" IS 'The character appearing in this enhancement. Cascade deletes when character is deleted (prevents orphaned associations).';



CREATE TABLE IF NOT EXISTS "public"."enhancements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "anchor_id" "uuid" NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "enhancement_type" "text" NOT NULL,
    "media_id" "uuid",
    "status" "text" DEFAULT 'generating'::"text" NOT NULL,
    "seed" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enhancements_enhancement_type_check" CHECK (("enhancement_type" = ANY (ARRAY['ai_image'::"text", 'user_image'::"text", 'audio'::"text", 'animation'::"text"]))),
    CONSTRAINT "enhancements_status_check" CHECK (("status" = ANY (ARRAY['generating'::"text", 'completed'::"text", 'failed'::"text"]))),
    CONSTRAINT "media_required_for_non_animation" CHECK (((("enhancement_type" = 'animation'::"text") AND ("media_id" IS NULL)) OR (("enhancement_type" <> 'animation'::"text") AND ("media_id" IS NOT NULL))))
);


ALTER TABLE "public"."enhancements" OWNER TO "postgres";


COMMENT ON TABLE "public"."enhancements" IS 'Enhancement instances placed in stories. Links media files or animations to specific story positions. Tracks generation status and settings.';



COMMENT ON COLUMN "public"."enhancements"."id" IS 'Unique enhancement identifier. Auto-generated UUID.';



COMMENT ON COLUMN "public"."enhancements"."anchor_id" IS 'Position where enhancement appears. Foreign key to anchors table. Cascade deletes enhancement when anchor is deleted.';



COMMENT ON COLUMN "public"."enhancements"."chapter_id" IS 'Parent chapter. Denormalized from anchor for fast queries. Cascade deletes enhancement when chapter is deleted.';



COMMENT ON COLUMN "public"."enhancements"."enhancement_type" IS 'Type of enhancement. "ai_image" = AI-generated image, "user_image" = uploaded image, "audio" = sound/narration, "animation" = text animation.';



COMMENT ON COLUMN "public"."enhancements"."media_id" IS 'Media file reference. Foreign key to media table. NULL for animations (which have no file). Required for image/audio types.';



COMMENT ON COLUMN "public"."enhancements"."status" IS 'Generation status. "generating" = AI is creating, "completed" = ready, "failed" = error occurred. Only relevant for AI-generated content.';



COMMENT ON COLUMN "public"."enhancements"."seed" IS 'Random seed for reproducible AI generation. Same seed + prompt = same image. Null for user uploads.';



COMMENT ON COLUMN "public"."enhancements"."config" IS 'Enhancement-specific settings. For animations: type, duration, easing. For images: style overrides. For audio: volume, loop settings.';



COMMENT ON COLUMN "public"."enhancements"."metadata" IS 'Additional data: AI provider info, generation parameters, quality scores, retry count, error messages, user feedback.';



COMMENT ON COLUMN "public"."enhancements"."created_at" IS 'Enhancement creation timestamp. Set automatically.';



COMMENT ON COLUMN "public"."enhancements"."updated_at" IS 'Last modification timestamp. Auto-updated by trigger.';



CREATE TABLE IF NOT EXISTS "public"."media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "file_size" bigint,
    "mime_type" "text",
    "width" integer,
    "height" integer,
    "duration" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owner_type" "text",
    "owner_id" "uuid",
    CONSTRAINT "media_media_type_check" CHECK (("media_type" = ANY (ARRAY['image'::"text", 'audio'::"text", 'video'::"text"]))),
    CONSTRAINT "media_owner_type_check" CHECK (("owner_type" = ANY (ARRAY['enhancement'::"text", 'story_cover'::"text", 'avatar'::"text", 'user_upload'::"text"])))
);


ALTER TABLE "public"."media" OWNER TO "postgres";


COMMENT ON TABLE "public"."media" IS 'Physical file storage for all media types. Separates file metadata from enhancement context. Supports AI-generated and user-uploaded files.';



COMMENT ON COLUMN "public"."media"."id" IS 'Unique media identifier. Auto-generated UUID. Used as filename in storage.';



COMMENT ON COLUMN "public"."media"."user_id" IS 'Media owner. Foreign key to users table. Cascade deletes media when user is deleted.';



COMMENT ON COLUMN "public"."media"."url" IS 'Full public URL to access the file. Generated from storage bucket + path.';



COMMENT ON COLUMN "public"."media"."storage_path" IS 'Path in Supabase Storage bucket. Format: {user_id}/{story_id}/{media_id}.{ext}';



COMMENT ON COLUMN "public"."media"."media_type" IS 'Type of media. Must be "image", "audio", or "video". Determines which dimension fields are applicable.';



COMMENT ON COLUMN "public"."media"."file_size" IS 'File size in bytes. Used for storage quota tracking and UI display.';



COMMENT ON COLUMN "public"."media"."mime_type" IS 'MIME type of file (e.g., "image/png", "audio/mpeg"). Used for proper content serving.';



COMMENT ON COLUMN "public"."media"."width" IS 'Width in pixels for images/videos. Null for audio files.';



COMMENT ON COLUMN "public"."media"."height" IS 'Height in pixels for images/videos. Null for audio files.';



COMMENT ON COLUMN "public"."media"."duration" IS 'Duration in seconds for audio/video files. Null for images.';



COMMENT ON COLUMN "public"."media"."metadata" IS 'Additional file metadata: compression, color profile, bitrate, source info, etc.';



COMMENT ON COLUMN "public"."media"."created_at" IS 'Upload/creation timestamp. Set automatically.';



COMMENT ON COLUMN "public"."media"."updated_at" IS 'Last modification timestamp. Auto-updated by trigger.';



COMMENT ON COLUMN "public"."media"."owner_type" IS 'Type of entity that owns this media: enhancement, story_cover, avatar, or user_upload';



COMMENT ON COLUMN "public"."media"."owner_id" IS 'ID of the owning entity. References different tables based on owner_type';



CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "style_preferences" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author" "text"
);


ALTER TABLE "public"."stories" OWNER TO "postgres";


COMMENT ON TABLE "public"."stories" IS 'Top-level story/book containers. Each story belongs to one user and contains multiple chapters.';



COMMENT ON COLUMN "public"."stories"."id" IS 'Unique story identifier. Auto-generated UUID.';



COMMENT ON COLUMN "public"."stories"."user_id" IS 'Story owner. Foreign key to users table. Cascade deletes story when user is deleted.';



COMMENT ON COLUMN "public"."stories"."title" IS 'Story title. Required field.';



COMMENT ON COLUMN "public"."stories"."description" IS 'Optional story description, synopsis, or author notes.';



COMMENT ON COLUMN "public"."stories"."style_preferences" IS 'Default AI generation preferences: art style, mood, color palette, etc. Inherited by chapters unless overridden.';



COMMENT ON COLUMN "public"."stories"."created_at" IS 'Story creation timestamp. Set automatically.';



COMMENT ON COLUMN "public"."stories"."updated_at" IS 'Last modification timestamp. Auto-updated by trigger.';



COMMENT ON COLUMN "public"."stories"."author" IS 'Optional author name for the story. Can be different from the user account name.';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Extended user profile data and preferences. Links to auth.users for authentication.';



COMMENT ON COLUMN "public"."users"."id" IS 'User ID that matches auth.users.id. Primary key and foreign key.';



COMMENT ON COLUMN "public"."users"."display_name" IS 'User-facing display name. Can be different from email.';



COMMENT ON COLUMN "public"."users"."avatar_url" IS 'URL to user profile picture in storage or external service.';



COMMENT ON COLUMN "public"."users"."preferences" IS 'JSON object for user settings: theme, notifications, default style preferences, etc.';



COMMENT ON COLUMN "public"."users"."created_at" IS 'Account creation timestamp. Set automatically on insert.';



COMMENT ON COLUMN "public"."users"."updated_at" IS 'Last update timestamp. Auto-updated by trigger on any change.';



ALTER TABLE ONLY "public"."anchors"
    ADD CONSTRAINT "anchors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enhancement_characters"
    ADD CONSTRAINT "enhancement_characters_pkey" PRIMARY KEY ("enhancement_id", "character_id");



ALTER TABLE ONLY "public"."enhancements"
    ADD CONSTRAINT "enhancements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_anchors_active_enhancement" ON "public"."anchors" USING "btree" ("active_enhancement_id");



COMMENT ON INDEX "public"."idx_anchors_active_enhancement" IS 'Fast lookup of anchors by active enhancement (for joins)';



CREATE INDEX "idx_anchors_chapter_id_paragraph" ON "public"."anchors" USING "btree" ("chapter_id", "after_paragraph_index");



CREATE INDEX "idx_chapters_story_id_order" ON "public"."chapters" USING "btree" ("story_id", "order_index");



COMMENT ON INDEX "public"."idx_chapters_story_id_order" IS 'Fast ordered retrieval of chapters within a story';



CREATE INDEX "idx_characters_merged_into" ON "public"."characters" USING "btree" ("merged_into_id");



COMMENT ON INDEX "public"."idx_characters_merged_into" IS 'Fast lookup of characters merged into a specific character';



CREATE INDEX "idx_characters_status" ON "public"."characters" USING "btree" ("status");



COMMENT ON INDEX "public"."idx_characters_status" IS 'Fast filtering by character status (candidate, confirmed, etc.)';



CREATE INDEX "idx_characters_story_id" ON "public"."characters" USING "btree" ("story_id");



COMMENT ON INDEX "public"."idx_characters_story_id" IS 'Fast lookup of all characters in a story';



CREATE INDEX "idx_enhancement_characters_character_id" ON "public"."enhancement_characters" USING "btree" ("character_id");



CREATE INDEX "idx_enhancement_characters_enhancement_id" ON "public"."enhancement_characters" USING "btree" ("enhancement_id");



CREATE INDEX "idx_enhancements_anchor_id" ON "public"."enhancements" USING "btree" ("anchor_id");



COMMENT ON INDEX "public"."idx_enhancements_anchor_id" IS 'Fast lookup of all enhancements for an anchor';



CREATE INDEX "idx_enhancements_chapter_id" ON "public"."enhancements" USING "btree" ("chapter_id");



COMMENT ON INDEX "public"."idx_enhancements_chapter_id" IS 'Fast lookup of all enhancements in a chapter';



CREATE INDEX "idx_enhancements_media_id" ON "public"."enhancements" USING "btree" ("media_id");



COMMENT ON INDEX "public"."idx_enhancements_media_id" IS 'Fast lookup of enhancements using specific media';



CREATE INDEX "idx_enhancements_status" ON "public"."enhancements" USING "btree" ("status");



COMMENT ON INDEX "public"."idx_enhancements_status" IS 'Fast filtering by generation status (for polling in-progress generations)';



CREATE INDEX "idx_enhancements_type" ON "public"."enhancements" USING "btree" ("enhancement_type");



COMMENT ON INDEX "public"."idx_enhancements_type" IS 'Fast filtering by enhancement type';



CREATE INDEX "idx_media_owner" ON "public"."media" USING "btree" ("owner_type", "owner_id");



CREATE INDEX "idx_media_type" ON "public"."media" USING "btree" ("media_type");



COMMENT ON INDEX "public"."idx_media_type" IS 'Fast filtering by media type (images, audio, video)';



CREATE INDEX "idx_media_user_id" ON "public"."media" USING "btree" ("user_id");



COMMENT ON INDEX "public"."idx_media_user_id" IS 'Fast lookup of all media by user (for quota/management)';



CREATE INDEX "idx_stories_user_id" ON "public"."stories" USING "btree" ("user_id");



COMMENT ON INDEX "public"."idx_stories_user_id" IS 'Fast lookup of all stories by user';



CREATE OR REPLACE TRIGGER "cleanup_media_on_enhancement_delete" AFTER DELETE ON "public"."enhancements" FOR EACH ROW EXECUTE FUNCTION "public"."delete_owned_media"();



COMMENT ON TRIGGER "cleanup_media_on_enhancement_delete" ON "public"."enhancements" IS 'Automatically cleans up orphaned media when enhancement is deleted';



CREATE OR REPLACE TRIGGER "cleanup_storage_file_on_media_delete" AFTER DELETE ON "public"."media" FOR EACH ROW EXECUTE FUNCTION "public"."delete_storage_file_on_media_delete"();



COMMENT ON TRIGGER "cleanup_storage_file_on_media_delete" ON "public"."media" IS 'Automatically removes storage files when media records are deleted to prevent orphaned files';



CREATE OR REPLACE TRIGGER "update_anchors_updated_at" BEFORE UPDATE ON "public"."anchors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chapters_updated_at" BEFORE UPDATE ON "public"."chapters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_characters_updated_at" BEFORE UPDATE ON "public"."characters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_enhancements_updated_at" BEFORE UPDATE ON "public"."enhancements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_media_updated_at" BEFORE UPDATE ON "public"."media" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stories_updated_at" BEFORE UPDATE ON "public"."stories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."anchors"
    ADD CONSTRAINT "anchors_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "public"."characters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhancement_characters"
    ADD CONSTRAINT "enhancement_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhancement_characters"
    ADD CONSTRAINT "enhancement_characters_enhancement_id_fkey" FOREIGN KEY ("enhancement_id") REFERENCES "public"."enhancements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhancements"
    ADD CONSTRAINT "enhancements_anchor_id_fkey" FOREIGN KEY ("anchor_id") REFERENCES "public"."anchors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhancements"
    ADD CONSTRAINT "enhancements_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhancements"
    ADD CONSTRAINT "enhancements_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."anchors"
    ADD CONSTRAINT "fk_anchors_active_enhancement" FOREIGN KEY ("active_enhancement_id") REFERENCES "public"."enhancements"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "fk_anchors_active_enhancement" ON "public"."anchors" IS 'Foreign key to currently active enhancement. Added after enhancements table created to resolve circular dependency.';



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can create anchors in own chapters" ON "public"."anchors" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."chapters"
     JOIN "public"."stories" ON (("stories"."id" = "chapters"."story_id")))
  WHERE (("chapters"."id" = "anchors"."chapter_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create chapters in own stories" ON "public"."chapters" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "chapters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create characters in own stories" ON "public"."characters" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "characters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create enhancements in own chapters" ON "public"."enhancements" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."chapters"
     JOIN "public"."stories" ON (("stories"."id" = "chapters"."story_id")))
  WHERE (("chapters"."id" = "enhancements"."chapter_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create own media" ON "public"."media" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own stories" ON "public"."stories" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own anchors" ON "public"."anchors" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."chapters"
     JOIN "public"."stories" ON (("stories"."id" = "chapters"."story_id")))
  WHERE (("chapters"."id" = "anchors"."chapter_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own chapters" ON "public"."chapters" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "chapters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own characters" ON "public"."characters" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "characters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own enhancements" ON "public"."enhancements" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."chapters"
     JOIN "public"."stories" ON (("stories"."id" = "chapters"."story_id")))
  WHERE (("chapters"."id" = "enhancements"."chapter_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own media" ON "public"."media" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own stories" ON "public"."stories" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage enhancement_characters for their stories" ON "public"."enhancement_characters" USING ((EXISTS ( SELECT 1
   FROM (("public"."enhancements" "e"
     JOIN "public"."chapters" "c" ON (("e"."chapter_id" = "c"."id")))
     JOIN "public"."stories" "s" ON (("c"."story_id" = "s"."id")))
  WHERE (("e"."id" = "enhancement_characters"."enhancement_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own anchors" ON "public"."anchors" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."chapters"
     JOIN "public"."stories" ON (("stories"."id" = "chapters"."story_id")))
  WHERE (("chapters"."id" = "anchors"."chapter_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own chapters" ON "public"."chapters" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "chapters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own characters" ON "public"."characters" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "characters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own enhancements" ON "public"."enhancements" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."chapters"
     JOIN "public"."stories" ON (("stories"."id" = "chapters"."story_id")))
  WHERE (("chapters"."id" = "enhancements"."chapter_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own media" ON "public"."media" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own stories" ON "public"."stories" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own anchors" ON "public"."anchors" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."chapters"
     JOIN "public"."stories" ON (("stories"."id" = "chapters"."story_id")))
  WHERE (("chapters"."id" = "anchors"."chapter_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own chapters" ON "public"."chapters" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "chapters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own characters" ON "public"."characters" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "characters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own enhancements" ON "public"."enhancements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."chapters"
     JOIN "public"."stories" ON (("stories"."id" = "chapters"."story_id")))
  WHERE (("chapters"."id" = "enhancements"."chapter_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own media" ON "public"."media" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own stories" ON "public"."stories" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."anchors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enhancement_characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enhancements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."delete_owned_media"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_owned_media"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_owned_media"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_storage_file_on_media_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_storage_file_on_media_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_storage_file_on_media_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."anchors" TO "anon";
GRANT ALL ON TABLE "public"."anchors" TO "authenticated";
GRANT ALL ON TABLE "public"."anchors" TO "service_role";



GRANT ALL ON TABLE "public"."chapters" TO "anon";
GRANT ALL ON TABLE "public"."chapters" TO "authenticated";
GRANT ALL ON TABLE "public"."chapters" TO "service_role";



GRANT ALL ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "authenticated";
GRANT ALL ON TABLE "public"."characters" TO "service_role";



GRANT ALL ON TABLE "public"."enhancement_characters" TO "anon";
GRANT ALL ON TABLE "public"."enhancement_characters" TO "authenticated";
GRANT ALL ON TABLE "public"."enhancement_characters" TO "service_role";



GRANT ALL ON TABLE "public"."enhancements" TO "anon";
GRANT ALL ON TABLE "public"."enhancements" TO "authenticated";
GRANT ALL ON TABLE "public"."enhancements" TO "service_role";



GRANT ALL ON TABLE "public"."media" TO "anon";
GRANT ALL ON TABLE "public"."media" TO "authenticated";
GRANT ALL ON TABLE "public"."media" TO "service_role";



GRANT ALL ON TABLE "public"."stories" TO "anon";
GRANT ALL ON TABLE "public"."stories" TO "authenticated";
GRANT ALL ON TABLE "public"."stories" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;

--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



CREATE POLICY "Authenticated users can read all files" ON "storage"."objects" FOR SELECT TO "authenticated" USING (("bucket_id" = 'enhancements'::"text"));



CREATE POLICY "Users can delete own folder files" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'enhancements'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Users can update own folder files" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'enhancements'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text"))) WITH CHECK ((("bucket_id" = 'enhancements'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Users can upload to own folder" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'enhancements'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



