/**
 * Enhanced Text Viewer
 * Read-only view mode with inline images
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
  position: number;
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

  // Build a map of anchor positions to their active enhancements
  const anchorMap = new Map<number, Enhancement>();

  anchors.forEach(anchor => {
    if (anchor.active_enhancement_id) {
      const enhancement = enhancements.find(e => e.id === anchor.active_enhancement_id);
      if (enhancement && enhancement.status === 'completed') {
        anchorMap.set(anchor.position, enhancement);
      }
    }
  });

  // Split content into segments and insert images
  const renderContentWithImages = () => {
    if (anchorMap.size === 0) {
      // No enhancements, just render paragraphs
      return content.split('\n').map((para, index) => (
        para.trim() ? (
          <p key={index} className="mb-4">
            {para}
          </p>
        ) : (
          <div key={index} className="h-4" />
        )
      ));
    }

    // Get sorted anchor positions
    const sortedPositions = Array.from(anchorMap.keys()).sort((a, b) => a - b);

    const segments: React.ReactNode[] = [];
    let lastPosition = 0;

    sortedPositions.forEach((position, index) => {
      // Add text segment before this image
      const textSegment = content.slice(lastPosition, position);
      if (textSegment.trim()) {
        const paragraphs = textSegment.split('\n');
        paragraphs.forEach((para, pIndex) => {
          if (para.trim()) {
            segments.push(
              <p key={`text-${index}-${pIndex}`} className="mb-4">
                {para}
              </p>
            );
          } else {
            segments.push(<div key={`space-${index}-${pIndex}`} className="h-4" />);
          }
        });
      }

      // Add image
      const enhancement = anchorMap.get(position)!;
      segments.push(
        <div key={`img-${enhancement.id}`} className="my-8">
          <img
            src={enhancement.mediaUrl}
            alt="Enhancement"
            className="w-full max-w-2xl mx-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setZoomedImage(enhancement.mediaUrl)}
          />
        </div>
      );

      lastPosition = position;
    });

    // Add remaining text after last image
    const remainingText = content.slice(lastPosition);
    if (remainingText.trim()) {
      const paragraphs = remainingText.split('\n');
      paragraphs.forEach((para, pIndex) => {
        if (para.trim()) {
          segments.push(
            <p key={`text-end-${pIndex}`} className="mb-4">
              {para}
            </p>
          );
        } else {
          segments.push(<div key={`space-end-${pIndex}`} className="h-4" />);
        }
      });
    }

    return segments;
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
          {renderContentWithImages()}
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
