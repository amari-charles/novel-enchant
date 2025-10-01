import { UrlServiceBase } from "../../abstracts/abstracts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
export class SupabaseUrlService extends UrlServiceBase {
  private client(){ return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!); }
  async signedUrl(storagePath:string, ttlSeconds:number){ const { data, error } = await this.client().storage.from("enhanced-copies").createSignedUrl(storagePath, ttlSeconds); if (error) throw error; return data.signedUrl; }
  async publicUrl(storagePath:string){ const { data } = this.client().storage.from("enhanced-copies").getPublicUrl(storagePath); return data.publicUrl; }
}