/**
 * Reader Enhance Page
 * Main page component that orchestrates the enhancement flow
 */

import React, { useState, useCallback } from 'react';
import { EnhanceUpload } from '@/features/file-upload/components/EnhanceUpload';
import { useEnhanceProgress } from '../hooks/useEnhanceProgress';
import type { CreateEnhancementRequest } from '../types';

interface EnhancePageProps {
  onNavigateToShelf?: () => void;
}

export const EnhancePage: React.FC<EnhancePageProps> = ({ onNavigateToShelf }) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'complete'>('upload');

  const {
    job,
    isLoading,
    error,
    startEnhancement,
    saveToShelf,
    stopPolling,
  } = useEnhanceProgress({
    onComplete: async (job) => {
      // Auto-save to shelf when enhancement completes
      console.log('Enhancement complete! Auto-saving to shelf...', job);
      try {
        const copyId = await saveToShelf(undefined, job);
        console.log('Successfully saved to shelf with ID:', copyId);
        setCurrentStep('complete');
      } catch (error) {
        console.error('Failed to auto-save to shelf:', error);
      }
    },
    onError: (error) => {
      console.error('Enhancement error:', error);
    },
  });

  const handleTextSubmit = useCallback(async (text: string, title?: string) => {
    try {
      setCurrentStep('processing');
      const request: CreateEnhancementRequest = {
        source: 'paste',
        text,
        title,
      };

      await startEnhancement(request);
    } catch (error) {
      console.error('Failed to start enhancement:', error);
      setCurrentStep('upload');
    }
  }, [startEnhancement]);

  const handleFileSubmit = useCallback(async (file: File, title?: string) => {
    try {
      setCurrentStep('processing');

      // For now, we'll extract text from the file synchronously
      // In a real implementation, this would be handled by the file upload service
      const text = await file.text();

      const request: CreateEnhancementRequest = {
        source: 'file',
        text,
        title,
        fileId: `file-${Date.now()}`, // Mock file ID
      };

      await startEnhancement(request);
    } catch (error) {
      console.error('Failed to start file enhancement:', error);
      setCurrentStep('upload');
    }
  }, [startEnhancement]);

  const handleStartOver = useCallback(() => {
    stopPolling();
    setCurrentStep('upload');
  }, [stopPolling]);

  const getProgress = () => {
    if (!job) return 0;
    return job.progress;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      {currentStep === 'processing' && (
        <div className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">
                Processing Your Story
              </h2>
              <span className="text-sm text-muted-foreground">
                {getProgress()}% Complete
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 m-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-destructive">
                <strong>Error:</strong> {error.message}
              </p>
              <button
                onClick={handleStartOver}
                className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {currentStep === 'upload' && (
          <EnhanceUpload
            onTextSubmit={handleTextSubmit}
            onFileSubmit={handleFileSubmit}
            isProcessing={isLoading}
          />
        )}

        {currentStep === 'processing' && job && (
          <div className="p-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Processing "{job.title}"
                </h2>

                <p className="text-muted-foreground mb-6">
                  We're analyzing your story and generating beautiful images for each scene.
                  Once complete, it will be automatically saved to your shelf.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-6">
                    <div className={`flex items-center space-x-2 ${job.progress >= 20 ? 'text-success' : 'text-muted-foreground'}`}>
                      <div className={`w-2 h-2 rounded-full ${job.progress >= 20 ? 'bg-success' : 'bg-muted'}`} />
                      <span className="text-sm">Extracting scenes</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${job.progress >= 60 ? 'text-success' : 'text-muted-foreground'}`}>
                      <div className={`w-2 h-2 rounded-full ${job.progress >= 60 ? 'bg-success' : 'bg-muted'}`} />
                      <span className="text-sm">Generating images</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${job.progress >= 100 ? 'text-success' : 'text-muted-foreground'}`}>
                      <div className={`w-2 h-2 rounded-full ${job.progress >= 100 ? 'bg-success' : 'bg-muted'}`} />
                      <span className="text-sm">Saving to shelf</span>
                    </div>
                  </div>

                  {job.scenes && job.scenes.length > 0 && (
                    <div className="mt-8">
                      <p className="text-sm text-muted-foreground mb-2">
                        Found {job.scenes.length} scenes to enhance
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStartOver}
                  className="mt-8 text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Cancel and start over
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="p-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Story Enhanced Successfully!
                </h2>

                <p className="text-muted-foreground mb-8">
                  Your enhanced story "{job?.title}" has been saved to your shelf and is ready to read!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={onNavigateToShelf}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  >
                    📚 Go to My Shelf
                  </button>

                  <button
                    onClick={handleStartOver}
                    className="px-8 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  >
                    ✨ Enhance Another Story
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancePage;