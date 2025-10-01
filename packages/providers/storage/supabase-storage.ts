import { ImageStorageAdapterBase, GenOutput, StoredAsset, ImageFormat } from "../../abstracts/abstracts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export class SupabaseStorageAdapter extends ImageStorageAdapterBase {
  constructor(private bucket="enhanced-copies") { super(); }
  private client(){ return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!); }

  async persist(gen:GenOutput, opts:{pathHint:string;contentType?:string}):Promise<StoredAsset>{
    let bytes:Uint8Array; let fmt:ImageFormat = (gen as any).format ?? 'webp';
    if (gen.kind==='url'){ const r=await fetch(gen.url); bytes=new Uint8Array(await r.arrayBuffer()); }
    else { const rd=gen.stream.getReader(); const chunks:Uint8Array[]=[]; for(;;){ const {done,value}=await rd.read(); if(done)break; if(value)chunks.push(value);} const len=chunks.reduce((n,c)=>n+c.length,0); bytes=new Uint8Array(len); let o=0; for(const c of chunks){ bytes.set(c,o); o+=c.length; } }
    const ct = opts.contentType ?? this.inferContentType(fmt);
    const { error } = await this.client().storage.from(this.bucket).upload(opts.pathHint, bytes, { contentType: ct, upsert: true });
    if (error) throw error; return { storagePath: opts.pathHint, format: fmt };
  }
  async ingestUpload(file:ReadableStream<Uint8Array>, opts:{pathHint:string;contentType?:string}):Promise<StoredAsset>{
    const rd=file.getReader(); const chunks:Uint8Array[]=[]; for(;;){ const {done,value}=await rd.read(); if(done)break; if(value)chunks.push(value);} const len=chunks.reduce((n,c)=>n+c.length,0); const bytes=new Uint8Array(len); let o=0; for(const c of chunks){ bytes.set(c,o); o+=c.length; }
    const ct=opts.contentType ?? 'image/webp';
    const { error } = await this.client().storage.from(this.bucket).upload(opts.pathHint, bytes, { contentType: ct, upsert: true });
    if (error) throw error; return { storagePath: opts.pathHint, format: ct.includes('png')?'png':ct.includes('jpeg')?'jpg':'webp' as ImageFormat };
  }
  async ingestExternal(url:string, opts:{pathHint:string;contentType?:string}):Promise<StoredAsset>{
    const r=await fetch(url); const buf=new Uint8Array(await r.arrayBuffer()); const ct=opts.contentType ?? r.headers.get('content-type') ?? 'image/webp';
    const { error } = await this.client().storage.from(this.bucket).upload(opts.pathHint, buf, { contentType: ct, upsert: true });
    if (error) throw error; return { storagePath: opts.pathHint, format: ct.includes('png')?'png':ct.includes('jpeg')?'jpg':'webp' as ImageFormat };
  }
}