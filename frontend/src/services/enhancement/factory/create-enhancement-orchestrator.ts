/**
 * Factory function to create a fully wired EnhancementOrchestrator
 * Instantiates all dependencies and returns a ready-to-use orchestrator
 */

import { AnchorRepository } from '@/lib/repositories/anchor.repository';
import { ChapterRepository } from '@/lib/repositories/chapter.repository';
import { CharacterRepository } from '@/lib/repositories/character.repository';
import { EnhancementRepository } from '@/lib/repositories/enhancement.repository';
import { MediaRepository } from '@/lib/repositories/media.repository';

import { OpenAITextAIClient } from '../adapters/ai-clients/openai-text-ai-client';
import { RunPodImageAIClient } from '../adapters/ai-clients/runpod-image-ai-client';
import { ImageGenerator } from '../adapters/image-generator';
import { ImageStorage } from '../adapters/image-storage';
import { AnchorService } from '../services/anchor.service';
import { CharacterRegistry } from '../services/character-registry';
import { EnhancementOrchestrator } from '../services/enhancement-orchestrator';
import { PromptBuilder } from '../services/prompt-builder';
import { SceneSelector } from '../services/scene-selector';

/**
 * Creates a fully configured EnhancementOrchestrator instance
 * All dependencies are instantiated and wired together
 * @param userId - The ID of the user who owns the content being enhanced
 */
export function createEnhancementOrchestrator(userId: string): EnhancementOrchestrator {
  // Instantiate repositories
  const chapterRepository = new ChapterRepository();
  const anchorRepository = new AnchorRepository();
  const enhancementRepository = new EnhancementRepository();
  const characterRepository = new CharacterRepository();
  const mediaRepository = new MediaRepository();

  // Instantiate AI clients
  // Use RunPod for production, stub for development without credentials
  const imageAIClient = new RunPodImageAIClient();
  const textAIClient = new OpenAITextAIClient(); // Using OpenAI for text/scene extraction

  // Instantiate core services
  const imageGenerator = new ImageGenerator(imageAIClient);
  const characterRegistry = new CharacterRegistry(textAIClient, characterRepository);
  const promptBuilder = new PromptBuilder(imageGenerator, characterRegistry);
  const sceneSelector = new SceneSelector(textAIClient);
  const imageStorage = new ImageStorage(mediaRepository, userId);
  const anchorService = new AnchorService(anchorRepository, chapterRepository);

  // Create and return the orchestrator
  return new EnhancementOrchestrator(
    chapterRepository,
    anchorService,
    enhancementRepository,
    sceneSelector,
    promptBuilder,
    imageStorage
  );
}
