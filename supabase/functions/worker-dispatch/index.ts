import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Registry } from "../../../packages/registry.ts";

const workerId = crypto.randomUUID();
const handlers: Record<string, (p: any) => Promise<void>> = {
  AnalyzeChapter: async ({ runId }) => fetch("http://127.0.0.1:54321/functions/v1/worker-analyze", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId }) }),
  GenerateImage: async ({ sceneId, attempt }) => fetch("http://127.0.0.1:54321/functions/v1/worker-generate", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sceneId, attempt }) }),
  FinalizeRun: async ({ runId }) => fetch("http://127.0.0.1:54321/functions/v1/worker-finalize", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId }) })
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const jobs = await Registry.queue().claimBatch({ batchSize: 5, leaseMs: 120_000, workerId, perRunConcurrency: 1 });

    for (const j of jobs) {
      try {
        await handlers[j.type](j.payload);
        await Registry.queue().complete(j.id);
      }
      catch (e: any) {
        await Registry.queue().fail(j.id, String(e?.message || e), 30);
      }
    }

    return new Response(
      JSON.stringify({ claimed: jobs.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Worker dispatch error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Worker dispatch failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});