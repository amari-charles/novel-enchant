import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface FetchChapterRequest {
  url: string;
}

interface FetchChapterResponse {
  title: string;
  content: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json() as FetchChapterRequest

    if (!url) {
      throw new Error('URL is required')
    }

    // Validate URL
    const parsedUrl = new URL(url)
    if (!parsedUrl.protocol.startsWith('http')) {
      throw new Error('Invalid URL protocol')
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // Extract content based on the site
    const hostname = parsedUrl.hostname.toLowerCase()
    let title = ''
    let content = ''

    if (hostname.includes('novelbin.com')) {
      // NovelBin specific extraction
      title = extractBetween(html, '<h3 class="chr-title">', '</h3>') ||
              extractBetween(html, '<meta property="og:title" content="', '"') ||
              'Chapter'

      // Extract the chapter content
      const chapterContent = extractBetween(html, '<div id="chr-content">', '</div>')
      if (chapterContent) {
        // Clean up the content
        content = chapterContent
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<p[^>]*>/gi, '\n\n')
          .replace(/<\/p>/gi, '')
          .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
          .trim()
      }
    } else if (hostname.includes('royalroad.com')) {
      // Royal Road extraction
      title = extractBetween(html, '<h1 class="fic-title">', '</h1>') ||
              extractBetween(html, '<meta property="og:title" content="', '"') ||
              'Chapter'

      const chapterContent = extractBetween(html, '<div class="chapter-content">', '<div class="portlet light')
      if (chapterContent) {
        content = cleanHtmlContent(chapterContent)
      }
    } else if (hostname.includes('webnovel.com')) {
      // WebNovel extraction
      title = extractBetween(html, '<h1 class="cha-tit">', '</h1>') ||
              extractBetween(html, '<meta property="og:title" content="', '"') ||
              'Chapter'

      const chapterContent = extractBetween(html, '<div class="cha-content">', '</div>')
      if (chapterContent) {
        content = cleanHtmlContent(chapterContent)
      }
    } else {
      // Generic extraction for other sites
      // Try to find the title
      title = extractBetween(html, '<title>', '</title>') ||
              extractBetween(html, '<meta property="og:title" content="', '"') ||
              extractBetween(html, '<h1>', '</h1>') ||
              'Chapter'

      // Try to find the main content
      // Look for common content containers
      let chapterContent = extractBetween(html, '<article', '</article>') ||
                           extractBetween(html, '<div class="content"', '</div>') ||
                           extractBetween(html, '<div id="content"', '</div>') ||
                           extractBetween(html, '<main', '</main>')

      if (chapterContent) {
        // Find the actual content start
        const contentStart = chapterContent.indexOf('>')
        if (contentStart !== -1) {
          chapterContent = chapterContent.substring(contentStart + 1)
        }
        content = cleanHtmlContent(chapterContent)
      }
    }

    if (!content || content.length < 100) {
      throw new Error('Could not extract chapter content from the page. The site might not be supported or the content structure has changed.')
    }

    const result: FetchChapterResponse = {
      title: title.substring(0, 200), // Limit title length
      content: content.substring(0, 50000), // Limit content to ~50k characters
      source: parsedUrl.hostname,
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching chapter:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch chapter content',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Helper function to extract content between two strings
function extractBetween(html: string, start: string, end: string): string {
  const startIndex = html.indexOf(start)
  if (startIndex === -1) return ''

  const contentStart = startIndex + start.length
  const endIndex = html.indexOf(end, contentStart)
  if (endIndex === -1) return ''

  return html.substring(contentStart, endIndex).trim()
}

// Helper function to clean HTML content
function cleanHtmlContent(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim()
}