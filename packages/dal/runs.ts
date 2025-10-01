import { supa } from "./db.ts";
export async function createRun(chapterId:string, snapshot:any, client?:any){
  const db = client || supa();
  const { data, error } = await db.from("enhancement_runs").insert({
    chapter_id: chapterId, status: "queued", ...snapshot
  }).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function setRunStatus(runId:string, status:string, errorMsg?:string, client?:any){
  const db = client || supa();
  const patch:any = { status };
  if (status==='completed' || status==='failed') patch.finished_at = new Date().toISOString();
  if (errorMsg) patch.error = errorMsg;
  const { error } = await db.from("enhancement_runs").update(patch).eq("id", runId);
  if (error) throw error;
}