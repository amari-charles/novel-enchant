/**
 * Lexical Editor Component
 * Main editor setup with Lexical
 */

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, $createParagraphNode, $createTextNode, type EditorState } from 'lexical';
import { useEffect } from 'react';
import { ImageNode } from './ImageDecoratorNode';
import { ImageDecoratorPlugin } from './ImageDecoratorPlugin';
import { ParagraphTrackingPlugin } from './ParagraphTrackingPlugin';

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

interface LexicalEditorProps {
  content: string;
  anchors: Anchor[];
  enhancements: Enhancement[];
  fontClass: string;
  onChange: (content: string) => void;
  onRetryEnhancement: (id: string) => void;
  onDeleteEnhancement: (id: string) => void;
  onParagraphCountChange?: (newCount: number, oldCount: number) => void;
}

// Plugin to initialize content from plain text
function InitialContentPlugin({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();

      // Clear existing content
      root.clear();

      // Split content into paragraphs and create paragraph nodes
      const paragraphs = content.split('\n');
      paragraphs.forEach(para => {
        const paragraphNode = $createParagraphNode();
        const textNode = $createTextNode(para);
        paragraphNode.append(textNode);
        root.append(paragraphNode);
      });
    });
  }, []); // Only run once on mount

  return null;
}

// Plugin to extract plain text from editor
function OnChangeTextPlugin({ onChange }: { onChange: (text: string) => void }) {
  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const paragraphs = root
        .getChildren()
        .filter(node => node.getType() === 'paragraph')
        .map(node => node.getTextContent());

      const text = paragraphs.join('\n');
      onChange(text);
    });
  };

  return <OnChangePlugin onChange={handleChange} />;
}

export function LexicalEditor({
  content,
  anchors,
  enhancements,
  fontClass,
  onChange,
  onRetryEnhancement,
  onDeleteEnhancement,
  onParagraphCountChange,
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'ChapterEditor',
    theme: {
      paragraph: 'mb-4',
    },
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: [ImageNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              className={`py-6 outline-none focus:outline-none ${fontClass}`}
              style={{ lineHeight: '1.75' }}
            />
          }
          placeholder={
            <div className="absolute top-6 left-0 text-muted-foreground/40 pointer-events-none">
              Start writing your chapter...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <InitialContentPlugin content={content} />
        <OnChangeTextPlugin onChange={onChange} />
        <ImageDecoratorPlugin
          anchors={anchors}
          enhancements={enhancements}
          onRetryEnhancement={onRetryEnhancement}
          onDeleteEnhancement={onDeleteEnhancement}
        />
        {onParagraphCountChange && (
          <ParagraphTrackingPlugin onParagraphCountChange={onParagraphCountChange} />
        )}
      </div>
    </LexicalComposer>
  );
}
