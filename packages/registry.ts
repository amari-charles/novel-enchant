import { SupabaseStorageAdapter } from "./providers/storage/supabase-storage.ts";
import { SupabaseUrlService } from "./providers/url/supabase-url.ts";
import { PgJobQueue } from "./queue/pg-queue.ts";

export const Registry = {
  storage: () => new SupabaseStorageAdapter(),
  url: () => new SupabaseUrlService(),
  queue: () => new PgJobQueue(),
  // stubs (fill later):
  textAnalysis: () => ({ analyzeChapter: async ({text,cap}:{text:string;cap?:number}) => ({ scenes: [] }) }),
  consistency: () => ({ buildContext: async () => ({ tokens: [] as string[] }) }),
  prompting: () => ({ buildImagePrompt: async (i:any) => ({ prompt: i.scene.description, width: i.imageDefaults.width, height: i.imageDefaults.height, format: i.imageDefaults.format, mode: i.mode }) }),
  moderation: () => ({ checkText: async () => ({ allowed: true as const }) }),
  imageGen: () => ({ generate: async () => ({ kind:'url' as const, url:'data:,stub' }) })
};