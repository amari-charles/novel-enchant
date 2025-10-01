import { supa } from "./db.ts";
export async function createRun(chapterId:string, snapshot:any){
  const { data, error } = await supa().from("enhancement_runs").insert({
    chapter_id: chapterId, status: "queued", ...snapshot
  }).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function setRunStatus(runId:string, status:string, errorMsg?:string){
  const patch:any = { status };
  if (status==='completed' || status==='failed') patch.finished_at = new Date().toISOString();
  if (errorMsg) patch.error = errorMsg;
  const { error } = await supa().from("enhancement_runs").update(patch).eq("id", runId);
  if (error) throw error;
}