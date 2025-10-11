/**
 * Enhanced Text Editor
 * Lexical-based editor with inline image display
 */

import React from 'react';

import { LexicalEditor } from './LexicalEditor';

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
  onParagraphCountChange?: (newCount: number, oldCount: number) => void;
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
  onParagraphCountChange,
}) => {
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

      {/* Lexical Editor */}
      <LexicalEditor
        content={content}
        anchors={anchors}
        enhancements={enhancements}
        fontClass={fontClass}
        onChange={onContentChange}
        onRetryEnhancement={onRetryEnhancement}
        onDeleteEnhancement={onDeleteEnhancement}
        onParagraphCountChange={onParagraphCountChange}
      />
    </div>
  );
};
