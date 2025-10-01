/**
 * Upload Story Page
 * Simplified flow: Upload content → Add metadata → Create story (no auto-enhancement)
 */

import React, { useState, useCallback } from 'react';
import { EnhanceUpload } from '@/features/file-upload/components/EnhanceUpload';
import { FileUploadService } from '@/features/file-upload/services/file-upload.service';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

interface UploadStoryPageProps {
  onNavigateToStories?: () => void;
  onNavigate?: (route: { type: string; storyId?: string }) => void;
}

interface StoryMetadata {
  title: string;
  description: string;
  tags: string[];
}

type Step = 'upload' | 'metadata' | 'success';

export const UploadStoryPage: React.FC<UploadStoryPageProps> = ({
  onNavigateToStories,
  onNavigate
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedContent, setUploadedContent] = useState<string>('');
  const [suggestedTitle, setSuggestedTitle] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);

  // Metadata form state
  const [metadata, setMetadata] = useState<StoryMetadata>({
    title: '',
    description: '',
    tags: []
  });

  const handleTextSubmit = useCallback(async (text: string, title?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate text content
      const validation = FileUploadService.validateText(text);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      setUploadedContent(text);
      setSuggestedTitle(title || FileUploadService.generateTitleFromText(text));
      setCurrentStep('metadata');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process text');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileSubmit = useCallback(async (file: File, title?: string) => {
    if (!user) {
      setError('Please log in to upload files');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Upload and extract text from file
      const { url } = await FileUploadService.uploadFile(file, user.id);
      const extractedText = await FileUploadService.extractTextFromFile(url, file.name);

      // Validate extracted text
      const validation = FileUploadService.validateText(extractedText);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      setUploadedContent(extractedText);
      setSuggestedTitle(title || FileUploadService.generateTitleFromText(extractedText, 60));
      setCurrentStep('metadata');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  const splitTextIntoChapters = (text: string): Array<{ title: string; content: string }> => {
    // Simple chapter detection - look for "Chapter X:" patterns
    const chapterPattern = /^(Chapter\s+\d+[:\-.]?.*?)$/gim;
    const matches = [...text.matchAll(chapterPattern)];

    if (matches.length === 0) {
      // No chapter markers found, treat as single chapter
      return [{
        title: 'Chapter 1',
        content: text.trim()
      }];
    }

    const chapters: Array<{ title: string; content: string }> = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[0].trim();

      // Find content between this chapter and the next
      const startIndex = match.index! + match[0].length;
      const endIndex = matches[i + 1] ? matches[i + 1].index! : text.length;
      const content = text.slice(startIndex, endIndex).trim();

      if (content.length > 50) { // Only include substantial chapters
        chapters.push({
          title,
          content
        });
      }
    }

    return chapters;
  };

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
      // Split content into chapters
      const chapters = splitTextIntoChapters(uploadedContent);

      // Create the story record with basic metadata and draft status
      const storyData = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title: metadata.title.trim(),
        description: metadata.description.trim() || null,
        tags: metadata.tags,
        status: 'draft' as const,
        chapters: chapters.map((chapter, index) => ({
          id: crypto.randomUUID(),
          title: chapter.title,
          content: chapter.content,
          order_index: index,
          scenes: [], // No scenes initially - user will enhance later
          enhanced: false
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to unified stories table (using enhanced_copies for now)
      const { error: insertError } = await supabase
        .from('enhanced_copies')
        .insert([storyData]);

      if (insertError) {
        throw new Error(`Failed to create story: ${insertError.message}`);
      }

      setCreatedStoryId(storyData.id);
      setCurrentStep('success');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create story');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !metadata.tags.includes(tag.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const renderUploadStep = () => (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Upload Your Story</h1>
        <p className="text-lg text-muted-foreground">
          Get started by uploading your story content. You can enhance it with AI-generated images later.
        </p>
      </div>

      <EnhanceUpload
        onTextSubmit={handleTextSubmit}
        onFileSubmit={handleFileSubmit}
        isProcessing={isProcessing}
        maxFileSizeMB={FileUploadService.getMaxFileSizeMB()}
        supportedFormats={FileUploadService.getSupportedFormats()}
      />

      {error && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );

  const renderMetadataStep = () => (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Story Details</h1>
        <p className="text-lg text-muted-foreground">
          Add some details about your story to help organize your library.
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
            placeholder={suggestedTitle || "Enter your story title"}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            disabled={isProcessing}
          />
          {suggestedTitle && (
            <button
              type="button"
              onClick={() => setMetadata(prev => ({ ...prev, title: suggestedTitle }))}
              className="mt-2 text-sm text-primary hover:underline"
              disabled={isProcessing}
            >
              Use suggested title: "{suggestedTitle}"
            </button>
          )}
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
            placeholder="Brief description of your story..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            disabled={isProcessing}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tags (optional)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-primary/60 hover:text-primary"
                  disabled={isProcessing}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add tags (press Enter)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            disabled={isProcessing}
          />
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setCurrentStep('upload')}
          className="btn-ghost"
          disabled={isProcessing}
        >
          ← Back to Upload
        </button>
        <button
          onClick={handleCreateStory}
          disabled={isProcessing || !metadata.title.trim()}
          className="btn-primary"
        >
          {isProcessing ? 'Creating Story...' : 'Create Story'}
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
          Your story has been uploaded successfully. You can now edit chapters and enhance them with AI-generated images.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => {
            if (onNavigate && createdStoryId) {
              onNavigate({ type: 'story-editor', storyId: createdStoryId });
            }
          }}
          className="btn-primary"
        >
          Edit Story
        </button>
        <button
          onClick={() => {
            if (onNavigateToStories) {
              onNavigateToStories();
            } else if (onNavigate) {
              onNavigate({ type: 'stories' });
            }
          }}
          className="btn-ghost"
        >
          View My Stories
        </button>
        <button
          onClick={() => {
            setCurrentStep('upload');
            setUploadedContent('');
            setSuggestedTitle('');
            setMetadata({ title: '', description: '', tags: [] });
            setError(null);
            setCreatedStoryId(null);
          }}
          className="btn-ghost"
        >
          Upload Another Story
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'metadata' && renderMetadataStep()}
      {currentStep === 'success' && renderSuccessStep()}
    </div>
  );
};

export default UploadStoryPage;