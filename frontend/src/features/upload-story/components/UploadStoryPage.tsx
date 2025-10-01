/**
 * Upload Story Page
 * Simplified flow: Create story with metadata → Add chapters later in editor
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

interface UploadStoryPageProps {
  onNavigateToStories?: () => void;
  onNavigate?: (route: { type: string; storyId?: string }) => void;
}

interface StoryMetadata {
  title: string;
  description: string;
  author: string;
}

type Step = 'create' | 'success';

export const UploadStoryPage: React.FC<UploadStoryPageProps> = ({
  onNavigateToStories,
  onNavigate
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('create');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);

  // Metadata form state
  const [metadata, setMetadata] = useState<StoryMetadata>({
    title: '',
    description: '',
    author: ''
  });

  const handleCreateStory = async () => {
    if (!user) {
      setError('Please log in to create stories');
      return;
    }

    if (!metadata.title.trim()) {
      setError('Please enter a title for your story');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create the story record with metadata stored in enhanced_content field
      const storyData = {
        user_id: user.id,
        title: metadata.title.trim(),
        enhanced_content: {
          author: metadata.author.trim() || null,
          description: metadata.description.trim() || null,
          chapters: [] // Empty - user will add chapters in the editor
        },
        original_content: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to chapters table
      const { data, error: insertError } = await supabase
        .from('chapters')
        .insert([storyData])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create story: ${insertError.message}`);
      }

      setCreatedStoryId(data.id);
      setCurrentStep('success');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create story');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCreateStep = () => (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Create New Story</h1>
        <p className="text-lg text-muted-foreground">
          Add your story details. You'll add chapters and enhance them later.
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={metadata.title}
            onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter your story title"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            disabled={isProcessing}
            maxLength={255}
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {metadata.title.length}/255 characters
          </p>
        </div>

        {/* Author */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-foreground mb-2">
            Author (optional)
          </label>
          <input
            id="author"
            type="text"
            value={metadata.author}
            onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
            placeholder="Author name"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            disabled={isProcessing}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={metadata.description}
            onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description or blurb..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            disabled={isProcessing}
            maxLength={2000}
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {metadata.description.length}/2000 characters
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-4 mt-8">
        <button
          onClick={() => {
            if (onNavigateToStories) {
              onNavigateToStories();
            } else if (onNavigate) {
              onNavigate({ type: 'stories' });
            }
          }}
          className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-secondary"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          onClick={handleCreateStory}
          disabled={isProcessing || !metadata.title.trim()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isProcessing ? 'Creating...' : 'Create Story'}
        </button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="max-w-2xl mx-auto px-6 py-8 text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Story Created!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your story has been created successfully. You can now add chapters and enhance them with AI-generated images.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => {
            if (onNavigate && createdStoryId) {
              onNavigate({ type: 'story-editor', storyId: createdStoryId });
            }
          }}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Chapters
        </button>
        <button
          onClick={() => {
            if (onNavigateToStories) {
              onNavigateToStories();
            } else if (onNavigate) {
              onNavigate({ type: 'stories' });
            }
          }}
          className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-secondary"
        >
          View My Stories
        </button>
        <button
          onClick={() => {
            setCurrentStep('create');
            setMetadata({ title: '', description: '', author: '' });
            setError(null);
            setCreatedStoryId(null);
          }}
          className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-secondary"
        >
          Create Another Story
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'create' && renderCreateStep()}
      {currentStep === 'success' && renderSuccessStep()}
    </div>
  );
};

export default UploadStoryPage;