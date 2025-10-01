import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { supa } from "../../../packages/dal/db.ts";
import { setRunStatus } from "../../../packages/dal/runs.ts";

serve(async (req) => {
  try {
    const { runId } = await req.json();
    const { data: scenes } = await supa().from("scenes").select("status").eq("enhancement_run_id", runId);
    if (!scenes) return new Response(null, { status: 204 });

    const allTerminal = scenes.every(s => ['completed', 'failed'].includes(s.status));
    if (allTerminal) {
      const anyCompleted = scenes.some(s => s.status === 'completed');
      await setRunStatus(runId, anyCompleted ? 'completed' : 'failed');
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Finalization error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});