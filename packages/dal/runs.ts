import { supa } from "./db.ts";
export async function createRun(chapterId:string|null, snapshot:any, client?:any, userId?:string){
  const db = client || supa();
  const insertData: any = { status: "queued", ...snapshot };
  if (chapterId) insertData.chapter_id = chapterId;
  if (userId) insertData.user_id = userId;
  const { data, error } = await db.from("enhancement_runs").insert(insertData).select("id").single();
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