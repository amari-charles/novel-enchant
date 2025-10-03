/**
 * Paragraph Tracking Plugin
 * Monitors paragraph count and triggers anchor reindexing when paragraphs are deleted
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isParagraphNode } from 'lexical';
import { useEffect, useRef } from 'react';

interface ParagraphTrackingPluginProps {
  onParagraphCountChange: (newCount: number, oldCount: number) => void;
}

export function ParagraphTrackingPlugin({
  onParagraphCountChange,
}: ParagraphTrackingPluginProps) {
  const [editor] = useLexicalComposerContext();
  const previousCountRef = useRef<number>(0);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const children = root.getChildren();

        // Count paragraphs
        const paragraphCount = children.filter(child => $isParagraphNode(child)).length;

        // Check if count changed
        if (paragraphCount !== previousCountRef.current) {
          onParagraphCountChange(paragraphCount, previousCountRef.current);
          previousCountRef.current = paragraphCount;
        }
      });
    });
  }, [editor, onParagraphCountChange]);

  return null;
}
