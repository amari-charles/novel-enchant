import type { ApiError, RateLimitError } from '../types';

// Mock API client for My Works endpoints (no Supabase required)
export class MyWorksApiClient {
  private baseUrl = '/api/my-works';
  private delayMs = 500; // Simulate network delay

  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Mock authentication - always return valid headers
    return {
      'Authorization': 'Bearer mock-jwt-token',
      'Content-Type': 'application/json',
    };
  }

  private async mockDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.delayMs));
  }

  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    await this.mockDelay();
    await this.getAuthHeaders(); // Verify auth

    // Mock responses based on endpoint
    return this.getMockResponse<T>(endpoint, params);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    await this.mockDelay();
    await this.getAuthHeaders(); // Verify auth

    return this.getMockResponse<T>(endpoint, data, 'POST');
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    await this.mockDelay();
    await this.getAuthHeaders(); // Verify auth

    return this.getMockResponse<T>(endpoint, data, 'PUT');
  }

  async delete<T>(endpoint: string): Promise<T> {
    await this.mockDelay();
    await this.getAuthHeaders(); // Verify auth

    return this.getMockResponse<T>(endpoint, undefined, 'DELETE');
  }

  async getPublic<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    await this.mockDelay();

    return this.getMockResponse<T>(endpoint, params);
  }

  async postPublic<T>(endpoint: string, data?: unknown): Promise<T> {
    await this.mockDelay();

    return this.getMockResponse<T>(endpoint, data, 'POST');
  }

  private getMockResponse<T>(endpoint: string, data?: unknown, method: string = 'GET'): T {
    console.log('🔍 API Mock Call:', { endpoint, method, data });
    // Mock works list
    if (endpoint === '/works' && method === 'GET') {
      return {
        works: [
          {
            id: 'work-1',
            user_id: 'user-1',
            title: 'Dragon\'s Quest',
            description: 'Epic fantasy adventure about a young sorceress discovering her magical powers',
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
            cover_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
            publication_status: 'draft',
            read_count: 0,
          },
          {
            id: 'work-2',
            user_id: 'user-1',
            title: 'Space Chronicles',
            description: 'Sci-fi saga spanning multiple galaxies with advanced civilizations',
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
            cover_image_url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400',
            publication_status: 'published',
            read_count: 142,
          },
        ],
        total: 2,
        has_more: false,
      } as T;
    }

    // Mock work creation
    if (endpoint === '/works' && method === 'POST') {
      return {
        id: this.generateId(),
        user_id: 'user-1',
        title: data.title,
        description: data.description,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_edited_at: new Date().toISOString(),
        auto_enhance_enabled: data.auto_enhance_enabled ?? true,
        target_scenes_per_chapter: data.target_scenes_per_chapter ?? 4,
        chapter_count: 0,
        word_count: 0,
        enhancement_count: 0,
        character_count: 0,
        publication_status: 'draft',
        read_count: 0,
      } as T;
    }

    // Mock single work (but not chapters)
    if (endpoint.startsWith('/works/') && method === 'GET' && !endpoint.includes('/chapters')) {
      const workId = endpoint.split('/')[2];
      return {
        id: workId,
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
        publication_status: 'draft',
        read_count: 0,
      } as T;
    }

    // Mock chapters list
    console.log('🔍 Checking chapters pattern:', { endpoint, method, matches: endpoint.match(/\/works\/[^/]+\/chapters$/) });

    if (endpoint.match(/\/works\/[^/]+\/chapters$/) && method === 'GET') {
      // Extract work ID from endpoint like /works/work-1/chapters
      const workIdMatch = endpoint.match(/\/works\/([^/]+)\/chapters$/);
      const currentWorkId = workIdMatch ? workIdMatch[1] : 'work-1';

      console.log('✅ Chapters request matched!', { endpoint, workIdMatch, currentWorkId });

      return {
        chapters: [
          {
            id: 'chapter-1',
            work_id: currentWorkId,
            title: 'The Beginning',
            content: 'It was a dark and stormy night when Aria first discovered her magical powers. The emerald pendant around her neck began to glow with an otherworldly light...',
            order_index: 0,
            word_count: 5000,
            enhancement_count: 3,
            created_at: '2025-09-26T10:00:00Z',
            updated_at: '2025-09-26T15:30:00Z',
            enhancement_anchors: [],
          },
          {
            id: 'chapter-2',
            work_id: currentWorkId,
            title: 'The Journey Begins',
            content: 'The next morning brought new adventures as Aria set out from her village. The path ahead was treacherous, but her determination never wavered...',
            order_index: 1,
            word_count: 4500,
            enhancement_count: 2,
            created_at: '2025-09-26T11:00:00Z',
            updated_at: '2025-09-26T16:00:00Z',
            enhancement_anchors: [],
          },
          {
            id: 'chapter-3',
            work_id: currentWorkId,
            title: 'The Ancient Forest',
            content: 'Deep within the ancient forest, Aria encountered creatures beyond her wildest imagination. The magic here was older, wilder, and more dangerous than anything she had experienced...',
            order_index: 2,
            word_count: 5500,
            enhancement_count: 3,
            created_at: '2025-09-26T12:00:00Z',
            updated_at: '2025-09-26T17:00:00Z',
            enhancement_anchors: [],
          },
        ],
      } as T;
    }

    // Mock chapter creation
    if (endpoint.includes('/chapters') && method === 'POST') {
      return {
        id: this.generateId(),
        work_id: endpoint.split('/')[2],
        title: data.title,
        content: data.content || '',
        order_index: data.order_index,
        word_count: this.calculateWordCount(data.content || ''),
        enhancement_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        enhancement_anchors: [],
      } as T;
    }

    // Mock single chapter
    if (endpoint.startsWith('/chapters/') && method === 'GET') {
      const chapterId = endpoint.split('/')[2];
      return {
        id: chapterId,
        work_id: 'work-1',
        title: 'The Beginning',
        content: 'It was a dark and stormy night when Aria first discovered her magical powers. The emerald pendant around her neck began to glow with an otherworldly light as she stood in the ancient forest, her auburn hair whipping in the supernatural wind.',
        order_index: 0,
        word_count: 500,
        enhancement_count: 2,
        created_at: '2025-09-26T10:00:00Z',
        updated_at: '2025-09-26T15:30:00Z',
        enhancement_anchors: [],
      } as T;
    }

    // Mock auto-save
    if (endpoint.includes('/autosave') && method === 'PUT') {
      return {
        saved_at: new Date().toISOString(),
        word_count: this.calculateWordCount(data.content || ''),
        conflict: false,
      } as T;
    }

    // Mock chapter update
    if (endpoint.startsWith('/chapters/') && method === 'PUT') {
      const chapterId = endpoint.split('/')[2];
      return {
        id: chapterId,
        work_id: 'work-1',
        title: data.title || 'Updated Chapter',
        content: data.content || 'Updated content...',
        order_index: 0,
        word_count: this.calculateWordCount(data.content || ''),
        enhancement_count: 0,
        created_at: '2025-09-26T10:00:00Z',
        updated_at: new Date().toISOString(),
        enhancement_anchors: data.enhancement_anchors || [],
      } as T;
    }

    // Mock delete operations
    if (method === 'DELETE') {
      return undefined as T;
    }

    // Mock auto-enhance endpoint
    if (endpoint === '/enhancement/auto-enhance' && method === 'POST') {
      return {
        job_id: this.generateId(),
        status: 'queued',
        chapter_id: data.chapter_id,
        estimated_completion: new Date(Date.now() + 120000).toISOString(), // 2 minutes
        enhancements_to_generate: Math.floor(Math.random() * 3) + 2, // 2-4 enhancements
      } as T;
    }

    // Mock enhancement retry
    if (endpoint.includes('/enhancement/') && endpoint.includes('/retry') && method === 'POST') {
      return {
        version_id: this.generateId(),
        version_number: Math.floor(Math.random() * 5) + 2,
        status: 'generating',
        estimated_completion: new Date(Date.now() + 30000).toISOString(), // 30 seconds
      } as T;
    }

    // Mock enhancement active version update
    if (endpoint.includes('/enhancement/') && endpoint.includes('/active-version') && method === 'PUT') {
      const enhancementId = endpoint.split('/')[2];
      return {
        enhancement_id: enhancementId,
        active_version_id: data.version_id,
        version_number: Math.floor(Math.random() * 5) + 1,
        updated_at: new Date().toISOString(),
      } as T;
    }

    // Mock manual enhancement
    if (endpoint === '/enhancement/manual-insert' && method === 'POST') {
      return {
        enhancement_id: this.generateId(),
        anchor_id: this.generateId(),
        status: 'generating',
        estimated_completion: new Date(Date.now() + 30000).toISOString(),
      } as T;
    }

    // Mock highlight enhancement
    if (endpoint === '/enhancement/highlight-insert' && method === 'POST') {
      return {
        enhancement_id: this.generateId(),
        anchor_id: this.generateId(),
        final_prompt: `Detailed fantasy scene: ${data.highlighted_text}`,
        status: 'generating',
      } as T;
    }

    // Mock enhancement delete
    if (endpoint.includes('/enhancement/') && method === 'DELETE') {
      return undefined as T;
    }

    // Default mock response
    return { success: true, message: `Mock response for ${method} ${endpoint}` } as T;
  }

  private calculateWordCount(content: string | undefined | null): number {
    if (!content || !content.trim()) return 0;
    return content.trim().split(/\s+/).length;
  }
}

// Singleton instance
export const apiClient = new MyWorksApiClient();

// Error handling utilities
export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'error' in error && 'message' in error;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return isApiError(error) && 'retry_after' in error;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}