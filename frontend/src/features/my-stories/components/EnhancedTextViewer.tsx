/**
 * Enhanced Text Viewer
 * Read-only view mode with inline images (paragraph-based)
 */

import React, { useState } from 'react';

interface Enhancement {
  id: string;
  anchor_id: string;
  media_id: string | null;
  mediaUrl: string;
  status: 'generating' | 'completed' | 'failed';
}

interface Anchor {
  id: string;
  after_paragraph_index: number;
  active_enhancement_id: string | null;
}

interface EnhancedTextViewerProps {
  title: string;
  content: string;
  anchors: Anchor[];
  enhancements: Enhancement[];
  fontClass: string;
}

export const EnhancedTextViewer: React.FC<EnhancedTextViewerProps> = ({
  title,
  content,
  anchors,
  enhancements,
  fontClass,
}) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Split content into paragraphs
  const paragraphs = content.split('\n');

  // Build a map of paragraph indices to their active enhancements
  const anchorMap = new Map<number, Enhancement>();

  anchors.forEach(anchor => {
    if (anchor.active_enhancement_id) {
      const enhancement = enhancements.find(e => e.id === anchor.active_enhancement_id);
      if (enhancement && enhancement.status === 'completed') {
        anchorMap.set(anchor.after_paragraph_index, enhancement);
      }
    }
  });

  // Render paragraphs with inline images
  const renderContent = () => {
    const elements: React.ReactNode[] = [];

    paragraphs.forEach((para, index) => {
      // Render the paragraph
      if (para.trim()) {
        elements.push(
          <p key={`para-${index}`} className="mb-4">
            {para}
          </p>
        );
      } else {
        elements.push(<div key={`space-${index}`} className="h-4" />);
      }

      // Check if there's an image after this paragraph
      const enhancement = anchorMap.get(index);
      if (enhancement) {
        elements.push(
          <div key={`img-${enhancement.id}`} className="my-8">
            <img
              src={enhancement.mediaUrl}
              alt="Enhancement"
              className="w-full max-w-2xl mx-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setZoomedImage(enhancement.mediaUrl)}
            />
          </div>
        );
      }
    });

    return elements;
  };

  return (
    <>
      <div className="max-w-[700px] mx-auto">
        {/* Title */}
        <h1 className={`text-3xl font-bold px-0 py-3 mb-6 text-foreground ${fontClass}`}>
          {title || 'Untitled Chapter'}
        </h1>

        {/* Content with Images */}
        <div className={`prose prose-lg max-w-none text-foreground ${fontClass}`} style={{ lineHeight: '1.75' }}>
          {renderContent()}
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between py-4 mt-8 text-sm text-muted-foreground border-t border-border/50">
          <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
          <span>{anchorMap.size} enhancements</span>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoomed enhancement"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
};
