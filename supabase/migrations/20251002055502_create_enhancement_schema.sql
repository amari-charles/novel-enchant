-- =====================================================
-- Enhancement Engine Database Schema
-- Created: 2025-10-02
-- Purpose: Complete schema for Novel Enchant's AI-powered story enhancement system
-- =====================================================

-- =====================================================
-- PART 1: CREATE TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table: users
-- Purpose: Extended user metadata beyond Supabase auth.users
-- -----------------------------------------------------
CREATE TABLE users (
  -- Primary key that links to Supabase Auth
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User's display name for the application
  display_name text,

  -- URL to user's avatar/profile picture
  avatar_url text,

  -- JSON object storing user preferences and settings (theme, notifications, etc.)
  preferences jsonb NOT NULL DEFAULT '{}',

  -- Timestamp when user record was created
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Timestamp when user record was last updated (auto-updated by trigger)
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Extended user profile data and preferences. Links to auth.users for authentication.';
COMMENT ON COLUMN users.id IS 'User ID that matches auth.users.id. Primary key and foreign key.';
COMMENT ON COLUMN users.display_name IS 'User-facing display name. Can be different from email.';
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture in storage or external service.';
COMMENT ON COLUMN users.preferences IS 'JSON object for user settings: theme, notifications, default style preferences, etc.';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp. Set automatically on insert.';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp. Auto-updated by trigger on any change.';

-- -----------------------------------------------------
-- Table: stories
-- Purpose: Top-level containers for novels/books
-- -----------------------------------------------------
CREATE TABLE stories (
  -- Unique identifier for the story
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner of the story (links to users table)
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Story title
  title text NOT NULL,

  -- Optional story description or synopsis
  description text,

  -- JSON object storing default style preferences for AI generation (art style, mood, etc.)
  style_preferences jsonb,

  -- Timestamp when story was created
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Timestamp when story was last updated (auto-updated by trigger)
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE stories IS 'Top-level story/book containers. Each story belongs to one user and contains multiple chapters.';
COMMENT ON COLUMN stories.id IS 'Unique story identifier. Auto-generated UUID.';
COMMENT ON COLUMN stories.user_id IS 'Story owner. Foreign key to users table. Cascade deletes story when user is deleted.';
COMMENT ON COLUMN stories.title IS 'Story title. Required field.';
COMMENT ON COLUMN stories.description IS 'Optional story description, synopsis, or author notes.';
COMMENT ON COLUMN stories.style_preferences IS 'Default AI generation preferences: art style, mood, color palette, etc. Inherited by chapters unless overridden.';
COMMENT ON COLUMN stories.created_at IS 'Story creation timestamp. Set automatically.';
COMMENT ON COLUMN stories.updated_at IS 'Last modification timestamp. Auto-updated by trigger.';

-- -----------------------------------------------------
-- Table: chapters
-- Purpose: Individual chapters within a story
-- -----------------------------------------------------
CREATE TABLE chapters (
  -- Unique identifier for the chapter
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent story (links to stories table)
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

  -- Chapter title (optional, e.g., "Chapter 1: The Beginning")
  title text,

  -- The actual chapter text content
  text_content text NOT NULL,

  -- Order of chapter within story (0-indexed, allows reordering)
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),

  -- Timestamp when chapter was created
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Timestamp when chapter was last updated (auto-updated by trigger)
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE chapters IS 'Individual chapters within a story. Contains the actual text content and ordering.';
COMMENT ON COLUMN chapters.id IS 'Unique chapter identifier. Auto-generated UUID.';
COMMENT ON COLUMN chapters.story_id IS 'Parent story. Foreign key to stories table. Cascade deletes chapter when story is deleted.';
COMMENT ON COLUMN chapters.title IS 'Optional chapter title. Can be null for untitled chapters.';
COMMENT ON COLUMN chapters.text_content IS 'The full text content of the chapter. Required field.';
COMMENT ON COLUMN chapters.order_index IS 'Zero-based position within story. Used for sorting chapters. Must be >= 0.';
COMMENT ON COLUMN chapters.created_at IS 'Chapter creation timestamp. Set automatically.';
COMMENT ON COLUMN chapters.updated_at IS 'Last modification timestamp. Auto-updated by trigger.';

-- -----------------------------------------------------
-- Table: anchors
-- Purpose: Precise positions in chapter text where enhancements are placed
-- -----------------------------------------------------
CREATE TABLE anchors (
  -- Unique identifier for the anchor
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent chapter (links to chapters table)
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,

  -- Character position in chapter text where enhancement is inserted
  position integer NOT NULL CHECK (position >= 0),

  -- Currently active/displayed enhancement at this position (added after enhancements table created)
  active_enhancement_id uuid,

  -- Timestamp when anchor was created
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Timestamp when anchor was last updated (auto-updated by trigger)
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE anchors IS 'Position markers in chapter text where enhancements (images, animations, audio) are placed. Anchors are stable even if text is edited.';
COMMENT ON COLUMN anchors.id IS 'Unique anchor identifier. Auto-generated UUID.';
COMMENT ON COLUMN anchors.chapter_id IS 'Parent chapter. Foreign key to chapters table. Cascade deletes anchor when chapter is deleted.';
COMMENT ON COLUMN anchors.position IS 'Character offset in chapter text where enhancement appears. Must be >= 0. Position 0 = start of chapter.';
COMMENT ON COLUMN anchors.active_enhancement_id IS 'Currently displayed enhancement. Foreign key to enhancements table (added later). Null if no enhancement selected. Set null if enhancement deleted.';
COMMENT ON COLUMN anchors.created_at IS 'Anchor creation timestamp. Set automatically.';
COMMENT ON COLUMN anchors.updated_at IS 'Last modification timestamp. Auto-updated by trigger.';

-- -----------------------------------------------------
-- Table: media
-- Purpose: Physical file storage for images, audio, and video files
-- -----------------------------------------------------
CREATE TABLE media (
  -- Unique identifier for the media file
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who owns/uploaded this media
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Full public URL to access the file
  url text NOT NULL,

  -- Storage path in Supabase Storage bucket
  storage_path text NOT NULL,

  -- Type of media file (image, audio, or video)
  media_type text NOT NULL CHECK (media_type IN ('image', 'audio', 'video')),

  -- File size in bytes
  file_size bigint,

  -- MIME type (e.g., 'image/png', 'audio/mp3', 'video/mp4')
  mime_type text,

  -- Image/video width in pixels (null for audio)
  width integer,

  -- Image/video height in pixels (null for audio)
  height integer,

  -- Audio/video duration in seconds (null for images)
  duration integer,

  -- Additional metadata: compression settings, color profile, bitrate, etc.
  metadata jsonb NOT NULL DEFAULT '{}',

  -- Timestamp when media was uploaded/created
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Timestamp when media record was last updated (auto-updated by trigger)
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE media IS 'Physical file storage for all media types. Separates file metadata from enhancement context. Supports AI-generated and user-uploaded files.';
COMMENT ON COLUMN media.id IS 'Unique media identifier. Auto-generated UUID. Used as filename in storage.';
COMMENT ON COLUMN media.user_id IS 'Media owner. Foreign key to users table. Cascade deletes media when user is deleted.';
COMMENT ON COLUMN media.url IS 'Full public URL to access the file. Generated from storage bucket + path.';
COMMENT ON COLUMN media.storage_path IS 'Path in Supabase Storage bucket. Format: {user_id}/{story_id}/{media_id}.{ext}';
COMMENT ON COLUMN media.media_type IS 'Type of media. Must be "image", "audio", or "video". Determines which dimension fields are applicable.';
COMMENT ON COLUMN media.file_size IS 'File size in bytes. Used for storage quota tracking and UI display.';
COMMENT ON COLUMN media.mime_type IS 'MIME type of file (e.g., "image/png", "audio/mpeg"). Used for proper content serving.';
COMMENT ON COLUMN media.width IS 'Width in pixels for images/videos. Null for audio files.';
COMMENT ON COLUMN media.height IS 'Height in pixels for images/videos. Null for audio files.';
COMMENT ON COLUMN media.duration IS 'Duration in seconds for audio/video files. Null for images.';
COMMENT ON COLUMN media.metadata IS 'Additional file metadata: compression, color profile, bitrate, source info, etc.';
COMMENT ON COLUMN media.created_at IS 'Upload/creation timestamp. Set automatically.';
COMMENT ON COLUMN media.updated_at IS 'Last modification timestamp. Auto-updated by trigger.';

-- -----------------------------------------------------
-- Table: enhancements
-- Purpose: Enhancement instances that link media/animations to story positions
-- -----------------------------------------------------
CREATE TABLE enhancements (
  -- Unique identifier for the enhancement
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Anchor position where this enhancement is placed
  anchor_id uuid NOT NULL REFERENCES anchors(id) ON DELETE CASCADE,

  -- Parent chapter (denormalized for fast queries)
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,

  -- Type of enhancement (AI image, user image, audio, animation)
  enhancement_type text NOT NULL CHECK (enhancement_type IN ('ai_image', 'user_image', 'audio', 'animation')),

  -- Media file (null for animations which have no file)
  media_id uuid REFERENCES media(id) ON DELETE CASCADE,

  -- Generation status (for AI-generated enhancements)
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),

  -- Random seed for reproducible AI generation
  seed text,

  -- Enhancement configuration: animation params, style overrides, generation settings
  config jsonb NOT NULL DEFAULT '{}',

  -- Additional metadata: provider info, generation params, quality scores, error messages
  metadata jsonb NOT NULL DEFAULT '{}',

  -- Timestamp when enhancement was created
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Timestamp when enhancement was last updated (auto-updated by trigger)
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: animations don't need media, but other types do
  CONSTRAINT media_required_for_non_animation CHECK (
    (enhancement_type = 'animation' AND media_id IS NULL) OR
    (enhancement_type != 'animation' AND media_id IS NOT NULL)
  )
);

COMMENT ON TABLE enhancements IS 'Enhancement instances placed in stories. Links media files or animations to specific story positions. Tracks generation status and settings.';
COMMENT ON COLUMN enhancements.id IS 'Unique enhancement identifier. Auto-generated UUID.';
COMMENT ON COLUMN enhancements.anchor_id IS 'Position where enhancement appears. Foreign key to anchors table. Cascade deletes enhancement when anchor is deleted.';
COMMENT ON COLUMN enhancements.chapter_id IS 'Parent chapter. Denormalized from anchor for fast queries. Cascade deletes enhancement when chapter is deleted.';
COMMENT ON COLUMN enhancements.enhancement_type IS 'Type of enhancement. "ai_image" = AI-generated image, "user_image" = uploaded image, "audio" = sound/narration, "animation" = text animation.';
COMMENT ON COLUMN enhancements.media_id IS 'Media file reference. Foreign key to media table. NULL for animations (which have no file). Required for image/audio types.';
COMMENT ON COLUMN enhancements.status IS 'Generation status. "generating" = AI is creating, "completed" = ready, "failed" = error occurred. Only relevant for AI-generated content.';
COMMENT ON COLUMN enhancements.seed IS 'Random seed for reproducible AI generation. Same seed + prompt = same image. Null for user uploads.';
COMMENT ON COLUMN enhancements.config IS 'Enhancement-specific settings. For animations: type, duration, easing. For images: style overrides. For audio: volume, loop settings.';
COMMENT ON COLUMN enhancements.metadata IS 'Additional data: AI provider info, generation parameters, quality scores, retry count, error messages, user feedback.';
COMMENT ON COLUMN enhancements.created_at IS 'Enhancement creation timestamp. Set automatically.';
COMMENT ON COLUMN enhancements.updated_at IS 'Last modification timestamp. Auto-updated by trigger.';

-- -----------------------------------------------------
-- Table: characters
-- Purpose: Character registry for tracking and maintaining visual consistency
-- -----------------------------------------------------
CREATE TABLE characters (
  -- Unique identifier for the character
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent story (links to stories table)
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

  -- Character's name (null if not yet determined)
  name text,

  -- Brief physical description for AI image generation
  short_desc text,

  -- Alternative names, nicknames, titles that refer to this character
  aliases text[] NOT NULL DEFAULT '{}',

  -- Character status in the registry
  status text NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'confirmed', 'ignored', 'merged')),

  -- AI confidence score for character detection (0.0 to 1.0)
  confidence numeric NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),

  -- If merged, points to the main character this was merged into
  merged_into_id uuid REFERENCES characters(id) ON DELETE SET NULL,

  -- Timestamp when character was detected/created
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Timestamp when character was last updated (auto-updated by trigger)
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE characters IS 'Character registry for maintaining visual consistency across AI-generated images. Tracks character names, descriptions, and merge history.';
COMMENT ON COLUMN characters.id IS 'Unique character identifier. Auto-generated UUID.';
COMMENT ON COLUMN characters.story_id IS 'Parent story. Foreign key to stories table. Cascade deletes character when story is deleted.';
COMMENT ON COLUMN characters.name IS 'Character name. Can be null if character detected but name not yet determined.';
COMMENT ON COLUMN characters.short_desc IS 'Brief physical description used in AI prompts to maintain visual consistency (e.g., "tall woman with red hair and green eyes").';
COMMENT ON COLUMN characters.aliases IS 'Array of alternative names: nicknames, titles, name variations. Used to match character references in text.';
COMMENT ON COLUMN characters.status IS 'Registry status. "candidate" = AI detected but not confirmed, "confirmed" = user verified, "ignored" = not a real character, "merged" = duplicate merged into another character.';
COMMENT ON COLUMN characters.confidence IS 'AI confidence score for character detection. Range 0.0-1.0. Higher = more confident this is a real character.';
COMMENT ON COLUMN characters.merged_into_id IS 'If status is "merged", points to the main character this was merged into. Null otherwise.';
COMMENT ON COLUMN characters.created_at IS 'Character detection/creation timestamp. Set automatically.';
COMMENT ON COLUMN characters.updated_at IS 'Last modification timestamp. Auto-updated by trigger.';

-- =====================================================
-- PART 2: FOREIGN KEY CONSTRAINTS (DEFERRED)
-- =====================================================
-- Add foreign key constraints that have circular dependencies

-- Add foreign key from anchors to enhancements (circular dependency resolved)
ALTER TABLE anchors
  ADD CONSTRAINT fk_anchors_active_enhancement
  FOREIGN KEY (active_enhancement_id)
  REFERENCES enhancements(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_anchors_active_enhancement ON anchors IS 'Foreign key to currently active enhancement. Added after enhancements table created to resolve circular dependency.';

-- =====================================================
-- PART 3: INDEXES
-- =====================================================
-- Indexes for foreign keys and common query patterns

-- Stories indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
COMMENT ON INDEX idx_stories_user_id IS 'Fast lookup of all stories by user';

-- Chapters indexes
CREATE INDEX idx_chapters_story_id_order ON chapters(story_id, order_index);
COMMENT ON INDEX idx_chapters_story_id_order IS 'Fast ordered retrieval of chapters within a story';

-- Anchors indexes
CREATE INDEX idx_anchors_chapter_id_position ON anchors(chapter_id, position);
COMMENT ON INDEX idx_anchors_chapter_id_position IS 'Fast ordered retrieval of anchors within a chapter';

CREATE INDEX idx_anchors_active_enhancement ON anchors(active_enhancement_id);
COMMENT ON INDEX idx_anchors_active_enhancement IS 'Fast lookup of anchors by active enhancement (for joins)';

-- Media indexes
CREATE INDEX idx_media_user_id ON media(user_id);
COMMENT ON INDEX idx_media_user_id IS 'Fast lookup of all media by user (for quota/management)';

CREATE INDEX idx_media_type ON media(media_type);
COMMENT ON INDEX idx_media_type IS 'Fast filtering by media type (images, audio, video)';

-- Enhancements indexes
CREATE INDEX idx_enhancements_anchor_id ON enhancements(anchor_id);
COMMENT ON INDEX idx_enhancements_anchor_id IS 'Fast lookup of all enhancements for an anchor';

CREATE INDEX idx_enhancements_chapter_id ON enhancements(chapter_id);
COMMENT ON INDEX idx_enhancements_chapter_id IS 'Fast lookup of all enhancements in a chapter';

CREATE INDEX idx_enhancements_media_id ON enhancements(media_id);
COMMENT ON INDEX idx_enhancements_media_id IS 'Fast lookup of enhancements using specific media';

CREATE INDEX idx_enhancements_status ON enhancements(status);
COMMENT ON INDEX idx_enhancements_status IS 'Fast filtering by generation status (for polling in-progress generations)';

CREATE INDEX idx_enhancements_type ON enhancements(enhancement_type);
COMMENT ON INDEX idx_enhancements_type IS 'Fast filtering by enhancement type';

-- Characters indexes
CREATE INDEX idx_characters_story_id ON characters(story_id);
COMMENT ON INDEX idx_characters_story_id IS 'Fast lookup of all characters in a story';

CREATE INDEX idx_characters_status ON characters(status);
COMMENT ON INDEX idx_characters_status IS 'Fast filtering by character status (candidate, confirmed, etc.)';

CREATE INDEX idx_characters_merged_into ON characters(merged_into_id);
COMMENT ON INDEX idx_characters_merged_into IS 'Fast lookup of characters merged into a specific character';

-- =====================================================
-- PART 4: TRIGGERS
-- =====================================================
-- Automatic updated_at timestamp updates

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Trigger function that automatically updates the updated_at column to current timestamp on row updates';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anchors_updated_at BEFORE UPDATE ON anchors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhancements_updated_at BEFORE UPDATE ON enhancements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 5: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables and create user ownership policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancements ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Stories table policies
CREATE POLICY "Users can view own stories"
  ON stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- Chapters table policies
CREATE POLICY "Users can view own chapters"
  ON chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = chapters.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chapters in own stories"
  ON chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = chapters.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own chapters"
  ON chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = chapters.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own chapters"
  ON chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = chapters.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- Anchors table policies
CREATE POLICY "Users can view own anchors"
  ON anchors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN stories ON stories.id = chapters.story_id
      WHERE chapters.id = anchors.chapter_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create anchors in own chapters"
  ON anchors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN stories ON stories.id = chapters.story_id
      WHERE chapters.id = anchors.chapter_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own anchors"
  ON anchors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN stories ON stories.id = chapters.story_id
      WHERE chapters.id = anchors.chapter_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own anchors"
  ON anchors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN stories ON stories.id = chapters.story_id
      WHERE chapters.id = anchors.chapter_id
      AND stories.user_id = auth.uid()
    )
  );

-- Media table policies
CREATE POLICY "Users can view own media"
  ON media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own media"
  ON media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON media FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON media FOR DELETE
  USING (auth.uid() = user_id);

-- Enhancements table policies
CREATE POLICY "Users can view own enhancements"
  ON enhancements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN stories ON stories.id = chapters.story_id
      WHERE chapters.id = enhancements.chapter_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create enhancements in own chapters"
  ON enhancements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN stories ON stories.id = chapters.story_id
      WHERE chapters.id = enhancements.chapter_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own enhancements"
  ON enhancements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN stories ON stories.id = chapters.story_id
      WHERE chapters.id = enhancements.chapter_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own enhancements"
  ON enhancements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN stories ON stories.id = chapters.story_id
      WHERE chapters.id = enhancements.chapter_id
      AND stories.user_id = auth.uid()
    )
  );

-- Characters table policies
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = characters.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create characters in own stories"
  ON characters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = characters.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = characters.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = characters.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- =====================================================
-- SCHEMA DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA public IS 'Enhancement Engine Schema: Complete database structure for Novel Enchant AI-powered story enhancement system. Supports images, audio, animations, and character consistency tracking.';
