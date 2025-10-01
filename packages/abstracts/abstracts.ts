export type ID = string;
export type ImageFormat = 'webp'|'png'|'jpg';
export type Scene = { title: string; description: string; characters: string[] };
export type PromptBuild = { prompt: string; negative?: string; width: number; height: number; format: ImageFormat; seed?: number; mode: 'character_scene'|'background_only' };
export type GenOutput =
  | { kind:'stream'; stream: ReadableStream<Uint8Array>; format?: ImageFormat; width?: number; height?: number }
  | { kind:'url'; url: string; format?: ImageFormat; width?: number; height?: number };
export type StoredAsset = { storagePath: string; format: ImageFormat; width?: number; height?: number };
export type ProvidersKey = { textProvider?: string; imageProvider?: string; moderationProvider?: string; consistencyPolicy?: string; pipelineVersion?: string };

export abstract class TextAnalysisProviderBase { abstract analyzeChapter(input:{text:string;cap?:number}):Promise<{scenes:Scene[]}>; }
export abstract class CharacterMemoryRepoBase { abstract getCharacters(input:{storyId:ID;names?:string[]}):Promise<{active:Array<{id:ID;canonicalName:string;aliases:string[];descriptor:any}>;stubs:Array<{canonicalName:string;aliases:string[]}>}>; }
export abstract class ConsistencyEngineBase { abstract buildContext(input:{storyId:ID;chapterId:ID;sceneCharacters:string[]}):Promise<{tokens:string[];seedHint?:number;refs?:Array<{storagePath:string;role:'character'|'style';characterId?:ID}>}>; }
export abstract class PromptingPipelineBase { abstract buildImagePrompt(input:{scene:Scene;stylePreset?:string;consistency:Awaited<ReturnType<ConsistencyEngineBase['buildContext']>>;imageDefaults:{width:number;height:number;format:ImageFormat};mode:'character_scene'|'background_only';}):Promise<PromptBuild>; }
export abstract class ModerationProviderBase { abstract checkText(input:{text:string}):Promise<{allowed:true}|{allowed:false;reasons:string[]}>; }
export abstract class ImageGenProviderBase { abstract generate(input:{prompt:string;negativePrompt?:string;width:number;height:number;format:ImageFormat;seed?:number;refs?:Array<{storagePath:string;role:'character'|'style'}>;}):Promise<GenOutput>; }
export abstract class ImageStorageAdapterBase {
  abstract persist(gen:GenOutput, opts:{pathHint:string;contentType?:string}):Promise<StoredAsset>;
  abstract ingestUpload(file:ReadableStream<Uint8Array>, opts:{pathHint:string;contentType?:string}):Promise<StoredAsset>;
  abstract ingestExternal(url:string, opts:{pathHint:string;contentType?:string}):Promise<StoredAsset>;
  protected inferContentType(fmt?:ImageFormat){return fmt==='png'?'image/png':fmt==='jpg'?'image/jpeg':'image/webp';}
}
export abstract class UrlServiceBase { abstract signedUrl(storagePath:string, ttlSeconds:number):Promise<string>; abstract publicUrl(storagePath:string):Promise<string>; }
export abstract class JobQueueBase {
  abstract enqueue<T>(type:string,payload:T,opts?:{runAfter?:Date;idempotencyKey?:string;maxAttempts?:number;userId?:ID;runId?:ID;sceneId?:ID;}):Promise<void>;
  abstract claimBatch(opts:{batchSize:number;leaseMs:number;workerId:string;perRunConcurrency?:number;perUserLimit?:number;}):Promise<Array<{id:ID;type:string;payload:any}>>;
  abstract complete(id:ID):Promise<void>;
  abstract fail(id:ID, err:string, backoffSeconds:number):Promise<void>;
}
export abstract class PolicyEngineBase {
  abstract selectForRun(input:{userId:ID;chapterId:ID}):Promise<{capScenes:number;imageDefaults:{width:number;height:number;format:ImageFormat};textProvider:string;imageProvider:string;moderationProvider:string;consistencyPolicy:string;pipelineVersion:string;}>;
}
export abstract class StatusProjectionBase {
  abstract getRunStatus(runId:ID):Promise<{status:'queued'|'analyzing'|'generating'|'uploading'|'completed'|'failed';scenes:Array<{sceneId:ID;idx:number;title:string;currentImage?:{storagePath:string}}>;startedAt:string;finishedAt?:string;}>;
}

export abstract class EnhancementOrchestratorBase {
  abstract startAutoEnhancement(chapterId:ID, opts?:{stylePreset?:string;capScenes?:number;providers?:ProvidersKey}):Promise<{runId:ID}>;
  abstract retryRun(runId:ID, opts?:{providers?:ProvidersKey}):Promise<{newRunId:ID}>;
  abstract retryScene(sceneId:ID, opts?:{tweak?:Record<string,unknown>}):Promise<{imageAttemptId:ID}>;
  abstract insertManualScene(chapterId:ID, scene:Scene & {idx?:number}):Promise<{sceneId:ID}>;
  abstract removeScene(sceneId:ID):Promise<void>;
  abstract reorderScene(sceneId:ID,newIndex:number):Promise<void>;
  abstract generateManualImage(sceneId:ID, opts?:{stylePreset?:string;providers?:ProvidersKey}):Promise<{imageAttemptId:ID}>;
  abstract ingestManualImage(sceneId:ID, source:{type:'upload';file:ReadableStream<Uint8Array>;filename?:string;contentType?:string}|{type:'external_url';url:string}):Promise<{imageAttemptId:ID}>;
  abstract acceptImageAttempt(imageAttemptId:ID):Promise<void>;
}