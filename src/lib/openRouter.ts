import { logError } from './utils/debug';

/**
 * OpenRouter API integration for AutoPen
 */

// API Key for OpenRouter
const OPENROUTER_KEY = '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';

// API endpoints
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3-0324:free';

/**
 * Interface for API request parameters
 */
interface OpenRouterRequestParams {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * Interface for API response
 */
interface OpenRouterResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate a response from OpenRouter API with retry logic
 */
export async function generateOpenRouterResponse(
  prompt: string, 
  options: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    maxRetries?: number;
  } = {}
): Promise<string> {
  const maxRetries = options.maxRetries || 5; // Increased from 3 to 5
  let retries = 0;
  let lastError: Error | null = null;

  // Safety check for empty prompt
  if (!prompt || prompt.trim() === '') {
    throw new Error('Empty prompt provided to API. Cannot generate content with empty input.');
  }

  while (retries < maxRetries) {
    try {
      // Construct messages
      const messages = [];
      
      // Add system prompt if provided
      if (options.systemPrompt) {
        messages.push({
          role: 'system' as const,
          content: options.systemPrompt
        });
      }
      
      // Add user prompt
      messages.push({
        role: 'user' as const,
        content: prompt
      });

      // Configure request parameters
      const params: OpenRouterRequestParams = {
        model: OPENROUTER_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096
      };

      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
            'HTTP-Referer': 'https://autopen.app',
            'X-Title': 'AutoPen'
          },
          body: JSON.stringify(params),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = `API error: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = `OpenRouter API error: ${
              errorData.error?.message || 
              errorData.error || 
              response.statusText
            }`;
          } catch (e) {
            // Failed to parse error JSON, use default message
          }
          throw new Error(errorMessage);
        }

        // Parse JSON response with error handling
        let data: OpenRouterResponse;
        try {
          data = await response.json() as OpenRouterResponse;
        } catch (jsonError) {
          throw new Error(`Failed to parse API response: ${jsonError.message}`);
        }
        
        // Check if we got a valid response
        if (!data.choices || data.choices.length === 0) {
          throw new Error('No response generated from OpenRouter API');
        }

        if (!data.choices[0].message || !data.choices[0].message.content) {
          throw new Error('API response missing content');
        }

        // Extract the text from the response
        return data.choices[0].message.content;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      lastError = error;
      retries++;
      
      // Log the error with context
      logError('generateOpenRouterResponse', error, { 
        promptLength: prompt.length,
        retry: retries,
        maxRetries,
        errorType: error.name,
        isTimeout: error.name === 'AbortError'
      });
      
      // More generous retry conditions
      const shouldRetry = 
        error.name === 'AbortError' || // Timeouts
        error.message?.includes('fetch') || 
        error.message?.includes('network') || 
        error.message?.includes('timeout') ||
        error.message?.includes('429') ||  // Rate limits
        error.message?.includes('500') ||  // Server errors
        error.message?.includes('502') || 
        error.message?.includes('503') || 
        error.message?.includes('504') ||
        error.message?.includes('parse'); // JSON parsing issues
        
      if (shouldRetry && retries < maxRetries) {
        console.warn(`API call failed, retrying (${retries}/${maxRetries})...`);
        // Exponential backoff: wait longer between each retry
        const delay = Math.min(2000 * Math.pow(2, retries), 20000); // Max 20 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (!shouldRetry) {
        console.error('Non-retryable error encountered:', error.message);
        break;
      }
    }
  }

  // If we've exhausted all retries or encountered a non-retryable error
  const errorMessage = `Failed to generate response after ${retries} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

/**
 * Generate ideas from brain dump data using OpenRouter
 */
export async function generateIdeasFromBrainDump(content: string, files: string[], links: string[]): Promise<{
  title: string;
  description: string;
  source_data: string;
}[]> {
  const systemPrompt = `You are an expert content strategist helping generate high-quality eBook ideas from unstructured content.
Analyze the content, identify key themes and topics, and generate 4-8 compelling eBook ideas that would make excellent 
full-length eBooks (approx. 50-100 pages). Each idea should include a catchy title, a brief description, and a note 
about what part of the input data inspired this idea.`;

  const prompt = `
CONTENT:
${content.substring(0, 25000)}

${files.length > 0 ? `FILES: ${files.join(', ')}` : ''}
${links.length > 0 ? `LINKS: ${links.join(', ')}` : ''}

Based on this content, generate 4-8 high-quality eBook ideas. For each idea, provide:
1. Title: A catchy, marketable title
2. Description: A brief description of what the eBook would cover (2-3 sentences)
3. Source: Which part of the input data inspired this idea

Format each idea as:
{
  "title": "Title Here",
  "description": "Description here...",
  "source_data": "Inspired by..."
}

Return the ideas as a valid JSON array.
`;

  try {
    const response = await generateOpenRouterResponse(prompt, {
      systemPrompt,
      temperature: 0.7
    });

    // Extract the JSON from the response - handle different response formats
    try {
      // First try to extract JSON array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON array, try to parse whole response
      try {
        const parsedResponse = JSON.parse(response);
        if (Array.isArray(parsedResponse)) {
          return parsedResponse;
        }
      } catch (e) {
        // Not valid JSON
      }
      
      // We can't process the response, throw an error instead of using fallbacks
      throw new Error('Failed to parse ideas from response. Please try again.');
    } catch (parseError) {
      logError('generateIdeasFromBrainDump:parsing', parseError);
      throw new Error(`Failed to parse ideas: ${parseError.message}`);
    }
  } catch (error: any) {
    logError('generateIdeasFromBrainDump', error);
    throw new Error(`Failed to generate ideas: ${error.message}`);
  }
}

/**
 * Generate an eBook title and table of contents based on the selected idea
 */
export async function generateEbookStructure(idea: {
  title: string;
  description: string;
}, brainDumpContent: string): Promise<{
  title: string;
  description: string;
  chapters: { title: string; description: string; order_index: number }[];
}> {
  const systemPrompt = `You are an expert eBook writer and editor. Your task is to create a compelling title and 
detailed table of contents for an eBook based on the provided idea and content. The eBook should be substantial, 
with enough chapters to reach 30,000+ words when fully developed.`;

  const prompt = `
IDEA TITLE: ${idea.title}
IDEA DESCRIPTION: ${idea.description}

BRAIN DUMP CONTENT:
${brainDumpContent.substring(0, 10000)}

Based on this information, create a refined eBook title and a detailed table of contents with 10-15 chapters. 
Each chapter should have a descriptive title and a brief description of what it will cover. The chapters should 
flow logically and build upon each other to create a comprehensive narrative.

Return your response as a valid JSON object with the following structure:
{
  "title": "Final Refined eBook Title",
  "description": "An enhanced 2-3 sentence description of the eBook",
  "chapters": [
    {
      "title": "Chapter 1 Title",
      "description": "Brief description of what this chapter covers",
      "order_index": 0
    },
    {
      "title": "Chapter 2 Title",
      "description": "Brief description of what this chapter covers", 
      "order_index": 1
    },
    ...and so on
  ]
}

The first chapter (index 0) should always be an Introduction, and the last chapter should be a Conclusion.
Plan for a substantial book that will total approximately 30,000-40,000 words when complete.
`;

  try {
    const response = await generateOpenRouterResponse(prompt, {
      systemPrompt,
      temperature: 0.5
    });

    // Extract the JSON from the response - handle different response formats
    try {
      // First try to extract a JSON object
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no match, try to parse the entire response as JSON
      try {
        const parsedResponse = JSON.parse(response);
        if (parsedResponse && typeof parsedResponse === 'object' && !Array.isArray(parsedResponse)) {
          return parsedResponse;
        }
      } catch (e) {
        // Not valid JSON, continue to fallback
      }
      
      // We can't process the response, throw an error instead of using fallbacks
      throw new Error('Failed to parse eBook structure from response. Please try again.');
    } catch (parseError) {
      logError('generateEbookStructure:parsing', parseError);
      throw new Error(`Failed to parse eBook structure: ${parseError.message}`);
    }
  } catch (error: any) {
    logError('generateEbookStructure', error);
    throw new Error(`Failed to generate eBook structure: ${error.message}`);
  }
}

/**
 * Generate content for an eBook chapter
 */
export async function generateChapterContent(
  bookTitle: string,
  bookDescription: string,
  chapterTitle: string,
  chapterDescription: string,
  chapterIndex: number,
  totalChapters: number,
  brainDumpContent: string,
  previousChapters: { title: string; content?: string }[]
): Promise<string> {
  // Validate inputs and fail if required data is missing
  if (!bookTitle) {
    throw new Error('Book title is required for chapter generation');
  }
  if (!chapterTitle) {
    throw new Error('Chapter title is required for content generation');
  }
  if (totalChapters <= 0) {
    throw new Error('Invalid total chapters count');
  }
  
  // Get content for chapter generation
  if (!brainDumpContent) {
    throw new Error('Brain dump content is required for chapter generation');
  }
  const isIntroduction = chapterIndex === 0;
  const isConclusion = chapterIndex === totalChapters - 1;

  let chapterType = "main chapter";
  if (isIntroduction) chapterType = "introduction";
  if (isConclusion) chapterType = "conclusion";

  // Create a dynamic system prompt based on chapter type
  const systemPrompt = `You are an award-winning professional author with expertise in the subject matter.
Write a ${chapterType} for an eBook titled "${bookTitle}" with the quality and depth expected from a bestselling author.
Your writing should be engaging, informative, and substantial. Use clear language, relevant examples, and insightful analysis.
Each chapter should be approximately 2,500-3,000 words in length to ensure the complete book reaches 30,000+ words total.`;

  // Create context from previous chapters if available
  // For continuity, we summarize previous chapters and provide their key points
  let previousChapterContexts = '';
  
  // Process previous chapters carefully
  if (previousChapters && previousChapters.length > 0) {
    // First validate that we have valid chapter content to work with
    const validPreviousChapters = previousChapters
      .filter(ch => ch && ch.title && ch.content);
    
    if (validPreviousChapters.length > 0) {
      previousChapterContexts = validPreviousChapters
        .map((ch, idx) => {
          const content = ch.content || "";
          // Extract first paragraph and any headings to create a summary
          const firstParagraph = content.split('\n\n')[0] || "";
          const headings = content.match(/##\s.+/g) || [];
          return `Chapter ${idx + 1}: "${ch.title}"\n${firstParagraph}\nKey sections: ${headings.join(', ')}`;
        })
        .join('\n\n');
    }
  }

  const prompt = `
WRITE ${chapterType.toUpperCase()} FOR EBOOK: "${bookTitle}"

BOOK DESCRIPTION: "${bookDescription}"

CHAPTER TITLE: "${chapterTitle}"
CHAPTER DESCRIPTION: "${chapterDescription || ''}"
CHAPTER NUMBER: ${chapterIndex + 1} of ${totalChapters}

${previousChapterContexts ? `PREVIOUS CHAPTERS SUMMARY:\n${previousChapterContexts}\n\n` : ''}

BRAIN DUMP CONTENT (USE AS REFERENCE MATERIAL):
${brainDumpContent.substring(0, 8000)}

${isIntroduction ? `
For the introduction:
- Start with a compelling hook that grabs the reader's attention
- Clearly state the purpose and value of the book
- Provide context for why this topic matters now
- Outline what readers will learn and how it will benefit them
- Briefly summarize the key themes or concepts that will be covered
- End with a roadmap of what's to come in the following chapters
` : isConclusion ? `
For the conclusion:
- Summarize the key points covered throughout the book
- Synthesize the main lessons and insights
- Connect back to the introduction's promises and show how they've been fulfilled
- Provide final thoughts, recommendations, and forward-looking perspectives
- Include practical next steps or a call to action for the reader
- End on an inspiring note that leaves the reader satisfied and motivated
` : `
For this main chapter:
- Begin with an engaging introduction to the chapter's specific topic
- Divide the content into 4-6 distinct sections with clear subheadings
- Include practical examples, case studies, or stories to illustrate key points
- Provide actionable insights, frameworks, or step-by-step guidance where appropriate
- Include expert perspectives and evidence-based information
- Anticipate and address common questions or challenges related to the topic
- End with a summary of key takeaways and a smooth transition to the next chapter
`}

Important guidelines:
- Write approximately 2,500-3,000 words of substantial content
- Use markdown formatting (## for main headings, ### for subheadings)
- Include bullet points, numbered lists, and other formatting to enhance readability
- Maintain consistent tone and style with previous chapters (if any)
- Ensure the content flows logically and builds on previous information
- Write with authority and expertise on the subject matter

Make this chapter substantial and valuable. It should stand on its own while contributing to the complete narrative of the book.
`;

  try {
    return await generateOpenRouterResponse(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 4096 // Maximum token limit for a substantial chapter
    });
  } catch (error: any) {
    logError('generateChapterContent', error);
    throw new Error(`Failed to generate chapter content: ${error.message}`);
  }
}

/**
 * Create a Table of Contents in markdown format
 */
export function generateTableOfContents(
  title: string,
  chapters: { title: string; order_index: number }[]
): string {
  let toc = `# ${title}\n\n## Table of Contents\n\n`;
  
  chapters.sort((a, b) => a.order_index - b.order_index).forEach((chapter, index) => {
    toc += `${index + 1}. [${chapter.title}](#chapter-${index + 1})\n`;
  });
  
  return toc;
}

/**
 * Create formatted ebook content for markdown or PDF generation
 */
export function formatEbookForExport(
  title: string,
  description: string,
  chapters: { title: string; content?: string; order_index: number }[]
): string {
  // Sort chapters by order_index
  const sortedChapters = [...chapters].sort((a, b) => a.order_index - b.order_index);
  
  // Generate TOC
  const toc = generateTableOfContents(title, sortedChapters);
  
  // Compile full ebook content
  let ebookContent = `${toc}\n\n`;
  
  // Add each chapter
  sortedChapters.forEach((chapter, index) => {
    if (chapter.content) {
      ebookContent += `\n\n# Chapter ${index + 1}: ${chapter.title}\n\n${chapter.content}\n\n`;
    }
  });
  
  return ebookContent;
}