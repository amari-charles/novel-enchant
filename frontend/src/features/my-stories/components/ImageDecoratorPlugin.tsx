/**
 * Image Decorator Plugin
 * Inserts enhancement images after specific paragraph indices
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isParagraphNode } from 'lexical';
import { useEffect } from 'react';

import { $createImageNode, $isImageNode, ImageNode } from './ImageDecoratorNode';

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

interface ImageDecoratorPluginProps {
  anchors: Anchor[];
  enhancements: Enhancement[];
  onRetryEnhancement: (id: string) => void;
  onDeleteEnhancement: (id: string) => void;
}

export function ImageDecoratorPlugin({
  anchors,
  enhancements,
  onRetryEnhancement,
  onDeleteEnhancement,
}: ImageDecoratorPluginProps) {
  const [editor] = useLexicalComposerContext();

  // Track which ImageNodes exist to detect deletions
  useEffect(() => {
    const existingImageNodes = new Set<string>();

    const unregisterMutationListener = editor.registerMutationListener(
      ImageNode,
      (mutatedNodes) => {
        editor.getEditorState().read(() => {
          mutatedNodes.forEach((mutation, nodeKey) => {
            if (mutation === 'destroyed') {
              // Get the enhancement ID from the node before it's fully destroyed
              const nodes = editor.getEditorState()._nodeMap;
              const imageNode = nodes.get(nodeKey);
              if (imageNode && $isImageNode(imageNode)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const enhancementId = (imageNode as any).__enhancementId;
                if (enhancementId && existingImageNodes.has(enhancementId)) {
                  existingImageNodes.delete(enhancementId);
                  onDeleteEnhancement(enhancementId);
                }
              }
            } else if (mutation === 'created') {
              const nodes = editor.getEditorState()._nodeMap;
              const imageNode = nodes.get(nodeKey);
              if (imageNode && $isImageNode(imageNode)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const enhancementId = (imageNode as any).__enhancementId;
                if (enhancementId) {
                  existingImageNodes.add(enhancementId);
                }
              }
            }
          });
        });
      }
    );

    return unregisterMutationListener;
  }, [editor, onDeleteEnhancement]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const children = root.getChildren();

        // Build map of paragraph indices to enhancements
        const anchorMap = new Map<number, Enhancement>();
        anchors.forEach(anchor => {
          if (anchor.active_enhancement_id) {
            const enhancement = enhancements.find(
              e => e.id === anchor.active_enhancement_id
            );
            if (enhancement && enhancement.status === 'completed') {
              anchorMap.set(anchor.after_paragraph_index, enhancement);
            }
          }
        });

        // Count paragraphs and track where images should be
        let paragraphCount = 0;
        const imagesToInsert: Array<{
          index: number;
          enhancement: Enhancement;
        }> = [];

        children.forEach((child, index) => {
          if ($isParagraphNode(child)) {
            const enhancement = anchorMap.get(paragraphCount);
            if (enhancement) {
              imagesToInsert.push({
                index: index + 1, // Insert after this paragraph
                enhancement,
              });
            }
            paragraphCount++;
          }
        });

        // Insert image nodes where needed
        editor.update(() => {
          const root = $getRoot();
          const children = root.getChildren();

          imagesToInsert.forEach(({ index, enhancement }) => {
            // Check if image already exists at this position
            const nextNode = children[index];
            if (nextNode && $isImageNode(nextNode)) {
              // Image already exists, skip
              return;
            }

            // Create and insert image node
            const imageNode = $createImageNode({
              enhancementId: enhancement.id,
              imageUrl: enhancement.mediaUrl,
              onRetry: onRetryEnhancement,
              onDelete: onDeleteEnhancement,
            });

            const targetParagraph = children[index - 1];
            if (targetParagraph) {
              targetParagraph.insertAfter(imageNode);
            }
          });
        });
      });
    });
  }, [editor, anchors, enhancements, onRetryEnhancement, onDeleteEnhancement]);

  return null;
}
