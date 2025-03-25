import { logError } from './utils/debug';

/**
 * OpenRouter API integration for AutoPen
 */

// Constants for OpenRouter API - Use environment variables only
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = import.meta.env.VITE_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';

// Flag to check if API key is potentially valid (at least has correct format)
const API_KEY_IS_VALID = OPENROUTER_KEY && OPENROUTER_KEY.length > 30;

// Default model to use from environment
const DEFAULT_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'deepseek/deepseek-r1:free';

// Specific models to use per user request
// Only use deepseek models by default
const MODELS = [
  DEFAULT_MODEL,                           // Primary model from env or default
  'deepseek/deepseek-chat-v3-0324:free'    // Fallback model
];

// Fallback models if the primary models are unavailable
const BACKUP_MODELS = [
  'gryphe/mythomist-7b:free',              // Backup model 1
  'nousresearch/nous-hermes-2-mistral-7b:free', // Backup model 2
  'anthropic/claude-instant-1:free'        // Last resort
];

// Start with the primary model
let OPENROUTER_MODEL = MODELS[0];

// Add a flag to indicate if we're using fallback models
let usingFallbackModels = false;

// Expose a function to switch models in case of failures
const switchToNextModel = () => {
  const currentIndex = MODELS.indexOf(OPENROUTER_MODEL);
  
  if (currentIndex < MODELS.length - 1) {
    // Switch to next model in primary list
    OPENROUTER_MODEL = MODELS[currentIndex + 1];
    console.log(`Switched to model: ${OPENROUTER_MODEL}`);
    return true;
  } else if (!usingFallbackModels) {
    // Switch to fallback models if we've exhausted primary models
    usingFallbackModels = true;
    OPENROUTER_MODEL = BACKUP_MODELS[0];
    console.log(`Switched to backup model: ${OPENROUTER_MODEL}`);
    return true;
  } else {
    // Try next fallback model
    const fallbackIndex = BACKUP_MODELS.indexOf(OPENROUTER_MODEL);
    if (fallbackIndex < BACKUP_MODELS.length - 1) {
      OPENROUTER_MODEL = BACKUP_MODELS[fallbackIndex + 1];
      console.log(`Switched to backup model: ${OPENROUTER_MODEL}`);
      return true;
    }
  }
  
  return false; // No more models to try
};

// Add this new function to handle API timeouts with a proper AbortController
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  // Create a timeout that will abort the fetch
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    console.log(`DEBUG: Sending request to ${url} with options:`, {
      method: options.method,
      headers: options.headers,
      bodyLength: options.body ? JSON.stringify(options.body).length : 0
    });
    
    // Combine the provided signal (if any) with our timeout signal
    const mergedOptions = {
      ...options,
      signal,
      mode: 'cors' as RequestMode // Explicitly set CORS mode
    };
    
    const response = await fetch(url, mergedOptions);
    clearTimeout(timeoutId);
    console.log(`DEBUG: Received response with status: ${response.status}`);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    console.error(`DEBUG: Fetch error:`, error);
    
    // Enhanced error handling for timeouts
    if (error.name === 'AbortError') {
      throw new Error(`API request timed out after ${timeout/1000} seconds. The server did not respond in time.`);
    }
    
    throw error;
  }
};

// Update the timeout value to be more reasonable
const API_TIMEOUT = 20000; // 20 seconds instead of 30

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
    onProgress?: (status: {retry: number, maxRetries: number, message: string}) => void;
  } = {}
): Promise<string> {
  const maxRetries = options.maxRetries || 3; // Reduced from 5 to 3 for faster failure
  let retries = 0;
  let lastError: Error | null = null;
  let modelRetries = 0; // Track model changes
  const maxModelRetries = MODELS.length - 1;
  
  // Enable debugging
  const debug = true;
  
  // Notify about progress if callback provided
  const notifyProgress = (message: string) => {
    if (debug) console.log(`[OpenRouter] ${message}`);
    if (options.onProgress) {
      options.onProgress({
        retry: retries,
        maxRetries,
        message
      });
    }
  };
  
  notifyProgress(`Starting request with model: ${OPENROUTER_MODEL}`);

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
        temperature: 1.0,
      };

      // Debug the request
      notifyProgress(`Calling OpenRouter API with model: ${OPENROUTER_MODEL}`);
      console.log(`OpenRouter request params:`, {
        model: params.model,
        temperature: params.temperature,
        messageCount: params.messages.length,
        url: OPENROUTER_API_URL
      });

      // IMPORTANT: Actually use the fetchWithTimeout method we defined (was previously unused)
      try {
        console.log("DEBUG: Preparing to call OpenRouter API with:", {
          url: OPENROUTER_API_URL,
          model: OPENROUTER_MODEL,
          messagesCount: messages.length,
          promptLength: prompt.length,
          apiKeyLength: OPENROUTER_KEY.length,
        });
        
        const response = await fetchWithTimeout(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
            'HTTP-Referer': window.location.origin, // Use actual origin
            'X-Title': 'AutoPen App',
            'Origin': window.location.origin
          },
          body: JSON.stringify(params)
        }, API_TIMEOUT); // 20-second timeout
        
        if (!response.ok) {
          let errorMessage = `API error: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = `OpenRouter API error: ${
              errorData.error?.message || 
              errorData.error || 
              response.statusText
            }`;
            
            // Log detailed error information for debugging
            console.error("OpenRouter API error details:", {
              status: response.status,
              statusText: response.statusText,
              errorData,
              model: OPENROUTER_MODEL,
              headers: Array.from(response.headers.entries())
            });
            
            // Check for authentication issues
            if (response.status === 401 || response.status === 403 || 
                errorMessage.includes('unauthorized') || errorMessage.includes('auth')) {
              errorMessage = `API authentication error. The API key may be invalid or expired.`;
              // Don't retry auth errors
              throw new Error(errorMessage);
            }
            
          } catch (e) {
            // Failed to parse error JSON, use default message
            console.error("Failed to parse OpenRouter error response:", e);
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
      } catch (fetchError) {
        // Explicitly handle abort errors (timeouts)
        if (fetchError.name === 'AbortError') {
          throw new Error(`API request timed out after 30 seconds: ${fetchError.message}`);
        }
        throw fetchError;
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
      
      // Detailed error information
      notifyProgress(`API error: ${error.name}: ${error.message}`);

      // Create model-specific error flag for certain types of errors
      const isModelError = 
        error.message?.includes('model is overloaded') ||
        error.message?.includes('model_not_found') ||
        error.message?.includes('not available') ||
        error.message?.includes('currently unavailable') ||
        error.message?.includes('invalid model');
      
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
      
      // Try a different model if we encounter model-specific errors
      if (isModelError && modelRetries < maxModelRetries) {
        modelRetries++;
        if (switchToNextModel()) {
          const modelMessage = `Switching to model: ${OPENROUTER_MODEL} (attempt ${modelRetries}/${maxModelRetries})`;
          notifyProgress(modelMessage);
          // Reset regular retries when switching models
          retries = 0;
          // Small pause before trying with new model
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
        
      if (shouldRetry && retries < maxRetries) {
        const retryMessage = `API call failed, retrying (${retries}/${maxRetries})...`;
        console.warn(retryMessage);
        notifyProgress(retryMessage);
        
        // Exponential backoff: wait longer between each retry but cap at 10 seconds
        const delay = Math.min(2000 * Math.pow(2, retries), 10000); // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (!shouldRetry) {
        const errorMessage = 'Non-retryable error encountered: ' + error.message;
        console.error(errorMessage);
        notifyProgress(errorMessage);
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
// Fallback ideas for when the API fails completely
const FALLBACK_EBOOK_IDEAS = [
  {
    title: "FALLBACK_DISABLED",
    description: "Fallback ideas are disabled. Please ensure the OpenRouter API is properly configured.",
    source_data: "N/A"
  }
];

// Create additional fallback ideas based on content
const createContentBasedFallbackIdeas = (content: string) => {
  throw new Error("Fallback ideas are disabled. Please ensure the OpenRouter API is properly configured.");
};

export async function generateIdeasFromBrainDump(
  content: string, 
  files: string[], 
  links: string[],
  onProgress?: (status: {retry: number, maxRetries: number, message: string}) => void
): Promise<{
  title: string;
  description: string;
  source_data: string;
}[]> {
  // Debugging information
  console.log("generateIdeasFromBrainDump called with:", { 
    contentLength: content?.length || 0,
    filesCount: files?.length || 0,
    linksCount: links?.length || 0,
    apiKeyValid: API_KEY_IS_VALID
  });
  
  // Check if API key is valid
  if (!API_KEY_IS_VALID) {
    console.warn("OpenRouter API key invalid or not configured");
    if (onProgress) {
      onProgress({
        retry: 0,
        maxRetries: 0,
        message: "API configuration issue. OpenRouter API key is not valid."
      });
    }
    throw new Error("OpenRouter API key is invalid or not configured");
  }

  // Validate content
  if (!content || content.trim().length < 50) {
    throw new Error("Content is too short or empty. Please provide more substantial content for analysis.");
  }

  const systemPrompt = `You are an expert content strategist helping generate high-quality eBook ideas from unstructured content.
Analyze the content, identify key themes and topics, and generate 4-8 compelling eBook ideas that would make excellent 
full-length eBooks (approx. 50-100 pages). Each idea should include a catchy title, a brief description, and a note 
about what part of the input data inspired this idea.`;

  const prompt = `
CONTENT:
${content.substring(0, 10000)}

${files.length > 0 ? `FILES: ${files.join(', ')}` : ''}
${links.length > 0 ? `LINKS: ${links.join(', ')}` : ''}

Based on this content, generate 4-6 high-quality eBook ideas. For each idea, provide:
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

  // Set a strict timeout for the entire operation
  let hasTimedOut = false;
  const globalTimeoutId = setTimeout(() => {
    hasTimedOut = true;
    console.warn("Global timeout reached for idea generation");
    if (onProgress) {
      onProgress({
        retry: 0,
        maxRetries: 0,
        message: "Analysis is taking too long. The operation timed out."
      });
    }
    throw new Error("Idea generation timed out. The OpenRouter API is taking too long to respond.");
  }, 40000); // 40 seconds timeout - longer to allow for API delays

  try {
    // Notify that we're starting the process
    if (onProgress) {
      onProgress({
        retry: 0,
        maxRetries: 1,
        message: "Starting content analysis..."
      });
    }

    // Initialize API call
    const responsePromise = generateOpenRouterResponse(prompt, {
      systemPrompt,
      temperature: 1.0,
      maxRetries: 2, // Allow more retries
      onProgress
    });
    
    // Wait for the response with a timeout
    const apiTimeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("API request timed out")), 35000); // 35 seconds
    });
    
    // Wait for either the response or timeout
    let response: string;
    try {
      response = await Promise.race([responsePromise, apiTimeoutPromise]);
    } catch (error) {
      console.warn("API error:", error);
      clearTimeout(globalTimeoutId);
      throw error;
    }
    
    // Process the response
    try {
      // First try to extract JSON array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // Validate the parsed response
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
            clearTimeout(globalTimeoutId);
            return parsed;
          }
        } catch (parseError) {
          console.warn("JSON parsing error in matched array:", parseError);
          throw new Error("Failed to parse API response");
        }
      }
      
      // If no JSON array, try to parse whole response
      try {
        const parsedResponse = JSON.parse(response);
        if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
          clearTimeout(globalTimeoutId);
          return parsedResponse;
        }
      } catch (e) {
        console.warn("Failed to parse response as JSON:", e);
        throw new Error("Invalid API response format");
      }
      
      // If we get here, the response isn't in the expected format
      throw new Error("API returned invalid data format");
    } catch (parseError) {
      clearTimeout(globalTimeoutId);
      throw parseError;
    }
  } catch (error: any) {
    clearTimeout(globalTimeoutId);
    console.error("Error during idea generation:", error);
    throw error;
  }
}

// Helper function to extract ideas from non-JSON text response
function extractIdeasFromText(text: string, content: string): Array<any> {
  throw new Error("Extracting ideas from text is disabled. The API must return properly formatted JSON.");
}

// Create higher quality fallback ideas based on content
function createEnhancedFallbackIdeas(content: string) {
  throw new Error("Fallback ideas are disabled. Please ensure the OpenRouter API is properly configured.");
}

/**
 * Generate an eBook title and table of contents based on the selected idea
 */
// Fallback ebook structure for when the API fails
const generateFallbackStructure = (idea: { title: string; description: string }) => {
  throw new Error("Fallback structures should not be used. Please ensure the OpenRouter API is properly configured.");
};

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
      temperature: 1.0
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
// Fallback chapter content generator
const generateFallbackChapterContent = (
  bookTitle: string,
  chapterTitle: string,
  chapterDescription: string,
  chapterIndex: number,
  totalChapters: number
): string => {
  throw new Error("Fallback chapter content should not be used. Please ensure the OpenRouter API is properly configured.");
};

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
      temperature: 1.0,
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
  let ebookContent = `# ${title}\n\n`;
  
  // Add description if available
  if (description && description.trim()) {
    ebookContent += `${description}\n\n`;
  }
  
  // Add table of contents
  ebookContent += `${toc}\n\n`;
  
  // Add each chapter
  sortedChapters.forEach((chapter, index) => {
    if (chapter.content) {
      // Clean up potential issues in chapter content
      let chapterContent = chapter.content.trim();
      
      // Ensure chapter title is formatted as a heading if not already
      ebookContent += `\n\n# Chapter ${index + 1}: ${chapter.title}\n\n`;
      
      // Add chapter content, ensuring there's proper spacing
      ebookContent += `${chapterContent}\n\n`;
    }
  });
  
  return ebookContent;
}

/**
 * Test function to verify OpenRouter connectivity
 * This will make a simple API call with minimal content to check if the API is accessible
 */
export async function testOpenRouterConnectivity(): Promise<{success: boolean, message: string}> {
  try {
    console.log("Testing OpenRouter connectivity...");
    
    // First check if we have a potentially valid API key
    if (!API_KEY_IS_VALID) {
      return {
        success: false,
        message: "No valid OpenRouter API key found. Please add your OpenRouter API key to the environment variables (VITE_OPENROUTER_API_KEY)."
      };
    }
    
    const testParams = {
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message. Please respond with "Connectivity test successful".'
        }
      ],
      temperature: 0.7,
      max_tokens: 20
    };
    
    const response = await fetchWithTimeout(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AutoPen App',
        'Origin': window.location.origin
      },
      body: JSON.stringify(testParams)
    }, 10000); // 10 second timeout for test
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter test failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: "OpenRouter API key is invalid or unauthorized. Please check your API key."
        };
      }
      
      return {
        success: false,
        message: `API returned error ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    console.log("OpenRouter test succeeded:", data);
    
    return {
      success: true,
      message: data.choices && data.choices[0] ? 
        `Success: ${data.choices[0].message?.content}` : 
        "Success, but received unexpected response format"
    };
  } catch (error: any) {
    console.error("OpenRouter connectivity test error:", error);
    return {
      success: false, 
      message: `Connection error: ${error.message || "Unknown error"}`
    };
  }
}