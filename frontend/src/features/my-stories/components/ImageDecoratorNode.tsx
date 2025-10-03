/**
 * Image Decorator Node
 * Custom Lexical node that renders enhancement images with controls
 */

import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import * as React from 'react';

export interface ImagePayload {
  enhancementId: string;
  imageUrl: string;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    enhancementId: string;
    imageUrl: string;
  },
  SerializedLexicalNode
>;

function ImageComponent({
  enhancementId,
  imageUrl,
  onRetry,
  onDelete,
}: {
  enhancementId: string;
  imageUrl: string;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="my-8 group relative" contentEditable={false}>
      <img
        src={imageUrl}
        alt="Enhancement"
        className="w-full rounded-lg shadow-md"
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onClick={() => onRetry(enhancementId)}
          className="px-3 py-1 bg-white rounded shadow-lg text-sm hover:bg-gray-50"
        >
          Retry
        </button>
        <button
          onClick={() => onDelete(enhancementId)}
          className="px-3 py-1 bg-white rounded shadow-lg text-sm text-red-600 hover:bg-gray-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __enhancementId: string;
  __imageUrl: string;
  __onRetry: (id: string) => void;
  __onDelete: (id: string) => void;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__enhancementId,
      node.__imageUrl,
      node.__onRetry,
      node.__onDelete,
      node.__key
    );
  }

  constructor(
    enhancementId: string,
    imageUrl: string,
    onRetry: (id: string) => void,
    onDelete: (id: string) => void,
    key?: NodeKey
  ) {
    super(key);
    this.__enhancementId = enhancementId;
    this.__imageUrl = imageUrl;
    this.__onRetry = onRetry;
    this.__onDelete = onDelete;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'image-decorator-wrapper';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const node = $createImageNode({
      enhancementId: serializedNode.enhancementId,
      imageUrl: serializedNode.imageUrl,
      onRetry: () => {},
      onDelete: () => {},
    });
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      enhancementId: this.__enhancementId,
      imageUrl: this.__imageUrl,
      type: 'image',
      version: 1,
    };
  }

  decorate(): React.ReactElement {
    return (
      <ImageComponent
        enhancementId={this.__enhancementId}
        imageUrl={this.__imageUrl}
        onRetry={this.__onRetry}
        onDelete={this.__onDelete}
      />
    );
  }

  isInline(): boolean {
    return false;
  }

  isTopLevel(): boolean {
    return true;
  }
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return new ImageNode(
    payload.enhancementId,
    payload.imageUrl,
    payload.onRetry,
    payload.onDelete,
    payload.key
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
