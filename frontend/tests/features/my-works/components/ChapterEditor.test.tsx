import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Chapter } from '../../../../src/features/my-works/types';
import { ChapterEditor } from '../../../../src/features/my-works/components/ChapterEditor';

// Mock the chapter service
vi.mock('../../../../src/features/my-works/services/chapter-service', () => ({
  ChapterService: {
    getChapter: vi.fn(),
    updateChapter: vi.fn(),
    autoSave: vi.fn(),
  },
}));

const MockChapterService = vi.mocked(await import('../../../../src/features/my-works/services/chapter-service')).ChapterService;

const mockChapter: Chapter = {
  id: 'chapter-1',
  work_id: 'work-1',
  title: 'The Beginning',
  content: 'It was a dark and stormy night when Aria discovered her magical powers.',
  order_index: 0,
  word_count: 12,
  enhancement_count: 0,
  created_at: '2025-09-26T10:00:00Z',
  updated_at: '2025-09-26T15:30:00Z',
  enhancement_anchors: [],
};

describe('ChapterEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should load and display chapter content', async () => {
    MockChapterService.getChapter.mockResolvedValue(mockChapter);

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={vi.fn()}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText('Loading chapter...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue('The Beginning')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/It was a dark and stormy night/)).toBeInTheDocument();
    });

    expect(screen.getByText('12 words')).toBeInTheDocument();
  });

  test('should handle chapter loading error', async () => {
    MockChapterService.getChapter.mockRejectedValue(new Error('Chapter not found'));

    render(
      <ChapterEditor
        chapterId="nonexistent-chapter"
        onSave={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load chapter')).toBeInTheDocument();
      expect(screen.getByText('Chapter not found')).toBeInTheDocument();
    });
  });

  test('should update word count as user types', async () => {
    MockChapterService.getChapter.mockResolvedValue(mockChapter);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/It was a dark and stormy night/)).toBeInTheDocument();
    });

    const contentTextarea = screen.getByLabelText(/chapter content/i);
    await user.clear(contentTextarea);
    await user.type(contentTextarea, 'New chapter content with more words for testing.');

    await waitFor(() => {
      expect(screen.getByText('10 words')).toBeInTheDocument();
    });
  });

  test('should show auto-save indicator when content changes', async () => {
    MockChapterService.getChapter.mockResolvedValue(mockChapter);
    MockChapterService.autoSave.mockResolvedValue({
      saved_at: '2025-09-26T16:05:00Z',
      word_count: 15,
      conflict: false,
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/It was a dark and stormy night/)).toBeInTheDocument();
    });

    const contentTextarea = screen.getByLabelText(/chapter content/i);
    await user.type(contentTextarea, ' Additional content.');

    // Should show saving indicator
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    // Fast-forward auto-save timer (5 seconds)
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.getByText(/Last saved:/)).toBeInTheDocument();
    });

    expect(MockChapterService.autoSave).toHaveBeenCalledWith(
      'chapter-1',
      expect.objectContaining({
        content: expect.stringContaining('Additional content.'),
      })
    );
  });

  test('should handle auto-save conflicts', async () => {
    MockChapterService.getChapter.mockResolvedValue(mockChapter);
    MockChapterService.autoSave.mockResolvedValue({
      saved_at: '2025-09-26T16:05:00Z',
      word_count: 15,
      conflict: true,
      server_version: {
        content: 'Server version with different changes.',
        updated_at: '2025-09-26T16:03:00Z',
      },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/It was a dark and stormy night/)).toBeInTheDocument();
    });

    const contentTextarea = screen.getByLabelText(/chapter content/i);
    await user.type(contentTextarea, ' My changes.');

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.getByText('Conflict detected')).toBeInTheDocument();
      expect(screen.getByText(/Someone else has modified this chapter/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resolve conflict/i })).toBeInTheDocument();
    });
  });

  test('should save chapter when save button is clicked', async () => {
    MockChapterService.getChapter.mockResolvedValue(mockChapter);
    MockChapterService.updateChapter.mockResolvedValue({
      ...mockChapter,
      title: 'Updated Title',
      content: 'Updated content',
    });

    const mockOnSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={mockOnSave}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('The Beginning')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/chapter title/i);
    const contentTextarea = screen.getByLabelText(/chapter content/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');
    await user.clear(contentTextarea);
    await user.type(contentTextarea, 'Updated content');

    const saveButton = screen.getByRole('button', { name: /save chapter/i });
    await user.click(saveButton);

    expect(MockChapterService.updateChapter).toHaveBeenCalledWith(
      'chapter-1',
      expect.objectContaining({
        title: 'Updated Title',
        content: 'Updated content',
      })
    );

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  test('should show unsaved changes warning when navigating away', async () => {
    MockChapterService.getChapter.mockResolvedValue(mockChapter);
    const mockOnBack = vi.fn();
    const user = userEvent.setup();

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={vi.fn()}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/It was a dark and stormy night/)).toBeInTheDocument();
    });

    // Make changes to content
    const contentTextarea = screen.getByLabelText(/chapter content/i);
    await user.type(contentTextarea, ' Unsaved changes.');

    // Try to navigate back
    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);

    // Should show confirmation dialog
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save first/i })).toBeInTheDocument();

    // User confirms discarding changes
    await user.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(mockOnBack).toHaveBeenCalled();
  });

  test('should disable editing when chapter is from published work', async () => {
    const publishedChapter = {
      ...mockChapter,
      work_id: 'published-work',
    };

    MockChapterService.getChapter.mockResolvedValue(publishedChapter);

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={vi.fn()}
        onBack={vi.fn()}
        isPublished={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('The Beginning')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/chapter title/i);
    const contentTextarea = screen.getByLabelText(/chapter content/i);

    expect(titleInput).toBeDisabled();
    expect(contentTextarea).toBeDisabled();
    expect(screen.getByText(/This chapter is from a published work/)).toBeInTheDocument();
  });

  test('should display enhancement anchors in content', async () => {
    const chapterWithEnhancements = {
      ...mockChapter,
      enhancement_anchors: [
        {
          id: 'anchor-1',
          position: 30,
          type: 'auto' as const,
          enhancement_id: 'enhancement-1',
        },
        {
          id: 'anchor-2',
          position: 60,
          type: 'manual' as const,
          enhancement_id: 'enhancement-2',
        },
      ],
    };

    MockChapterService.getChapter.mockResolvedValue(chapterWithEnhancements);

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('🖼️')).toBeInTheDocument(); // Enhancement indicators
    });

    // Should show enhancement count
    expect(screen.getByText('2 enhancements')).toBeInTheDocument();
  });

  test('should handle manual enhancement insertion', async () => {
    MockChapterService.getChapter.mockResolvedValue(mockChapter);
    const user = userEvent.setup();

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/It was a dark and stormy night/)).toBeInTheDocument();
    });

    const contentTextarea = screen.getByLabelText(/chapter content/i);

    // Select some text
    await user.click(contentTextarea);
    await user.keyboard('{Control>}a{/Control}'); // Select all

    // Right-click to open context menu
    fireEvent.contextMenu(contentTextarea);

    await waitFor(() => {
      expect(screen.getByText('Add Image Here')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Add Image Here'));

    // Should open enhancement dialog
    expect(screen.getByText('Manual Enhancement')).toBeInTheDocument();
    expect(screen.getByLabelText(/image prompt/i)).toBeInTheDocument();
  });

  test('should show chapter statistics', async () => {
    MockChapterService.getChapter.mockResolvedValue(mockChapter);

    render(
      <ChapterEditor
        chapterId="chapter-1"
        onSave={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('12 words')).toBeInTheDocument();
      expect(screen.getByText('0 enhancements')).toBeInTheDocument();
      expect(screen.getByText(/Estimated read time: 1 minute/)).toBeInTheDocument();
    });
  });
});