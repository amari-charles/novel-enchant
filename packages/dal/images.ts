import { supa } from "./db.ts";
export async function nextAttempt(sceneId:string){
  const { data, error } = await supa().from("scene_images").select("attempt").eq("scene_id", sceneId);
  if (error) throw error;
  const max = (data||[]).reduce((m:any,r:any)=>Math.max(m,r.attempt), -1);
  return max+1;
}
export async function createImageAttempt(sceneId:string, attempt:number, payload:any){
  const { data, error } = await supa().from("scene_images").insert({ scene_id: sceneId, attempt, ...payload }).select("id").single();
  if (error) throw error; return data.id as string;
}
export async function finalizeImage(imageId:string, patch:any){
  const { error } = await supa().from("scene_images").update({ ...patch, status:'completed' }).eq("id", imageId);
  if (error) throw error;
}