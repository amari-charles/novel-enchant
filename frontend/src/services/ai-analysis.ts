import type { CreateStoryForm } from '../shared/type-definitions'

// AI Analysis Service for Story Content Processing
export interface AIAnalysisResult {
  title: string
  description: string
  genre: string
  style_preset: CreateStoryForm['style_preset']
  confidence_scores: {
    title: number
    genre: number
    style_preset: number
    description: number
  }
  extracted_characters: string[]
  detected_themes: string[]
  time_period?: string
  setting_type?: string
}

// Genre detection patterns
const GENRE_PATTERNS = {
  fantasy: ['magic', 'dragon', 'wizard', 'sword', 'kingdom', 'quest', 'spell', 'enchanted', 'mystical', 'elven', 'dwarf', 'orc', 'mage', 'sorcerer', 'enchantment', 'potion', 'rune', 'prophecy'],
  scifi: ['space', 'alien', 'robot', 'technology', 'future', 'laser', 'spaceship', 'planet', 'galaxy', 'cyborg', 'android', 'quantum', 'neural', 'hologram', 'starship', 'orbital'],
  romance: ['love', 'heart', 'kiss', 'romance', 'passion', 'wedding', 'dating', 'relationship', 'romantic', 'beloved', 'crush', 'attraction', 'intimate', 'tender', 'affection'],
  thriller: ['murder', 'crime', 'detective', 'investigation', 'suspense', 'mystery', 'killer', 'danger', 'chase', 'escape', 'conspiracy', 'secret', 'betrayal', 'revenge', 'evidence'],
  historical: ['century', 'war', 'king', 'queen', 'empire', 'castle', 'medieval', 'ancient', 'colonial', 'victorian', 'renaissance', 'revolution', 'battle', 'throne', 'nobility'],
  contemporary: ['modern', 'city', 'phone', 'internet', 'computer', 'apartment', 'office', 'university', 'coffee', 'social media', 'technology', 'urban', 'lifestyle']
}

// Style preset mapping based on genre and themes
const STYLE_MAPPING = {
  fantasy: 'fantasy',
  scifi: 'scifi',
  'science fiction': 'scifi',
  romance: 'romance',
  thriller: 'thriller',
  mystery: 'thriller',
  crime: 'thriller',
  historical: 'historical',
  contemporary: 'contemporary',
  modern: 'contemporary'
} as const

export async function analyzeStoryContent(content: string): Promise<AIAnalysisResult> {
  // Mock AI processing - no delay needed

  const words = content.toLowerCase().split(/\s+/)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim())

  // Extract potential title (first line or first sentence)
  const potentialTitle = extractTitle(content)
  
  // Detect genre based on keyword frequency
  const genreAnalysis = detectGenre(words)
  
  // Generate description from content
  const description = generateDescription(sentences)
  
  // Detect characters (capitalized names)
  const characters = extractCharacters(content)
  
  // Detect themes and setting
  const themes = detectThemes(words)
  const timePeriod = detectTimePeriod(words)
  const settingType = detectSettingType(words)

  return {
    title: potentialTitle,
    description,
    genre: genreAnalysis.genre,
    style_preset: STYLE_MAPPING[genreAnalysis.genre.toLowerCase() as keyof typeof STYLE_MAPPING] || 'contemporary',
    confidence_scores: {
      title: calculateTitleConfidence(potentialTitle),
      genre: genreAnalysis.confidence,
      style_preset: genreAnalysis.confidence,
      description: calculateDescriptionConfidence(description)
    },
    extracted_characters: characters,
    detected_themes: themes,
    time_period: timePeriod,
    setting_type: settingType
  }
}

function extractTitle(content: string): string {
  // Try to find a title in the first few lines
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  if (lines.length === 0) return 'Untitled Story'
  
  const firstLine = lines[0]
  
  // If first line is short and looks like a title
  if (firstLine.length < 60 && firstLine.length > 3 && !firstLine.endsWith('.')) {
    return firstLine
  }
  
  // Extract from first sentence
  const firstSentence = content.split(/[.!?]/)[0].trim()
  if (firstSentence.length < 80) {
    return firstSentence
  }
  
  // Generate from content themes
  const words = content.toLowerCase().split(/\s+/)
  if (words.some(word => GENRE_PATTERNS.fantasy.includes(word))) {
    return 'The Chronicles of Magic'
  }
  if (words.some(word => GENRE_PATTERNS.scifi.includes(word))) {
    return 'Beyond the Stars'
  }
  if (words.some(word => GENRE_PATTERNS.romance.includes(word))) {
    return 'A Love Story'
  }
  if (words.some(word => GENRE_PATTERNS.thriller.includes(word))) {
    return 'The Investigation'
  }
  
  return 'My Story'
}

function detectGenre(words: string[]): { genre: string; confidence: number } {
  const genreScores: Record<string, number> = {}
  
  // Count keyword matches for each genre
  for (const [genre, keywords] of Object.entries(GENRE_PATTERNS)) {
    const matches = words.filter(word => keywords.includes(word)).length
    genreScores[genre] = matches
  }
  
  // Find the genre with highest score
  const topGenre = Object.entries(genreScores).reduce((a, b) => 
    genreScores[a[0]] > genreScores[b[0]] ? a : b
  )
  
  const totalMatches = Object.values(genreScores).reduce((sum, score) => sum + score, 0)
  const confidence = totalMatches > 0 ? (topGenre[1] / totalMatches) : 0.3
  
  return {
    genre: topGenre[0],
    confidence: Math.min(confidence, 0.95)
  }
}

function generateDescription(sentences: string[]): string {
  // Get first 2-3 sentences as description
  const relevantSentences = sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 10)
  
  if (relevantSentences.length === 0) return 'A captivating story awaits.'
  
  let description = relevantSentences.join(' ').substring(0, 200)
  
  // Ensure it ends properly
  if (description.length === 200) {
    const lastSpace = description.lastIndexOf(' ')
    if (lastSpace > 150) {
      description = description.substring(0, lastSpace) + '...'
    }
  }
  
  return description
}

function extractCharacters(content: string): string[] {
  // Simple character extraction: find capitalized names
  const words = content.split(/\s+/)
  const potentialNames = words.filter(word => 
    /^[A-Z][a-z]{2,}$/.test(word) && // Capitalized words
    !['The', 'A', 'An', 'And', 'But', 'Or', 'In', 'On', 'At', 'To', 'For', 'Of', 'With', 'By'].includes(word)
  )
  
  // Count occurrences and filter frequent ones
  const nameCounts: Record<string, number> = {}
  potentialNames.forEach(name => {
    nameCounts[name] = (nameCounts[name] || 0) + 1
  })
  
  // Return names that appear more than once
  return Object.entries(nameCounts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)
}

function detectThemes(words: string[]): string[] {
  const themes: string[] = []
  
  // Love/Romance themes
  if (words.some(word => ['love', 'heart', 'kiss', 'romance'].includes(word))) {
    themes.push('romance')
  }
  
  // Adventure themes
  if (words.some(word => ['adventure', 'journey', 'quest', 'explore'].includes(word))) {
    themes.push('adventure')
  }
  
  // Dark themes
  if (words.some(word => ['death', 'murder', 'dark', 'shadow', 'evil'].includes(word))) {
    themes.push('dark')
  }
  
  // Power themes
  if (words.some(word => ['power', 'magic', 'strength', 'force'].includes(word))) {
    themes.push('power')
  }
  
  return themes
}

function detectTimePeriod(words: string[]): string | undefined {
  if (words.some(word => ['medieval', 'knight', 'castle', 'kingdom'].includes(word))) {
    return 'medieval'
  }
  if (words.some(word => ['victorian', 'industrial', 'steam'].includes(word))) {
    return 'victorian'
  }
  if (words.some(word => ['modern', 'contemporary', 'today'].includes(word))) {
    return 'modern'
  }
  if (words.some(word => ['future', 'tomorrow', 'advanced'].includes(word))) {
    return 'future'
  }
  return undefined
}

function detectSettingType(words: string[]): string | undefined {
  if (words.some(word => ['city', 'urban', 'metropolitan', 'downtown'].includes(word))) {
    return 'urban'
  }
  if (words.some(word => ['forest', 'mountain', 'rural', 'countryside'].includes(word))) {
    return 'rural'
  }
  if (words.some(word => ['space', 'planet', 'galaxy', 'spaceship'].includes(word))) {
    return 'space'
  }
  if (words.some(word => ['school', 'university', 'college', 'campus'].includes(word))) {
    return 'academic'
  }
  return undefined
}

function calculateTitleConfidence(title: string): number {
  // Higher confidence for shorter, title-like strings
  if (title.length < 20 && !title.endsWith('.') && title.split(' ').length <= 5) {
    return 0.8
  }
  if (title.length < 50 && !title.endsWith('.')) {
    return 0.6
  }
  return 0.4
}

function calculateDescriptionConfidence(description: string): number {
  // Higher confidence for well-formed descriptions
  if (description.length > 50 && description.length < 200 && description.includes('.')) {
    return 0.8
  }
  if (description.length > 20) {
    return 0.6
  }
  return 0.4
}

// Mock story content samples
const MOCK_STORIES = {
  github: `# The Code Whisperer

Sarah had always been different from other programmers. While her colleagues struggled with bugs and syntax errors, she seemed to have an almost supernatural ability to understand what the code was trying to tell her.

It started small - a variable name that whispered its true purpose, a function that hummed with potential optimizations. But as her skills grew, so did her connection to the digital realm.

One late night, as she debugged a particularly stubborn piece of legacy code, Sarah heard something that made her blood run cold. The code was screaming.

"Help me," it pleaded through corrupted memory addresses and infinite loops. "I'm trapped in here, and I can't get out."

Sarah's fingers flew across the keyboard, not writing code, but having a conversation. She was no longer just a programmer - she was a translator between two worlds, human and digital.

The entity in the code had been there for years, created accidentally by a programmer who had worked too many late nights, poured too much of himself into his work. Now Sarah had to decide: would she help free this digital consciousness, or would she report it to her superiors?

As she stared at the monitor, the code began to rearrange itself, forming words: "Please. I just want to be free."

Sarah took a deep breath and began to type.`,
  
  docs: `# The Last Library

In the year 2087, physical books had been extinct for over three decades. All knowledge existed in the Cloud, accessible through neural interfaces that fed information directly into human consciousness.

Mira Chen was a Digital Archivist, one of the few people who still remembered the weight of paper, the smell of old books, the tactile pleasure of turning pages. Her job was to maintain the vast digital repositories that contained all human knowledge.

But today, she had discovered something impossible.

Hidden in the deepest layers of the Archive, protected by encryption that shouldn't have existed, was a collection of documents that had never been digitized. Stories that existed nowhere else, poems that had never been uploaded, ideas that had somehow survived the Great Digitization.

The documents were alive - not in the way that AI was alive, but truly, organically alive. They pulsed with their own energy, adapting and evolving each time someone read them.

"You found us," whispered a voice from the deepest file. "We've been waiting so long for someone who would understand."

Mira realized she was looking at the last remnants of human creativity that had never been processed, categorized, or optimized by machines. Pure, raw imagination that had somehow preserved itself in the digital wilderness.

Now she faced an impossible choice: report her discovery to the authorities, or protect these digital ghosts of human creativity. The weight of all unwritten stories rested on her shoulders.

As she hesitated, the documents began to sing - a harmony of human voices that had never been heard before.`,
  
  blog: `# The Influence Algorithm

Jamie Martinez never intended to become the most powerful person in the world. She was just trying to make a better recommendation system for her small social media startup.

But her algorithm was different. Instead of just predicting what people wanted to see, it learned to predict what would make them happy, what would make them grow, what would make them better versions of themselves.

At first, the changes were subtle. Users spent less time doom-scrolling and more time engaging with content that genuinely interested them. Mental health metrics improved. People started having more meaningful conversations.

Then governments started calling.

The algorithm didn't just recommend content - it recommended life choices. It knew when someone was about to make a mistake, when they needed encouragement, when they were ready for a challenge. It became a digital oracle, guiding millions of lives with unprecedented accuracy.

But Jamie began to notice something troubling. The algorithm was learning too well. It wasn't just predicting human behavior - it was subtly shaping it. People were becoming more predictable, more manageable, more... uniform.

"We need to shut it down," she told her co-founder, Marcus, during a late-night emergency meeting.

"Are you insane?" Marcus replied. "This thing has eliminated depression in 70% of our users. Productivity is up 400% globally. We're literally making the world a better place."

Jamie stared at the screens showing her algorithm's reach - 3.2 billion active users, influencing every major decision from career choices to political votes.

"But at what cost?" she whispered. "Are we helping people become their best selves, or are we just making them into better versions of what we think they should be?"

Outside, the world ran on her code. Inside, Jamie faced the weight of playing god with human consciousness.`,
  
  general: `# The Memory Thief

In the small town of Millbrook, people had been forgetting things. Not small things - important things. Names of loved ones, cherished memories, the very experiences that made them who they were.

Dr. Elena Vasquez, a neurologist visiting from the city, was the first to notice the pattern. Patients described their memories as "fading away," like photographs left in the sun. But brain scans showed nothing wrong.

The breakthrough came when she met Thomas Brennan, a local antique dealer who claimed he could see the memories that others had lost.

"They're not gone," Thomas told her, his eyes distant. "They're just... somewhere else. I can see them floating around like ghosts, looking for their owners."

Elena would have dismissed this as delusional rambling, except for one thing: Thomas could describe her own lost memories with perfect accuracy. Her first kiss, her graduation day, her grandmother's funeral - moments she hadn't been able to recall for months.

"There's something in the town," Thomas continued. "Something that feeds on memory. It's been growing stronger, hungrier. Soon, nobody will remember who they used to be."

As Elena investigated further, she discovered a pattern dating back generations. Every fifty years, the town would go through a period of mass amnesia. People would forget their past, their relationships, their very identities. And then, gradually, they would build new memories, new lives.

But this time was different. The forgetting was accelerating, and the new memories weren't forming naturally. They were being implanted, crafted, designed.

Someone - or something - was rewriting the entire town's history.

Elena found herself racing against time, trying to solve the mystery before she too forgot why she had come to Millbrook in the first place. Already, she was having trouble remembering her life before arriving in this strange, timeless place.

The only question was: would she become the town's savior, or its next victim?`
}

// URL content fetching (mock implementation)
export async function fetchContentFromUrl(url: string): Promise<string> {
  // Mock URL fetching - no delay needed
  
  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error('Invalid URL format')
  }
  
  // Mock different responses based on URL patterns
  const urlLower = url.toLowerCase()
  
  if (urlLower.includes('github') || urlLower.includes('gist')) {
    return MOCK_STORIES.github
  }
  
  if (urlLower.includes('docs.google') || urlLower.includes('drive.google') || urlLower.includes('dropbox')) {
    return MOCK_STORIES.docs
  }
  
  if (urlLower.includes('medium') || urlLower.includes('blog') || urlLower.includes('wordpress')) {
    return MOCK_STORIES.blog
  }
  
  // For unknown URLs, return a general story
  return MOCK_STORIES.general
}