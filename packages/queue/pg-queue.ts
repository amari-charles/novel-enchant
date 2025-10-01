import { JobQueueBase, ID } from "../abstracts/abstracts.ts";
import { supa } from "../dal/db.ts";

export class PgJobQueue extends JobQueueBase {
  async enqueue<T>(type:string,payload:T,opts?:{runAfter?:Date;idempotencyKey?:string;maxAttempts?:number;userId?:ID;runId?:ID;sceneId?:ID;}):Promise<void>{
    const row:any={ type, payload, run_after: opts?.runAfter ?? new Date(), max_attempts: opts?.maxAttempts ?? 3, user_id: opts?.userId ?? null, run_id: opts?.runId ?? null, scene_id: opts?.sceneId ?? null };
    const { error } = await supa().from("jobs").insert(row);
    if (error) throw error;
  }

  async claimBatch(opts:{batchSize:number;leaseMs:number;workerId:string;perRunConcurrency?:number;perUserLimit?:number;}){
    const leaseDuration = Math.max(1, Math.floor(opts.leaseMs/1000));

    // Use a SQL function to atomically claim jobs
    const { data, error } = await supa().rpc('claim_jobs', {
      worker_id: opts.workerId,
      batch_size: opts.batchSize,
      lease_seconds: leaseDuration
    });

    if (error) {
      // Fallback to manual SQL if RPC doesn't exist
      const sql = `
        with picked as (
          select j.id
          from jobs j
          where j.status='queued' and j.run_after <= now()
            and not exists (select 1 from jobs r where r.run_id=j.run_id and r.status='running')
          order by j.run_after asc
          for update skip locked
          limit ${opts.batchSize}
        )
        update jobs j
        set status='running', reserved_by='${opts.workerId}', lease_until = now() + interval '${leaseDuration} seconds'
        from picked p
        where j.id = p.id
        returning j.id, j.type, j.payload;
      `;

      // For now, we'll simulate this with multiple queries (not atomic but works for development)
      const { data: availableJobs, error: selectError } = await supa()
        .from("jobs")
        .select("id, type, payload")
        .eq("status", "queued")
        .lte("run_after", new Date().toISOString())
        .order("run_after", { ascending: true })
        .limit(opts.batchSize);

      if (selectError) throw selectError;

      if (!availableJobs || availableJobs.length === 0) {
        return [];
      }

      // Update the selected jobs
      const jobIds = availableJobs.map(j => j.id);
      const { error: updateError } = await supa()
        .from("jobs")
        .update({
          status: 'running',
          reserved_by: opts.workerId,
          lease_until: new Date(Date.now() + opts.leaseMs).toISOString()
        })
        .in("id", jobIds);

      if (updateError) throw updateError;

      return availableJobs as Array<{id:ID;type:string;payload:any}>;
    }

    return (data ?? []) as Array<{id:ID;type:string;payload:any}>;
  }

  async complete(id:ID){ const { error } = await supa().from("jobs").update({ status:'completed' }).eq("id", id); if (error) throw error; }
  async fail(id:ID, err:string, backoffSeconds:number){
    const { data, error } = await supa().from("jobs").select("attempts,max_attempts").eq("id", id).single();
    if (error) throw error;
    const attempts = (data?.attempts ?? 0) + 1;
    const status = attempts >= (data?.max_attempts ?? 3) ? 'failed' : 'queued';
    const run_after = new Date(Date.now() + backoffSeconds*1000).toISOString();
    const { error: e2 } = await supa().from("jobs").update({ status, attempts, run_after, last_error: err, reserved_by: null, lease_until: null }).eq("id", id);
    if (e2) throw e2;
  }
}