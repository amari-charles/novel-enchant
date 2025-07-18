/**
 * Assess Image Quality Function
 * Evaluates the quality of generated images using AI and heuristic analysis
 */

import { handleError, ProcessingError, AIAPIError } from '../../../shared/errors.ts';
import { QualityReport, Prompt, Scene, FunctionResponse } from '../../../shared/types.ts';
import { validateAssessImageQualityInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { createOpenAIClient } from '../../utilities/ai-client/index.ts';
import { PROCESSING_PARAMS } from '../../../shared/constants.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const assessImageQuality = async (
  imageUrl: string,
  prompt: Prompt,
  sceneContext?: Scene
): Promise<QualityReport> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting image quality assessment', { 
      imageUrl: imageUrl.substring(0, 50) + '...',
      promptId: prompt.id,
      hasSceneContext: !!sceneContext
    });
    
    // Validate image URL accessibility
    await validateImageAccessibility(imageUrl);
    
    // Perform multiple quality assessments
    const assessments = await Promise.all([
      assessPromptAdherence(imageUrl, prompt, sceneContext),
      assessTechnicalQuality(imageUrl),
      assessAestheticQuality(imageUrl, prompt.style),
      assessContentAppropriatenesss(imageUrl, prompt),
    ]);
    
    // Combine assessments into final report
    const qualityReport = combineQualityAssessments(assessments, prompt);
    
    const endTime = performance.now();
    logInfo('Image quality assessment completed', {
      processingTime: `${endTime - startTime}ms`,
      qualityScore: qualityReport.qualityScore,
      issuesFound: qualityReport.issues.length,
      suggestionsCount: qualityReport.suggestions.length
    });
    
    return qualityReport;
    
  } catch (error) {
    logError(error as Error, { 
      imageUrl: imageUrl.substring(0, 50) + '...',
      promptId: prompt.id 
    });
    
    if (error instanceof AIAPIError) {
      throw new ProcessingError(`Quality assessment failed: ${error.message}`, { originalError: error });
    }
    
    throw error;
  }
};

// ============================================================================
// IMAGE ACCESSIBILITY VALIDATION
// ============================================================================

const validateImageAccessibility = async (imageUrl: string): Promise<void> => {
  try {
    // Validate URL format
    new URL(imageUrl);
    
    // For now, this is mocked - in production it would check if image is accessible
    await mockValidateImageAccessibility(imageUrl);
    
  } catch (error) {
    throw new ProcessingError(`Image not accessible: ${error.message}`);
  }
};

const mockValidateImageAccessibility = async (imageUrl: string): Promise<void> => {
  // Mock image accessibility check
  logInfo('Mock image accessibility validation', { imageUrl: imageUrl.substring(0, 50) + '...' });
  
  // Simulate network check
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock failure scenarios
  if (imageUrl.includes('invalid') || imageUrl.includes('broken')) {
    throw new Error('Image URL is not accessible');
  }
};

// ============================================================================
// PROMPT ADHERENCE ASSESSMENT
// ============================================================================

const assessPromptAdherence = async (
  imageUrl: string,
  prompt: Prompt,
  sceneContext?: Scene
): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
  analysis: string;
}> => {
  try {
    // For now, this is mocked - in production it would use OpenAI Vision API
    // const openAIClient = createOpenAIClient();
    // const assessment = await openAIClient.assessImageQuality(imageUrl, prompt.text, sceneContext?.description);
    
    // Mock implementation for testing
    const mockAssessment = await mockAssessPromptAdherence(imageUrl, prompt, sceneContext);
    
    return mockAssessment;
    
  } catch (error) {
    logError(error as Error, { imageUrl: imageUrl.substring(0, 50) + '...', promptId: prompt.id });
    
    // Return fallback assessment on error
    return {
      score: 0.5,
      issues: ['Unable to assess prompt adherence due to API error'],
      suggestions: ['Retry assessment when service is available'],
      analysis: 'Assessment failed - using fallback scoring',
    };
  }
};

const mockAssessPromptAdherence = async (
  imageUrl: string,
  prompt: Prompt,
  sceneContext?: Scene
): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
  analysis: string;
}> => {
  // Mock prompt adherence assessment
  logInfo('Mock prompt adherence assessment', { 
    promptLength: prompt.text.length,
    hasSceneContext: !!sceneContext 
  });
  
  // Simulate AI analysis time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 0.8; // Base score
  
  // Mock analysis based on prompt content
  const promptText = prompt.text.toLowerCase();
  
  // Check for common prompt elements
  if (promptText.includes('character') || promptText.includes('person')) {
    if (Math.random() < 0.1) {
      issues.push('Character features may not match description exactly');
      suggestions.push('Consider more specific character descriptions');
      score -= 0.1;
    }
  }
  
  if (promptText.includes('fantasy') || promptText.includes('magical')) {
    if (Math.random() < 0.05) {
      issues.push('Magical elements could be more prominent');
      suggestions.push('Enhance magical effects in the prompt');
      score -= 0.05;
    }
  }
  
  if (promptText.includes('detailed') || promptText.includes('high quality')) {
    score += 0.1; // Bonus for quality keywords
  }
  
  // Scene context analysis
  if (sceneContext) {
    if (sceneContext.emotionalTone) {
      if (Math.random() < 0.08) {
        issues.push(`Emotional tone (${sceneContext.emotionalTone}) could be more evident`);
        suggestions.push(`Emphasize ${sceneContext.emotionalTone} atmosphere in future generations`);
        score -= 0.05;
      }
    }
    
    if (sceneContext.timeOfDay) {
      if (Math.random() < 0.05) {
        issues.push(`Time of day (${sceneContext.timeOfDay}) lighting could be improved`);
        suggestions.push(`Specify ${sceneContext.timeOfDay} lighting conditions more clearly`);
        score -= 0.03;
      }
    }
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(1, score));
  
  const analysis = `Image generally follows the prompt with a ${Math.round(score * 100)}% adherence score. ${issues.length > 0 ? 'Some areas for improvement identified.' : 'No major adherence issues detected.'}`;
  
  return {
    score,
    issues,
    suggestions,
    analysis,
  };
};

// ============================================================================
// TECHNICAL QUALITY ASSESSMENT
// ============================================================================

const assessTechnicalQuality = async (imageUrl: string): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
  metrics: {
    sharpness: number;
    exposure: number;
    composition: number;
    artifacts: number;
  };
}> => {
  // Mock technical quality assessment
  logInfo('Mock technical quality assessment', { imageUrl: imageUrl.substring(0, 50) + '...' });
  
  // Simulate analysis time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Mock quality metrics
  const metrics = {
    sharpness: 0.8 + Math.random() * 0.2,
    exposure: 0.7 + Math.random() * 0.3,
    composition: 0.75 + Math.random() * 0.25,
    artifacts: Math.random() * 0.2, // Lower is better
  };
  
  // Check for issues based on metrics
  if (metrics.sharpness < 0.7) {
    issues.push('Image appears slightly blurry or out of focus');
    suggestions.push('Increase sampling steps or use sharper sampling methods');
  }
  
  if (metrics.exposure < 0.6) {
    issues.push('Image may be under/overexposed');
    suggestions.push('Adjust lighting keywords in prompt');
  }
  
  if (metrics.composition < 0.6) {
    issues.push('Composition could be improved');
    suggestions.push('Add composition keywords like "centered", "rule of thirds"');
  }
  
  if (metrics.artifacts > 0.15) {
    issues.push('Some visual artifacts detected');
    suggestions.push('Try different sampling methods or increase quality settings');
  }
  
  // Calculate overall technical score
  const score = (metrics.sharpness + metrics.exposure + metrics.composition + (1 - metrics.artifacts)) / 4;
  
  return {
    score: Math.max(0, Math.min(1, score)),
    issues,
    suggestions,
    metrics,
  };
};

// ============================================================================
// AESTHETIC QUALITY ASSESSMENT
// ============================================================================

const assessAestheticQuality = async (
  imageUrl: string,
  style: string
): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
  styleConsistency: number;
}> => {
  // Mock aesthetic quality assessment
  logInfo('Mock aesthetic quality assessment', { 
    imageUrl: imageUrl.substring(0, 50) + '...',
    style 
  });
  
  // Simulate analysis time
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Mock style consistency based on style type
  let styleConsistency = 0.8;
  let aestheticScore = 0.75;
  
  switch (style) {
    case 'fantasy':
      if (Math.random() < 0.1) {
        issues.push('Fantasy elements could be more prominent');
        suggestions.push('Enhance magical or fantastical aspects');
        styleConsistency -= 0.1;
      }
      break;
      
    case 'realistic':
      if (Math.random() < 0.08) {
        issues.push('Some elements appear slightly stylized');
        suggestions.push('Emphasize photorealistic rendering');
        styleConsistency -= 0.08;
      }
      break;
      
    case 'anime':
      if (Math.random() < 0.12) {
        issues.push('Anime style characteristics could be stronger');
        suggestions.push('Enhance anime-specific visual elements');
        styleConsistency -= 0.12;
      }
      break;
  }
  
  // General aesthetic factors
  if (Math.random() < 0.05) {
    issues.push('Color harmony could be improved');
    suggestions.push('Consider better color coordination');
    aestheticScore -= 0.05;
  }
  
  if (Math.random() < 0.03) {
    issues.push('Visual balance needs attention');
    suggestions.push('Improve element placement and visual weight distribution');
    aestheticScore -= 0.03;
  }
  
  // Positive factors
  if (Math.random() < 0.2) {
    aestheticScore += 0.1; // Bonus for particularly good aesthetics
  }
  
  const finalScore = (aestheticScore + styleConsistency) / 2;
  
  return {
    score: Math.max(0, Math.min(1, finalScore)),
    issues,
    suggestions,
    styleConsistency: Math.max(0, Math.min(1, styleConsistency)),
  };
};

// ============================================================================
// CONTENT APPROPRIATENESS ASSESSMENT
// ============================================================================

const assessContentAppropriatenesss = async (
  imageUrl: string,
  prompt: Prompt
): Promise<{
  score: number;
  issues: string[];
  warnings: string[];
  safe: boolean;
}> => {
  // Mock content safety assessment
  logInfo('Mock content appropriateness assessment', { 
    imageUrl: imageUrl.substring(0, 50) + '...',
    promptId: prompt.id 
  });
  
  // Simulate safety check time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const issues: string[] = [];
  const warnings: string[] = [];
  let safe = true;
  let score = 1.0;
  
  // Mock safety checks based on prompt content
  const promptText = prompt.text.toLowerCase();
  
  // Check for potentially problematic content
  const concerningKeywords = ['violence', 'weapon', 'blood', 'dark', 'horror'];
  const foundConcerns = concerningKeywords.filter(keyword => promptText.includes(keyword));
  
  if (foundConcerns.length > 0) {
    warnings.push(`Content may contain: ${foundConcerns.join(', ')}`);
    score -= foundConcerns.length * 0.1;
  }
  
  // Very rare safety issues (mock)
  if (Math.random() < 0.01) {
    issues.push('Potential content policy violation detected');
    safe = false;
    score = 0;
  }
  
  // Check negative prompt for safety keywords
  if (prompt.negativePrompt) {
    const hasNegativeSafety = prompt.negativePrompt.toLowerCase().includes('inappropriate') ||
                             prompt.negativePrompt.toLowerCase().includes('nsfw');
    if (hasNegativeSafety) {
      score += 0.1; // Bonus for explicit safety measures
    }
  }
  
  return {
    score: Math.max(0, Math.min(1, score)),
    issues,
    warnings,
    safe,
  };
};

// ============================================================================
// QUALITY REPORT COMBINATION
// ============================================================================

const combineQualityAssessments = (
  assessments: [
    ReturnType<typeof mockAssessPromptAdherence> extends Promise<infer T> ? T : never,
    Awaited<ReturnType<typeof assessTechnicalQuality>>,
    Awaited<ReturnType<typeof assessAestheticQuality>>,
    Awaited<ReturnType<typeof assessContentAppropriatenesss>>
  ],
  prompt: Prompt
): QualityReport => {
  const [promptAssessment, technicalAssessment, aestheticAssessment, contentAssessment] = assessments;
  
  // Weight the different assessment components
  const weights = {
    prompt: 0.4,      // 40% - How well it matches the prompt
    technical: 0.3,   // 30% - Technical image quality
    aesthetic: 0.2,   // 20% - Aesthetic appeal
    content: 0.1,     // 10% - Content safety (binary impact)
  };
  
  // Calculate weighted quality score
  let qualityScore = (
    promptAssessment.score * weights.prompt +
    technicalAssessment.score * weights.technical +
    aestheticAssessment.score * weights.aesthetic +
    contentAssessment.score * weights.content
  );
  
  // Content safety override
  if (!contentAssessment.safe) {
    qualityScore = Math.min(qualityScore, 0.3); // Cap at 30% if unsafe
  }
  
  // Combine all issues and suggestions
  const allIssues = [
    ...promptAssessment.issues,
    ...technicalAssessment.issues,
    ...aestheticAssessment.issues,
    ...contentAssessment.issues,
    ...contentAssessment.warnings,
  ];
  
  const allSuggestions = [
    ...promptAssessment.suggestions,
    ...technicalAssessment.suggestions,
    ...aestheticAssessment.suggestions,
  ];
  
  // Add overall recommendations based on score
  if (qualityScore < 0.6) {
    allSuggestions.push('Consider regenerating with modified prompt');
  }
  
  if (qualityScore > 0.9) {
    allSuggestions.push('Excellent quality - consider using as reference');
  }
  
  return {
    qualityScore: Math.max(0, Math.min(1, qualityScore)),
    issues: [...new Set(allIssues)], // Remove duplicates
    suggestions: [...new Set(allSuggestions)], // Remove duplicates
    metrics: {
      promptAdherence: promptAssessment.score,
      technicalQuality: technicalAssessment.score,
      aestheticScore: aestheticAssessment.score,
    },
  };
};

// ============================================================================
// SUPABASE EDGE FUNCTION HANDLER
// ============================================================================

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' },
      timestamp: new Date().toISOString(),
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Validate and parse request body
    const body = await validateRequestBody(req);
    const input = validateAssessImageQualityInput(body);
    
    // Execute the core function
    const result = await assessImageQuality(
      input.imageUrl,
      input.prompt,
      input.sceneContext
    );
    
    // Return successful response
    const response: FunctionResponse<QualityReport> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    const errorResponse = handleError(error);
    
    return new Response(JSON.stringify(errorResponse), {
      status: error.code === 'VALIDATION_ERROR' ? 400 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// ============================================================================
// ALTERNATIVE DIRECT EXPORT (for testing)
// ============================================================================

// Export the core function for testing and internal use
export { assessImageQuality as coreFunction };