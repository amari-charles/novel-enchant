import { supa } from "./db.ts";
export async function insertScenes(runId:string, scenes:Array<{idx:number;title:string;description:string;characters:any}>){
  const rows = scenes.map(s=>({ enhancement_run_id: runId, ...s }));
  const { error } = await supa().from("scenes").insert(rows);
  if (error) throw error;
}
export async function getScenes(runId:string){
  const { data, error } = await supa().from("scenes").select("*").eq("enhancement_run_id", runId).order("idx");
  if (error) throw error; return data!;
}
export async function setSceneStatus(sceneId:string, status:string){
  const { error } = await supa().from("scenes").update({ status }).eq("id", sceneId);
  if (error) throw error;
}
export async function setCurrentImage(sceneId:string, imageId:string){
  const { error } = await supa().from("scenes_current_image")
    .upsert({ scene_id: sceneId, image_id: imageId });
  if (error) throw error;
}