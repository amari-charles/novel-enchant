/**
 * Factory function to create a fully wired EnhancementOrchestrator
 * Instantiates all dependencies and returns a ready-to-use orchestrator
 */

import { EnhancementOrchestrator } from './EnhancementOrchestrator';
import { ChapterRepository } from './repositories/ChapterRepository';
import { StoryRepository } from './repositories/StoryRepository';
import { AnchorRepository } from './repositories/AnchorRepository';
import { EnhancementRepository } from './repositories/EnhancementRepository';
import { CharacterRepository } from './repositories/CharacterRepository';
import { AnchorService } from './AnchorService';
import { SceneSelector } from './SceneSelector';
import { PromptBuilder } from './PromptBuilder';
import { ImageGenerator } from './ImageGenerator';
import { ImageStorage } from './ImageStorage';
import { CharacterRegistry } from './CharacterRegistry';
import { StubImageAIClient } from './StubImageAIClient';
import { StubTextAIClient } from './StubTextAIClient';
import { OpenAITextAIClient } from './OpenAITextAIClient';
import { MediaRepository } from './repositories/MediaRepository';

/**
 * Creates a fully configured EnhancementOrchestrator instance
 * All dependencies are instantiated and wired together
 * @param userId - The ID of the user who owns the content being enhanced
 */
export function createEnhancementOrchestrator(userId: string): EnhancementOrchestrator {
  // Instantiate repositories
  const chapterRepository = new ChapterRepository();
  const storyRepository = new StoryRepository();
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
    storyRepository,
    anchorService,
    enhancementRepository,
    sceneSelector,
    promptBuilder,
    imageStorage
  );
}
