-- Novel Enchant Database Schema
-- Comprehensive schema for AI-powered story visualization

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
    generation_credits INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories - container for user's novels/fanfiction
CREATE TABLE public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    style_preset TEXT DEFAULT 'fantasy' CHECK (style_preset IN ('fantasy', 'scifi', 'romance', 'thriller', 'historical', 'contemporary')),
    custom_style_prompt TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'processing')),
    total_chapters INTEGER DEFAULT 0,
    total_scenes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapters - text content within stories
CREATE TABLE public.chapters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER GENERATED ALWAYS AS (array_length(string_to_array(trim(content), ' '), 1)) STORED,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    scenes_extracted BOOLEAN DEFAULT FALSE,
    raw_content_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, chapter_number)
);

-- Scenes - AI-extracted visual moments from chapters
CREATE TABLE public.scenes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
    scene_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    excerpt TEXT, -- Key dialogue or narrative snippet
    emotional_tone TEXT CHECK (emotional_tone IN ('happy', 'sad', 'tense', 'romantic', 'action', 'mysterious', 'peaceful')),
    time_of_day TEXT CHECK (time_of_day IN ('dawn', 'morning', 'afternoon', 'evening', 'night', 'unknown')),
    weather TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chapter_id, scene_number)
);

-- ============================================================================
-- CHARACTER & LOCATION TRACKING
-- ============================================================================

-- Characters - persistent entities across the story
CREATE TABLE public.characters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    aliases TEXT[], -- Alternative names, nicknames
    base_description TEXT NOT NULL,
    personality_traits TEXT[],
    role TEXT CHECK (role IN ('protagonist', 'antagonist', 'supporting', 'minor')),
    first_appearance_chapter INTEGER,
    primary_reference_image_id UUID, -- Will reference character_reference_images
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, name)
);

-- Character reference images for IP-Adapter consistency
CREATE TABLE public.character_reference_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    source_type TEXT DEFAULT 'generated' CHECK (source_type IN ('generated', 'uploaded', 'ai_generated')),
    is_primary BOOLEAN DEFAULT FALSE,
    description TEXT,
    generation_prompt TEXT, -- If AI-generated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character states - how characters look at different story points
CREATE TABLE public.character_states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
    chapter_number INTEGER NOT NULL,
    appearance_description TEXT NOT NULL,
    clothing_description TEXT,
    emotional_state TEXT,
    injuries_or_changes TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(character_id, chapter_number)
);

-- Locations - persistent places in the story
CREATE TABLE public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('indoor', 'outdoor', 'city', 'building', 'natural', 'fantasy', 'vehicle')),
    base_description TEXT NOT NULL,
    atmosphere TEXT,
    first_appearance_chapter INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, name)
);

-- Location states - how locations look at different story points
CREATE TABLE public.location_states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
    chapter_number INTEGER NOT NULL,
    visual_description TEXT NOT NULL,
    lighting_conditions TEXT,
    weather TEXT,
    time_of_day TEXT,
    seasonal_changes TEXT,
    damage_or_changes TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location_id, chapter_number)
);

-- ============================================================================
-- MANY-TO-MANY RELATIONSHIPS
-- ============================================================================

-- Scene-Character relationships
CREATE TABLE public.scene_characters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
    importance TEXT DEFAULT 'main' CHECK (importance IN ('main', 'secondary', 'background')),
    emotional_state TEXT,
    specific_appearance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(scene_id, character_id)
);

-- Scene-Location relationships
CREATE TABLE public.scene_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
    prominence TEXT DEFAULT 'primary' CHECK (prominence IN ('primary', 'secondary', 'background')),
    specific_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(scene_id, location_id)
);

-- ============================================================================
-- IMAGE GENERATION PIPELINE
-- ============================================================================

-- Prompts - structured prompts for image generation
CREATE TABLE public.prompts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
    version INTEGER DEFAULT 1,
    prompt_text TEXT NOT NULL,
    negative_prompt TEXT,
    style_modifiers TEXT[],
    character_references UUID[], -- Array of character IDs
    location_references UUID[], -- Array of location IDs
    technical_parameters JSONB, -- SDXL parameters (steps, CFG, etc.)
    generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'queued', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt retries - alternative prompts for regeneration
CREATE TABLE public.prompt_retries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    original_prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
    retry_reason TEXT, -- "user_requested", "failed_generation", "style_adjustment"
    modified_prompt_text TEXT NOT NULL,
    modifications_made TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images - final generated outputs
CREATE TABLE public.images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    generation_seed BIGINT,
    generation_parameters JSONB,
    quality_score DECIMAL(3,2), -- AI-assessed quality (0.00-1.00)
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    is_selected BOOLEAN DEFAULT FALSE, -- Primary image for this scene
    storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 's3', 'cloudinary')),
    file_size INTEGER,
    dimensions JSONB, -- {width: number, height: number}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROCESSING JOBS & METADATA
-- ============================================================================

-- Processing jobs for async operations
CREATE TABLE public.processing_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_type TEXT NOT NULL CHECK (job_type IN ('extract_scenes', 'extract_entities', 'generate_prompts', 'generate_images')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('chapter', 'scene', 'character', 'location')),
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    metadata JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    default_style_preset TEXT DEFAULT 'fantasy',
    auto_delete_raw_text BOOLEAN DEFAULT FALSE,
    image_quality_preference TEXT DEFAULT 'balanced' CHECK (image_quality_preference IN ('fast', 'balanced', 'high_quality')),
    notification_preferences JSONB DEFAULT '{"email": true, "in_app": true}',
    privacy_settings JSONB DEFAULT '{"public_profile": false, "share_analytics": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STORAGE BUCKETS (Supabase)
-- ============================================================================

-- These are created via Supabase dashboard or CLI, but documented here:
-- 
-- BUCKET: character-references
-- - Character reference images for IP-Adapter
-- - Public read, authenticated write
--
-- BUCKET: generated-images  
-- - AI-generated scene images
-- - Public read, authenticated write
--
-- BUCKET: story-covers
-- - User-uploaded story cover images
-- - Public read, authenticated write

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User and story access patterns
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_status ON public.stories(status) WHERE status != 'active';
CREATE INDEX idx_chapters_story_id ON public.chapters(story_id);
CREATE INDEX idx_chapters_status ON public.chapters(processing_status) WHERE processing_status != 'completed';

-- Scene and entity relationships  
CREATE INDEX idx_scenes_chapter_id ON public.scenes(chapter_id);
CREATE INDEX idx_scene_characters_scene_id ON public.scene_characters(scene_id);
CREATE INDEX idx_scene_characters_character_id ON public.scene_characters(character_id);
CREATE INDEX idx_scene_locations_scene_id ON public.scene_locations(scene_id);

-- Character and location tracking
CREATE INDEX idx_characters_story_id ON public.characters(story_id);
CREATE INDEX idx_character_states_character_chapter ON public.character_states(character_id, chapter_number);
CREATE INDEX idx_locations_story_id ON public.locations(story_id);
CREATE INDEX idx_location_states_location_chapter ON public.location_states(location_id, chapter_number);

-- Image generation pipeline
CREATE INDEX idx_prompts_scene_id ON public.prompts(scene_id);
CREATE INDEX idx_prompts_status ON public.prompts(generation_status) WHERE generation_status != 'completed';
CREATE INDEX idx_images_scene_id ON public.images(scene_id);
CREATE INDEX idx_images_selected ON public.images(scene_id, is_selected) WHERE is_selected = true;

-- Processing jobs
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status, priority, created_at) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_processing_jobs_user_id ON public.processing_jobs(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_reference_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_retries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Stories access
CREATE POLICY "Users can view own stories or public stories" ON public.stories 
    FOR SELECT USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "Users can insert own stories" ON public.stories 
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own stories" ON public.stories 
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own stories" ON public.stories 
    FOR DELETE USING (user_id = auth.uid());

-- Chapters access (inherit from stories)
CREATE POLICY "Users can access chapters of accessible stories" ON public.chapters 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stories 
            WHERE stories.id = chapters.story_id 
            AND (stories.user_id = auth.uid() OR stories.is_public = true)
        )
    );
CREATE POLICY "Users can modify chapters of own stories" ON public.chapters 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stories 
            WHERE stories.id = chapters.story_id 
            AND stories.user_id = auth.uid()
        )
    );

-- Similar policies for all other tables - inherit permissions from parent story
-- (Additional policies would follow the same pattern for scenes, characters, etc.)

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get latest character state for a given chapter
CREATE OR REPLACE FUNCTION get_latest_character_state(
    p_character_id UUID,
    p_chapter_number INTEGER
) RETURNS public.character_states AS $$
DECLARE
    result public.character_states;
BEGIN
    SELECT * INTO result
    FROM public.character_states
    WHERE character_id = p_character_id
    AND chapter_number <= p_chapter_number
    ORDER BY chapter_number DESC
    LIMIT 1;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest location state for a given chapter  
CREATE OR REPLACE FUNCTION get_latest_location_state(
    p_location_id UUID,
    p_chapter_number INTEGER
) RETURNS public.location_states AS $$
DECLARE
    result public.location_states;
BEGIN
    SELECT * INTO result
    FROM public.location_states
    WHERE location_id = p_location_id
    AND chapter_number <= p_chapter_number
    ORDER BY chapter_number DESC
    LIMIT 1;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update story statistics
CREATE OR REPLACE FUNCTION update_story_stats(p_story_id UUID) RETURNS VOID AS $$
BEGIN
    UPDATE public.stories
    SET 
        total_chapters = (
            SELECT COUNT(*) FROM public.chapters 
            WHERE story_id = p_story_id
        ),
        total_scenes = (
            SELECT COUNT(*) FROM public.scenes s
            JOIN public.chapters c ON s.chapter_id = c.id
            WHERE c.story_id = p_story_id
        ),
        updated_at = NOW()
    WHERE id = p_story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update story stats
CREATE OR REPLACE FUNCTION trigger_update_story_stats() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM update_story_stats(NEW.story_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_story_stats(OLD.story_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chapters_update_story_stats
    AFTER INSERT OR DELETE ON public.chapters
    FOR EACH ROW EXECUTE FUNCTION trigger_update_story_stats();

-- ============================================================================
-- INITIAL DATA & CONSTRAINTS
-- ============================================================================

-- Add foreign key constraint for character primary reference image
ALTER TABLE public.characters 
ADD CONSTRAINT fk_characters_primary_reference 
FOREIGN KEY (primary_reference_image_id) 
REFERENCES public.character_reference_images(id) 
ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

-- Create updated_at triggers for relevant tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON public.scenes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON public.characters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON public.prompts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON public.images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();