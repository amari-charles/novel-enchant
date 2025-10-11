/**
 * Unit tests for ImageDecoratorNode
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { render } from '@testing-library/react';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { $createImageNode, $isImageNode, ImageNode } from '@/features/my-stories/components/ImageDecoratorNode';

describe('ImageDecoratorNode', () => {
  const createEditor = () => ({
    namespace: 'test',
    nodes: [ImageNode],
    onError: (error: Error) => {
      throw error;
    },
  });

  describe('$isImageNode', () => {
    test('returns false for null', () => {
      expect($isImageNode(null)).toBe(false);
    });

    test('returns false for undefined', () => {
      expect($isImageNode(undefined)).toBe(false);
    });
  });

  describe('ImageNode.getType', () => {
    test('returns "image" as node type', () => {
      expect(ImageNode.getType()).toBe('image');
    });
  });

  describe('ImageNode within editor context', () => {
    test('creates ImageNode with correct properties', () => {
      const onRetry = vi.fn();
      const onDelete = vi.fn();
      let enhancementId = '';
      let imageUrl = '';

      function TestComponent() {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
          editor.update(() => {
            const root = $getRoot();
            const imageNode = $createImageNode({
              enhancementId: 'enh-123',
              imageUrl: 'https://example.com/image.jpg',
              onRetry,
              onDelete,
            });

            root.append(imageNode);

            enhancementId = (imageNode as any).__enhancementId;
            imageUrl = (imageNode as any).__imageUrl;
          });
        }, [editor]);

        return null;
      }

      render(
        <LexicalComposer initialConfig={createEditor()}>
          <TestComponent />
        </LexicalComposer>
      );

      expect(enhancementId).toBe('enh-123');
      expect(imageUrl).toBe('https://example.com/image.jpg');
    });

    test('$isImageNode returns true for ImageNode instances', () => {
      let isImage = false;

      function TestComponent() {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
          editor.update(() => {
            const root = $getRoot();
            const imageNode = $createImageNode({
              enhancementId: 'enh-123',
              imageUrl: 'https://example.com/image.jpg',
              onRetry: () => {},
              onDelete: () => {},
            });

            root.append(imageNode);
            isImage = $isImageNode(imageNode);
          });
        }, [editor]);

        return null;
      }

      render(
        <LexicalComposer initialConfig={createEditor()}>
          <TestComponent />
        </LexicalComposer>
      );

      expect(isImage).toBe(true);
    });

    test('exports and imports JSON correctly', () => {
      let exportedJSON: any = null;
      let importedEnhancementId = '';

      function TestComponent() {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
          editor.update(() => {
            const root = $getRoot();
            const imageNode = $createImageNode({
              enhancementId: 'enh-456',
              imageUrl: 'https://example.com/test.jpg',
              onRetry: () => {},
              onDelete: () => {},
            });

            exportedJSON = imageNode.exportJSON();

            const importedNode = ImageNode.importJSON(exportedJSON);
            root.append(importedNode);

            importedEnhancementId = (importedNode as any).__enhancementId;
          });
        }, [editor]);

        return null;
      }

      render(
        <LexicalComposer initialConfig={createEditor()}>
          <TestComponent />
        </LexicalComposer>
      );

      expect(exportedJSON).toEqual({
        enhancementId: 'enh-456',
        imageUrl: 'https://example.com/test.jpg',
        type: 'image',
        version: 1,
      });
      expect(importedEnhancementId).toBe('enh-456');
    });

    test('clones node with same properties', () => {
      let clonedEnhancementId = '';
      let originalKey = '';
      let clonedKey = '';

      function TestComponent() {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
          editor.update(() => {
            const root = $getRoot();
            const original = $createImageNode({
              enhancementId: 'enh-789',
              imageUrl: 'https://example.com/clone.jpg',
              onRetry: () => {},
              onDelete: () => {},
            });

            root.append(original);

            const cloned = ImageNode.clone(original);
            clonedEnhancementId = (cloned as any).__enhancementId;
            originalKey = original.getKey();
            clonedKey = cloned.getKey();
          });
        }, [editor]);

        return null;
      }

      render(
        <LexicalComposer initialConfig={createEditor()}>
          <TestComponent />
        </LexicalComposer>
      );

      expect(clonedEnhancementId).toBe('enh-789');
      expect(clonedKey).not.toBe(originalKey);
    });

    test('isInline returns false', () => {
      let isInline = true;

      function TestComponent() {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
          editor.update(() => {
            const node = $createImageNode({
              enhancementId: 'enh-123',
              imageUrl: 'https://example.com/image.jpg',
              onRetry: () => {},
              onDelete: () => {},
            });

            isInline = node.isInline();
          });
        }, [editor]);

        return null;
      }

      render(
        <LexicalComposer initialConfig={createEditor()}>
          <TestComponent />
        </LexicalComposer>
      );

      expect(isInline).toBe(false);
    });

    test('isTopLevel returns true', () => {
      let isTopLevel = false;

      function TestComponent() {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
          editor.update(() => {
            const node = $createImageNode({
              enhancementId: 'enh-123',
              imageUrl: 'https://example.com/image.jpg',
              onRetry: () => {},
              onDelete: () => {},
            });

            isTopLevel = node.isTopLevel();
          });
        }, [editor]);

        return null;
      }

      render(
        <LexicalComposer initialConfig={createEditor()}>
          <TestComponent />
        </LexicalComposer>
      );

      expect(isTopLevel).toBe(true);
    });

    test('updateDOM returns false', () => {
      let updateResult = true;

      function TestComponent() {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
          editor.update(() => {
            const node = $createImageNode({
              enhancementId: 'enh-123',
              imageUrl: 'https://example.com/image.jpg',
              onRetry: () => {},
              onDelete: () => {},
            });

            updateResult = node.updateDOM();
          });
        }, [editor]);

        return null;
      }

      render(
        <LexicalComposer initialConfig={createEditor()}>
          <TestComponent />
        </LexicalComposer>
      );

      expect(updateResult).toBe(false);
    });
  });
});
