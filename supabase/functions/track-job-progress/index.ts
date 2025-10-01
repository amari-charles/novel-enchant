/**
 * Supabase Edge Function: Track Enhancement Job Progress
 * Manages and updates enhancement job status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackProgressRequest {
  jobId: string;
  action: 'start' | 'updateProgress' | 'complete' | 'fail';
  progress?: number;
  status?: string;
  error?: string;
  data?: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { jobId, action, progress, status, error, data } = await req.json() as TrackProgressRequest;

    if (!jobId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: jobId and action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'start':
        updateData = {
          ...updateData,
          status: 'running',
          progress: 0,
          started_at: new Date().toISOString(),
        };
        break;

      case 'updateProgress':
        if (progress !== undefined) {
          updateData.progress = Math.min(100, Math.max(0, progress));
        }
        if (status) {
          updateData.status = status;
        }
        if (data) {
          const { data: currentJob } = await supabase
            .from('enhance_jobs')
            .select('result_json')
            .eq('id', jobId)
            .single();

          updateData.result_json = {
            ...(currentJob?.result_json || {}),
            ...data,
          };
        }
        break;

      case 'complete':
        updateData = {
          ...updateData,
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
        };
        if (data) {
          updateData.result_json = data;
        }
        break;

      case 'fail':
        updateData = {
          ...updateData,
          status: 'failed',
          error_message: error || 'Unknown error',
          failed_at: new Date().toISOString(),
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Update job
    const { data: updatedJob, error: updateError } = await supabase
      .from('enhance_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update job: ${updateError.message}`);
    }

    // Send notification if job completed or failed
    if (action === 'complete' || action === 'fail') {
      await notifyJobCompletion(supabase, jobId, updatedJob);
    }

    return new Response(
      JSON.stringify({
        success: true,
        job: updatedJob,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Track progress error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to track progress' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function notifyJobCompletion(supabase: any, jobId: string, job: any): Promise<void> {
  try {
    // Log completion event
    await supabase
      .from('debug_logs')
      .insert({
        level: job.status === 'completed' ? 'info' : 'error',
        message: `Enhancement job ${job.status}`,
        context: {
          jobId,
          userId: job.user_id,
          progress: job.progress,
          error: job.error_message,
        },
        created_at: new Date().toISOString(),
      });

    // Could also send email notification, push notification, etc.
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}