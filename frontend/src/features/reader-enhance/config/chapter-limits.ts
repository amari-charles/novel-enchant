/**
 * Chapter Enhancement Configuration
 * Defines limits and settings for multi-chapter processing
 */

export interface ChapterLimits {
  maxChaptersPerStory: number;
  maxChaptersPerBatch: number;
  defaultBatchSize: number;
}

export const CHAPTER_LIMITS: ChapterLimits = {
  maxChaptersPerStory: 10000,
  maxChaptersPerBatch: 100,
  defaultBatchSize: 10,
};

export interface ChapterRange {
  start: number;
  end: number;
  total: number;
}

export const validateChapterRange = (range: ChapterRange, limits: ChapterLimits): boolean => {
  if (range.start < 1) return false;
  if (range.end < range.start) return false;
  if (range.total > limits.maxChaptersPerStory) return false;
  if ((range.end - range.start + 1) > limits.maxChaptersPerBatch) return false;
  return true;
};

export const calculateChapterBatches = (totalChapters: number, batchSize: number): ChapterRange[] => {
  const batches: ChapterRange[] = [];
  let start = 1;

  while (start <= totalChapters) {
    const end = Math.min(start + batchSize - 1, totalChapters);
    batches.push({
      start,
      end,
      total: totalChapters,
    });
    start = end + 1;
  }

  return batches;
};