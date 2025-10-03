/**
 * Enhanced Text Editor
 * Edit mode with inline image display and management
 */

import React from 'react';

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

interface EnhancedTextEditorProps {
  title: string;
  content: string;
  anchors: Anchor[];
  enhancements: Enhancement[];
  fontClass: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onRetryEnhancement: (enhancementId: string) => void;
  onDeleteEnhancement: (enhancementId: string) => void;
}

export const EnhancedTextEditor: React.FC<EnhancedTextEditorProps> = ({
  title,
  content,
  anchors,
  enhancements,
  fontClass,
  onTitleChange,
  onContentChange,
  onRetryEnhancement,
  onDeleteEnhancement,
}) => {
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

  // Split content into segments and render inline with images
  const renderContentWithImages = () => {
    if (anchorMap.size === 0) {
      // No enhancements, just render the textarea
      return (
        <textarea
          id="content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Start writing your chapter..."
          className={`w-full px-0 py-6 border-0 focus:outline-none bg-transparent text-foreground text-base leading-relaxed placeholder:text-muted-foreground/40 resize-none ${fontClass}`}
          style={{
            minHeight: 'calc(100vh - 300px)',
            lineHeight: '1.75'
          }}
        />
      );
    }

    // Get sorted anchor positions
    const sortedPositions = Array.from(anchorMap.keys()).sort((a, b) => a - b);

    // Split text at anchor positions and insert images inline
    const segments: React.ReactNode[] = [];
    let lastPosition = 0;

    sortedPositions.forEach((position, index) => {
      // Add text segment before this image
      const textSegment = content.slice(lastPosition, position);
      if (textSegment) {
        segments.push(
          <textarea
            key={`text-${index}`}
            value={textSegment}
            onChange={(e) => {
              // Reconstruct the full content with the edited segment
              const before = content.slice(0, lastPosition);
              const after = content.slice(position);
              onContentChange(before + e.target.value + after);
            }}
            className={`w-full px-0 py-3 border-0 focus:outline-none bg-transparent text-foreground text-base leading-relaxed placeholder:text-muted-foreground/40 resize-none ${fontClass}`}
            style={{ lineHeight: '1.75', minHeight: '100px' }}
          />
        );
      }

      // Add image with controls
      const enhancement = anchorMap.get(position)!;
      segments.push(
        <div key={`img-${enhancement.id}`} className="my-6 group">
          {/* Image */}
          <div className="relative">
            <img
              src={enhancement.mediaUrl}
              alt="Enhancement"
              className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
            />

            {/* Hover Controls */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                onClick={() => onRetryEnhancement(enhancement.id)}
                className="px-3 py-1.5 text-xs bg-background/90 backdrop-blur text-foreground rounded shadow-lg hover:bg-background transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => onDeleteEnhancement(enhancement.id)}
                className="px-3 py-1.5 text-xs bg-destructive/90 backdrop-blur text-destructive-foreground rounded shadow-lg hover:bg-destructive transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      );

      lastPosition = position;
    });

    // Add remaining text after last image
    const remainingText = content.slice(lastPosition);
    if (remainingText) {
      segments.push(
        <textarea
          key="text-end"
          value={remainingText}
          onChange={(e) => {
            const before = content.slice(0, lastPosition);
            onContentChange(before + e.target.value);
          }}
          className={`w-full px-0 py-3 border-0 focus:outline-none bg-transparent text-foreground text-base leading-relaxed placeholder:text-muted-foreground/40 resize-none ${fontClass}`}
          style={{ lineHeight: '1.75', minHeight: '100px' }}
        />
      );
    }

    return <div className="space-y-0">{segments}</div>;
  };

  return (
    <div className="max-w-[700px] mx-auto">
      {/* Title */}
      <input
        id="title"
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Chapter Title"
        className={`w-full text-3xl font-bold px-0 py-3 border-0 border-b border-transparent hover:border-border focus:border-border focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground/40 transition-colors ${fontClass}`}
      />

      {/* Content with Images */}
      {renderContentWithImages()}
    </div>
  );
};
