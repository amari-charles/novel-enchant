import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Work } from '../../../../src/features/my-works/types';
import { WorksList } from '../../../../src/features/my-works/components/WorksList';

// Mock the work service
vi.mock('../../../../src/features/my-works/services/work-service', () => ({
  WorkService: {
    listWorks: vi.fn(),
    deleteWork: vi.fn(),
  },
}));

const MockWorkService = vi.mocked(await import('../../../../src/features/my-works/services/work-service')).WorkService;

const mockWorks: Work[] = [
  {
    id: 'work-1',
    user_id: 'user-1',
    title: 'Dragon\'s Quest',
    description: 'Epic fantasy adventure about a young sorceress',
    status: 'draft',
    created_at: '2025-09-26T10:00:00Z',
    updated_at: '2025-09-26T15:30:00Z',
    last_edited_at: '2025-09-26T15:30:00Z',
    auto_enhance_enabled: true,
    target_scenes_per_chapter: 4,
    chapter_count: 3,
    word_count: 15000,
    enhancement_count: 8,
    character_count: 2,
    cover_image_url: 'https://example.com/cover1.jpg',
    publication_status: 'draft',
    read_count: 0,
  },
  {
    id: 'work-2',
    user_id: 'user-1',
    title: 'Space Chronicles',
    description: 'Sci-fi saga spanning multiple galaxies',
    status: 'published',
    created_at: '2025-09-25T08:00:00Z',
    updated_at: '2025-09-26T12:00:00Z',
    last_edited_at: '2025-09-26T12:00:00Z',
    auto_enhance_enabled: false,
    target_scenes_per_chapter: 3,
    chapter_count: 7,
    word_count: 28000,
    enhancement_count: 15,
    character_count: 5,
    publication_status: 'published',
    read_count: 142,
  },
];

describe('WorksList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should display loading state initially', async () => {
    MockWorkService.listWorks.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    expect(screen.getByText('Loading your works...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('should display works list after loading', async () => {
    MockWorkService.listWorks.mockResolvedValue({
      works: mockWorks,
      total: 2,
      has_more: false,
    });

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Dragon\'s Quest')).toBeInTheDocument();
      expect(screen.getByText('Space Chronicles')).toBeInTheDocument();
    });

    expect(screen.getByText('Epic fantasy adventure about a young sorceress')).toBeInTheDocument();
    expect(screen.getByText('3 chapters • 15,000 words')).toBeInTheDocument();
    expect(screen.getByText('7 chapters • 28,000 words')).toBeInTheDocument();
  });

  test('should display draft and published status badges', async () => {
    MockWorkService.listWorks.mockResolvedValue({
      works: mockWorks,
      total: 2,
      has_more: false,
    });

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
    });
  });

  test('should display empty state when no works exist', async () => {
    MockWorkService.listWorks.mockResolvedValue({
      works: [],
      total: 0,
      has_more: false,
    });

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('No works yet')).toBeInTheDocument();
      expect(screen.getByText('Start your first creative project')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create your first work/i })).toBeInTheDocument();
    });
  });

  test('should call onCreateWork when create button is clicked', async () => {
    const mockOnCreateWork = vi.fn();
    MockWorkService.listWorks.mockResolvedValue({
      works: [],
      total: 0,
      has_more: false,
    });

    render(<WorksList onCreateWork={mockOnCreateWork} onEditWork={vi.fn()} />);

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /create your first work/i });
      fireEvent.click(createButton);
    });

    expect(mockOnCreateWork).toHaveBeenCalledTimes(1);
  });

  test('should call onEditWork when work card is clicked', async () => {
    const mockOnEditWork = vi.fn();
    MockWorkService.listWorks.mockResolvedValue({
      works: mockWorks,
      total: 2,
      has_more: false,
    });

    render(<WorksList onCreateWork={vi.fn()} onEditWork={mockOnEditWork} />);

    await waitFor(() => {
      const workCard = screen.getByText('Dragon\'s Quest').closest('button');
      fireEvent.click(workCard!);
    });

    expect(mockOnEditWork).toHaveBeenCalledWith('work-1');
  });

  test('should filter works by status', async () => {
    MockWorkService.listWorks.mockResolvedValue({
      works: [mockWorks[0]], // Only draft work
      total: 1,
      has_more: false,
    });

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    // Click on draft filter
    await waitFor(() => {
      const draftFilter = screen.getByRole('button', { name: /draft/i });
      fireEvent.click(draftFilter);
    });

    expect(MockWorkService.listWorks).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft' })
    );
  });

  test('should sort works by different criteria', async () => {
    MockWorkService.listWorks.mockResolvedValue({
      works: mockWorks,
      total: 2,
      has_more: false,
    });

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    await waitFor(() => {
      const sortSelect = screen.getByLabelText(/sort by/i);
      fireEvent.change(sortSelect, { target: { value: 'title_asc' } });
    });

    expect(MockWorkService.listWorks).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'title_asc' })
    );
  });

  test('should handle delete work action', async () => {
    MockWorkService.listWorks.mockResolvedValue({
      works: mockWorks,
      total: 2,
      has_more: false,
    });
    MockWorkService.deleteWork.mockResolvedValue(undefined);

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    await waitFor(() => {
      // Find and click the delete button for first work
      const deleteButton = screen.getAllByLabelText(/delete work/i)[0];
      fireEvent.click(deleteButton);
    });

    // Confirm deletion in modal
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      fireEvent.click(confirmButton);
    });

    expect(MockWorkService.deleteWork).toHaveBeenCalledWith('work-1');
  });

  test('should display error state when loading fails', async () => {
    MockWorkService.listWorks.mockRejectedValue(new Error('Network error'));

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load works')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  test('should retry loading when try again button is clicked', async () => {
    MockWorkService.listWorks
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({
        works: mockWorks,
        total: 2,
        has_more: false,
      });

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    await waitFor(() => {
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Dragon\'s Quest')).toBeInTheDocument();
    });

    expect(MockWorkService.listWorks).toHaveBeenCalledTimes(2);
  });

  test('should load more works when pagination button is clicked', async () => {
    MockWorkService.listWorks
      .mockResolvedValueOnce({
        works: [mockWorks[0]],
        total: 2,
        has_more: true,
      })
      .mockResolvedValueOnce({
        works: mockWorks,
        total: 2,
        has_more: false,
      });

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    await waitFor(() => {
      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      fireEvent.click(loadMoreButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Space Chronicles')).toBeInTheDocument();
    });

    expect(MockWorkService.listWorks).toHaveBeenCalledTimes(2);
    expect(MockWorkService.listWorks).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 1 })
    );
  });

  test('should display work analytics for published works', async () => {
    MockWorkService.listWorks.mockResolvedValue({
      works: mockWorks,
      total: 2,
      has_more: false,
    });

    render(<WorksList onCreateWork={vi.fn()} onEditWork={vi.fn()} />);

    await waitFor(() => {
      // Published work should show read count
      expect(screen.getByText('142 reads')).toBeInTheDocument();
      // Draft work should not show read count
      expect(screen.queryByText('0 reads')).not.toBeInTheDocument();
    });
  });
});