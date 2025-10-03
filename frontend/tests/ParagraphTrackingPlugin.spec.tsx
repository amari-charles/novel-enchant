/**
 * Unit tests for ParagraphTrackingPlugin
 */

import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ParagraphTrackingPlugin } from '@/features/my-stories/components/ParagraphTrackingPlugin';
import { useEffect } from 'react';

describe('ParagraphTrackingPlugin', () => {
  const createEditor = () => ({
    namespace: 'test',
    onError: (error: Error) => {
      throw error;
    },
  });

  test('calls onParagraphCountChange when paragraph count increases', async () => {
    const onParagraphCountChange = vi.fn();

    function TestComponent() {
      const [editor] = useLexicalComposerContext();

      useEffect(() => {
        // Initial setup: 2 paragraphs
        editor.update(() => {
          const root = $getRoot();
          root.clear();

          const p1 = $createParagraphNode();
          p1.append($createTextNode('First paragraph'));
          root.append(p1);

          const p2 = $createParagraphNode();
          p2.append($createTextNode('Second paragraph'));
          root.append(p2);
        });

        // Add a third paragraph after a delay
        setTimeout(() => {
          editor.update(() => {
            const root = $getRoot();
            const p3 = $createParagraphNode();
            p3.append($createTextNode('Third paragraph'));
            root.append(p3);
          });
        }, 100);
      }, [editor]);

      return <ParagraphTrackingPlugin onParagraphCountChange={onParagraphCountChange} />;
    }

    render(
      <LexicalComposer initialConfig={createEditor()}>
        <TestComponent />
      </LexicalComposer>
    );

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(onParagraphCountChange).toHaveBeenCalled();
    const calls = onParagraphCountChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toBe(3); // new count
    expect(lastCall[1]).toBe(2); // old count
  });

  test('calls onParagraphCountChange when paragraph count decreases', async () => {
    const onParagraphCountChange = vi.fn();

    function TestComponent() {
      const [editor] = useLexicalComposerContext();

      useEffect(() => {
        // Initial setup: 3 paragraphs
        editor.update(() => {
          const root = $getRoot();
          root.clear();

          const p1 = $createParagraphNode();
          p1.append($createTextNode('First paragraph'));
          root.append(p1);

          const p2 = $createParagraphNode();
          p2.append($createTextNode('Second paragraph'));
          root.append(p2);

          const p3 = $createParagraphNode();
          p3.append($createTextNode('Third paragraph'));
          root.append(p3);
        });

        // Remove one paragraph after a delay
        setTimeout(() => {
          editor.update(() => {
            const root = $getRoot();
            const children = root.getChildren();
            const lastChild = children[children.length - 1];
            lastChild.remove();
          });
        }, 100);
      }, [editor]);

      return <ParagraphTrackingPlugin onParagraphCountChange={onParagraphCountChange} />;
    }

    render(
      <LexicalComposer initialConfig={createEditor()}>
        <TestComponent />
      </LexicalComposer>
    );

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(onParagraphCountChange).toHaveBeenCalled();
    const calls = onParagraphCountChange.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toBe(2); // new count
    expect(lastCall[1]).toBe(3); // old count
  });

  test('does not call onParagraphCountChange when count stays the same', async () => {
    const onParagraphCountChange = vi.fn();

    function TestComponent() {
      const [editor] = useLexicalComposerContext();

      useEffect(() => {
        // Initial setup: 2 paragraphs
        editor.update(() => {
          const root = $getRoot();
          root.clear();

          const p1 = $createParagraphNode();
          p1.append($createTextNode('First paragraph'));
          root.append(p1);

          const p2 = $createParagraphNode();
          p2.append($createTextNode('Second paragraph'));
          root.append(p2);
        });

        // Just modify text content, don't add/remove paragraphs
        setTimeout(() => {
          editor.update(() => {
            const root = $getRoot();
            const children = root.getChildren();
            const firstParagraph = children[0];
            firstParagraph.clear();
            firstParagraph.append($createTextNode('Modified text'));
          });
        }, 100);
      }, [editor]);

      return <ParagraphTrackingPlugin onParagraphCountChange={onParagraphCountChange} />;
    }

    render(
      <LexicalComposer initialConfig={createEditor()}>
        <TestComponent />
      </LexicalComposer>
    );

    await new Promise(resolve => setTimeout(resolve, 200));

    // Should be called initially for setup, but not for text modification
    const initialCallCount = onParagraphCountChange.mock.calls.length;

    // Wait a bit more to make sure no additional calls happen
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(onParagraphCountChange.mock.calls.length).toBe(initialCallCount);
  });
});
