/**
 * Reading View Component
 * Simplified reading experience for stories (reuses existing ReadingView)
 */

import React from 'react';
import { ReadingView as EnhanceReadingView } from '@/features/reader-enhance/components/ReadingView';

interface Story {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  title?: string;
  content?: string;
  scenes?: Scene[];
}

interface Scene {
  id: string;
  excerpt: string;
  image_url?: string;
  status: string;
}

interface ReadingViewProps {
  story: Story;
  onBack: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  story,
  onBack
}) => {
  // Transform our story format to match the enhanced copy format expected by ReadingView
  const enhancedCopy = {
    id: story.id,
    title: story.title,
    content: {
      chapters: story.chapters
    }
  };

  return (
    <EnhanceReadingView
      copy={enhancedCopy}
      onBack={onBack}
    />
  );
};

export default ReadingView;