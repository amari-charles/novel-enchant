/**
 * Factory function to create a fully wired EnhancementOrchestrator
 * Instantiates all dependencies and returns a ready-to-use orchestrator
 */

import { EnhancementOrchestrator } from '../services/enhancement-orchestrator';
import { ChapterRepository } from '@/lib/repositories/chapter.repository';
import { AnchorRepository } from '@/lib/repositories/anchor.repository';
import { EnhancementRepository } from '@/lib/repositories/enhancement.repository';
import { CharacterRepository } from '@/lib/repositories/character.repository';
import { AnchorService } from '../services/anchor.service';
import { SceneSelector } from '../services/scene-selector';
import { PromptBuilder } from '../services/prompt-builder';
import { ImageGenerator } from '../adapters/image-generator';
import { ImageStorage } from '../adapters/image-storage';
import { CharacterRegistry } from '../services/character-registry';
import { StubImageAIClient } from '../adapters/ai-clients/stub-image-ai-client';
import { OpenAITextAIClient } from '../adapters/ai-clients/openai-text-ai-client';
import { MediaRepository } from '@/lib/repositories/media.repository';

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
  const imageAIClient = new StubImageAIClient(); // TODO: Replace with OpenAIImageAIClient when ready
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
