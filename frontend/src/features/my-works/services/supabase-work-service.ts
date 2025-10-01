import { supabase } from "../../../lib/supabase";
import type {
  Work,
  CreateWorkRequest,
  UpdateWorkRequest,
  WorksQueryParams,
} from '../types';

export class SupabaseWorkService {
  /**
   * Fetch paginated list of works for the current user
   */
  static async listWorks(params: WorksQueryParams = {}): Promise<{
    works: Work[];
    total: number;
    has_more: boolean;
  }> {
    const limit = params.limit || 20;
    const offset = params.offset || 0;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000123'; // Fallback to test user

    // Build query
    let query = supabase
      .from('works')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.publication_status) {
      query = query.eq('publication_status', params.publication_status);
    }

    // Apply sorting
    const orderColumn = params.sort_by || 'updated_at';
    const ascending = params.sort_order === 'asc';
    query = query.order(orderColumn, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching works:', error);
      // Return empty result on error
      return { works: [], total: 0, has_more: false };
    }

    return {
      works: data || [],
      total: count || 0,
      has_more: (count || 0) > offset + limit,
    };
  }

  /**
   * Fetch single work with full details
   */
  static async getWork(workId: string): Promise<Work> {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('id', workId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch work: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new work
   */
  static async createWork(data: CreateWorkRequest): Promise<Work> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000123';

    const { data: newWork, error } = await supabase
      .from('works')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        status: 'draft',
        auto_enhance_enabled: data.auto_enhance_enabled ?? true,
        target_scenes_per_chapter: data.target_scenes_per_chapter ?? 4,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create work: ${error.message}`);
    }

    return newWork;
  }

  /**
   * Update existing work metadata
   */
  static async updateWork(workId: string, data: UpdateWorkRequest): Promise<Work> {
    const { data: updatedWork, error } = await supabase
      .from('works')
      .update({
        title: data.title,
        description: data.description,
        status: data.status,
        auto_enhance_enabled: data.auto_enhance_enabled,
        target_scenes_per_chapter: data.target_scenes_per_chapter,
      })
      .eq('id', workId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update work: ${error.message}`);
    }

    return updatedWork;
  }

  /**
   * Delete a work and all associated data
   */
  static async deleteWork(workId: string): Promise<void> {
    const { error } = await supabase
      .from('works')
      .delete()
      .eq('id', workId);

    if (error) {
      throw new Error(`Failed to delete work: ${error.message}`);
    }
  }

  /**
   * Archive a work (soft delete)
   */
  static async archiveWork(workId: string): Promise<Work> {
    const { data, error } = await supabase
      .from('works')
      .update({ status: 'archived' })
      .eq('id', workId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to archive work: ${error.message}`);
    }

    return data;
  }

  /**
   * Unarchive a work
   */
  static async unarchiveWork(workId: string): Promise<Work> {
    const { data, error } = await supabase
      .from('works')
      .update({ status: 'draft' })
      .eq('id', workId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to unarchive work: ${error.message}`);
    }

    return data;
  }
}