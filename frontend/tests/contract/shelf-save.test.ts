/**
 * Contract Test: POST /api/shelf/save
 * CRITICAL: This test MUST FAIL before implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase-client';
import type { SaveToShelfRequest, SaveToShelfResponse } from '@/features/reader-enhance/types';

describe('POST /api/shelf/save - Contract Test', () => {
  const ENDPOINT = '/api/shelf/save';
  let authToken: string;

  beforeEach(async () => {
    // Setup test user authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword',
    });
    expect(error).toBeNull();
    authToken = data.session?.access_token || '';
    expect(authToken).toBeTruthy();
  });

  describe('Valid Save Requests', () => {
    it('should save completed job to shelf', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_save_123',
        title: 'My Enhanced Story',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(201);

      const data: SaveToShelfResponse = await response.json();
      expect(data).toMatchObject({
        copyId: expect.stringMatching(/^copy_[a-zA-Z0-9]+$/),
        redirectUrl: expect.stringMatching(/^\/shelf\/copy_[a-zA-Z0-9]+$/),
      });
    });

    it('should save with auto-generated title if not provided', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_auto_title_456',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(201);

      const data: SaveToShelfResponse = await response.json();
      expect(data.copyId).toBeTruthy();
      expect(data.redirectUrl).toMatch(/^\/shelf\//);
    });

    it('should create chapter in database', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_db_create_789',
        title: 'Database Test Story',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(201);

      const data: SaveToShelfResponse = await response.json();

      // Verify chapter was created by checking it exists
      const { data: copyData, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', data.copyId.replace('copy_', ''))
        .single();

      expect(error).toBeNull();
      expect(copyData).toBeTruthy();
      expect(copyData.title).toBe(request.title);
      expect(copyData.private).toBe(true);
    });

    it('should set cover image from first accepted scene', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_cover_image',
        title: 'Cover Image Test',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(201);

      const data: SaveToShelfResponse = await response.json();

      // Verify chapter has cover image
      const { data: copyData } = await supabase
        .from('chapters')
        .select('cover_image_url, chapters')
        .eq('id', data.copyId.replace('copy_', ''))
        .single();

      expect(copyData?.cover_image_url).toBeTruthy();
      expect(copyData?.cover_image_url).toMatch(/^https?:\/\//);
    });
  });

  describe('Request Validation', () => {
    it('should reject request without jobId', async () => {
      const request = {
        title: 'Test Story',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('jobId');
    });

    it('should reject empty jobId', async () => {
      const request: SaveToShelfRequest = {
        jobId: '',
        title: 'Test Story',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('jobId');
    });

    it('should reject title longer than 255 characters', async () => {
      const longTitle = 'a'.repeat(256);
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_long_title',
        title: longTitle,
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('title');
      expect(data.error).toContain('255');
    });
  });

  describe('Job Status Validation', () => {
    it('should reject incomplete job', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_incomplete_running',
        title: 'Incomplete Job Test',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('completed');
      expect(data.error).toContain('accepted');
    });

    it('should reject failed job', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_failed_status',
        title: 'Failed Job Test',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('completed');
    });

    it('should reject job with no accepted images', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_no_accepted',
        title: 'No Accepted Images Test',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('accepted');
      expect(data.error).toContain('image');
    });
  });

  describe('Not Found Scenarios', () => {
    it('should return 404 for non-existent job', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_nonexistent_999',
        title: 'Non-existent Job Test',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toContain('not found');
    });
  });

  describe('Authentication', () => {
    it('should reject request without authentication', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_auth_test',
        title: 'Auth Test Story',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it('should reject request with invalid token', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_invalid_token',
        title: 'Invalid Token Test',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_token',
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(401);
    });

    it('should reject access to other user\'s jobs', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_other_user_completed',
        title: 'Other User Test',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Privacy and Security', () => {
    it('should create private enhanced copy', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_privacy_test',
        title: 'Privacy Test Story',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(201);

      const data: SaveToShelfResponse = await response.json();

      // Verify chapter is private
      const { data: copyData } = await supabase
        .from('chapters')
        .select('private')
        .eq('id', data.copyId.replace('copy_', ''))
        .single();

      expect(copyData?.private).toBe(true);
    });

    it('should associate copy with correct user', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_user_test',
        title: 'User Association Test',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(201);

      const data: SaveToShelfResponse = await response.json();

      // Verify chapter belongs to authenticated user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data: copyData } = await supabase
        .from('chapters')
        .select('user_id')
        .eq('id', data.copyId.replace('copy_', ''))
        .single();

      expect(copyData?.user_id).toBe(userId);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return proper response schema', async () => {
      const request: SaveToShelfRequest = {
        jobId: 'job_completed_schema_test',
        title: 'Schema Test Story',
      };

      const response = await fetch(`http://localhost:3000${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(201);

      const data: SaveToShelfResponse = await response.json();

      // Required fields
      expect(data).toHaveProperty('copyId');
      expect(data).toHaveProperty('redirectUrl');

      // Field types and formats
      expect(typeof data.copyId).toBe('string');
      expect(typeof data.redirectUrl).toBe('string');

      expect(data.copyId).toMatch(/^copy_[a-zA-Z0-9]+$/);
      expect(data.redirectUrl).toMatch(/^\/shelf\/copy_[a-zA-Z0-9]+$/);

      // Values should be meaningful
      expect(data.copyId.length).toBeGreaterThan(5);
      expect(data.redirectUrl.length).toBeGreaterThan(7);
    });
  });
});