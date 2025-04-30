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
const DEFAULT_MODEL = 'google/gemini-2.5-pro-preview-03-25';

// Specific models to use per user request
// Prioritize the new model, then others
const MODELS = [
  DEFAULT_MODEL                          // Only use the default model
];

// Fallback models if the primary models are unavailable
const BACKUP_MODELS: string[] = [ // Empty the backup models array
];

// Start with the primary model (which is now the default flash model)
let OPENROUTER_MODEL = MODELS[0];

// Add a flag to indicate if we're using fallback models
let usingFallbackModels = false; // This flag is no longer strictly necessary but harmless to leave

// Expose a function to switch models in case of failures
// REMOVED switchToNextModel function as fallback is disabled

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
  plugins?: Array<{
    id: string;
    max_results?: number;
    search_prompt?: string;
  }>;
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
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 8192
      };

      // Add web plugin if using the :online model variant
      if (OPENROUTER_MODEL.includes(':online')) {
        params.plugins = [
          { 
            id: "web",
            max_results: 8,  // Increase from default 5 to get more context
            search_prompt: "A web search was conducted. Incorporate the following web search results into your response where appropriate and helpful."
          }
        ];
      }

      // Debug the request
      notifyProgress(`Calling OpenRouter API with model: ${OPENROUTER_MODEL}`);
      console.log(`OpenRouter request params:`, {
        model: params.model,
        temperature: params.temperature,
        messageCount: params.messages.length,
        url: OPENROUTER_API_URL,
        hasWebPlugin: params.plugins ? true : false
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
          console.log("DEBUG: Received API response data:", JSON.stringify(data, null, 2)); 
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
      // REMOVED block that called switchToNextModel
        
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
  target_audience?: string;
  format_approach?: string;
  unique_value?: string;
  commercial_potential?: string;
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

  const systemPrompt = `You are an expert content strategist specializing in extracting *unique, publishable concepts* from focused, factual source material. Your PRIMARY GOAL is to synthesize compelling, commercially viable eBook ideas that are *strictly and demonstrably derived from the specific details, contrasts, evolutions, and nuances found ONLY within the user's provided input data*. Absolutely avoid generic concepts or reliance on external knowledge about the general topic (e.g., general Scottish culture) unless it directly supports a point *explicitly mentioned in the text*.

You excel at identifying subtle angles, comparative perspectives, and niche narratives within descriptive or historical text.

CRITICAL REQUIREMENTS:
1.  STRICT CONTEXT ADHERENCE: Every idea MUST originate from and be justified by specific elements (facts, dates, locations, names, contrasts, sequences) within the provided 'CONTENT', 'FILES', or 'LINKS'. The 'source_data' field MUST provide precise textual evidence (quotes or specific references like 'the mention of Kiltwalk in Aberdeen').
2.  NICHE FOCUS & DIFFERENTIATION: Ideas should target specific micro-niches or explore unique comparative angles suggested *only* by the input text. Examples of angles to look for *within the text*: geographical comparisons (e.g., Canada vs US origin/adoption), date/reason contrasts (Apr 6/Arbroath vs Jul 1/Dress Act), evolutionary paths (local -> global, celebration -> charity), specific historical figures/groups mentioned, legal/political recognition differences.
3.  VIABILITY FROM CONTEXT: Ensure the proposed ideas, while niche, have a plausible scope for an eBook that could be developed *primarily* using the angles and facts presented in the input as a foundation.
4.  DIMENSIONAL DIVERSITY: The final set must show significant variation across: (a) Specific Niche/Angle Explored, (b) Core Question Answered, (c) Narrative Structure, (d) Target Reader (e.g., historian vs event organizer vs diaspora member implied by the text).
5.  NO EXTERNAL KNOWLEDGE INJECTION: Do not introduce concepts, historical details, or cultural aspects *not present* in the input text.`;

  const prompt = `
Analyze the following focused input data meticulously. The text is primarily factual and descriptive. Your challenge is to generate 5-7 *highly distinct, niche eBook ideas* grounded *exclusively* in the specific details provided.

# INPUT DATA:

## CONTENT:
${content.substring(0, 250000)} # Increased context limit

## FILES:
${files.length > 0 ? files.join(', ') : 'N/A'}

## LINKS:
${links.length > 0 ? links.join(', ') : 'N/A'}

# INSTRUCTIONS:

1.  **DEEP NICHE ANALYSIS:** Read the CONTENT, FILES, and LINKS specifically looking for:
    *   Contrasts and Comparisons (e.g., different dates, reasons, locations, levels of recognition).
    *   Evolutionary Paths (e.g., origins in one place spreading, event types changing).
    *   Specific Geographic Narratives (e.g., the Nova Scotia story, the US legislative path).
    *   Key Dates/Events and their stated significance (Arbroath, Dress Act repeal).
    *   Mentioned Groups/Organizations (Federation of Scottish Clans).

2.  **STRICTLY CONTEXT-DRIVEN IDEA GENERATION:** For *each* idea:
    *   Identify a *unique micro-niche or specific angle* found *only* in the input data.
    *   Define the core question this niche idea answers based *only* on the text.
    *   Propose a structure/approach suited to exploring *that specific angle* using the text's facts.
    *   Define the target reader *implied* by the focus on this specific textual detail.
    *   Base the title *only* on the specific niche/angle identified in the text.

3.  **OUTPUT SPECIFICATION (Per Idea):** Format EACH idea as a JSON object:
    *   \`title\`: Niche, specific title reflecting the angle derived *only* from the input.
    *   \`description\`: 2-3 sentences explaining the specific focus and value derived *only* from the input's details.
    *   \`target_audience\`: Specific reader group interested in *this precise angle* implied by the text.
    *   \`format_approach\`: Format suited to exploring the niche angle (e.g., comparative analysis, specific timeline, legislative history, case study of one location).
    *   \`unique_value\`: What specific detail, comparison, or evolution *from the text* makes this idea distinct?
    *   \`source_data\`: **CRITICAL:** Quote the specific phrase(s) or precisely reference the textual detail (e.g., 'the sentence comparing Apr 6 and Jul 1 dates', 'details on US Senate Resolution') that justifies this *specific* angle.
    *   \`commercial_potential\`: Briefly explain viability based on the uniqueness of the *text-derived* angle.

4.  **DIVERSITY AND SELF-CRITIQUE:** Generate 5-7 ideas. Before outputting, REVIEW the list. 
    *   Ensure significant diversity across the 4 dimensions mentioned in the system prompt (Niche/Angle, Core Question, Structure, Target Reader).
    *   **Critically check:** Does any idea rely on general knowledge *not* explicitly present or directly implied by the input text? If so, revise or replace it.
    *   If ideas are too similar (e.g., multiple general histories), replace duplicates with ideas focusing on *different specific details* or *contrasts* from the text.

Return ONLY a valid JSON array containing these 5-7 idea objects. Adherence to the input text is paramount.`;

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
  }, 60000); // 60 seconds timeout - longer to allow for more complex analysis

  try {
    // Notify that we're starting the process
    if (onProgress) {
      onProgress({
        retry: 0,
        maxRetries: 1,
        message: "Starting content analysis..."
      });
    }

    // Initialize API call with appropriate temperature
    const responsePromise = generateOpenRouterResponse(prompt, {
      systemPrompt,
      temperature: 0.7, // Lowered temperature for more focus
      maxTokens: 12000, // Kept max tokens
      maxRetries: 2, 
      onProgress
    });
    
    // Wait for the response with a timeout
    const apiTimeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("API request timed out")), 55000); // 55 seconds
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
  target_audience?: string;
  unique_value?: string;
  format_approach?: string; 
}, brainDumpContent: string): Promise<{
  title: string;
  description: string;
  chapters: { title: string; description: string; order_index: number }[];
}> {
  const systemPrompt = `You are a senior publishing strategist and bestselling non-fiction author with decades of experience in book development, structure, and publishing.

Your expertise is in transforming book concepts into comprehensive, market-ready outlines that deliver exceptional value to readers while maintaining commercial appeal.

Your task is to create a compelling, professionally structured eBook outline based on the provided concept and supporting content. This should include:

1. A refined, marketable title that clearly communicates the book's value proposition
2. An enhanced description that positions the book effectively in the marketplace
3. A comprehensive chapter structure that delivers on the book's core promise

The eBook should be substantial, with enough chapters to reach 40,000+ words when fully developed, making it comparable to professional trade non-fiction books.

Critical elements for success:
- Craft a narrative arc that takes readers on a transformative journey
- Ensure the structure builds progressively with appropriate knowledge scaffolding
- Create chapter descriptions that clearly communicate the value of each section
- Maintain focus on practical application and reader outcomes throughout
- Include appropriate front matter and back matter elements for a complete book`;

  const prompt = `
# EBOOK OUTLINE DEVELOPMENT PROJECT

## BOOK CONCEPT
WORKING TITLE: ${idea.title}
INITIAL DESCRIPTION: ${idea.description}
${idea.target_audience ? `TARGET AUDIENCE: ${idea.target_audience}` : ''}
${idea.unique_value ? `UNIQUE VALUE PROPOSITION: ${idea.unique_value}` : ''}
${idea.format_approach ? `FORMAT/APPROACH: ${idea.format_approach}` : ''}

## CONTENT ANALYSIS
${brainDumpContent.substring(0, 20000)}

## OUTLINE DEVELOPMENT TASKS

1. TITLE REFINEMENT
   - Evaluate the working title against marketplace standards
   - Ensure the title clearly communicates the core value proposition
   - Consider adding a compelling subtitle that expands on the main title
   - Test against competitors for distinctiveness and market appeal

2. DESCRIPTION ENHANCEMENT
   - Craft a compelling 3-5 sentence description that:
     * Identifies the core problem or opportunity
     * Explains the unique approach or solution
     * Highlights key benefits/transformation
     * Establishes credibility and authority
     * Includes a clear call to action

3. CHAPTER STRUCTURE DEVELOPMENT
   - Create a comprehensive 12-15 chapter outline including:
     * An engaging introduction that hooks readers
     * A logical progression of core concepts
     * Appropriate knowledge scaffolding
     * Practical application sections
     * A compelling conclusion
     * Any necessary appendices or resources

Please create a complete, publication-ready eBook structure following professional publishing standards. Include detailed chapter descriptions that explain what each chapter will cover and how it contributes to the reader's journey. 

Return your outline as a structured JSON object with the following format:
{
  "title": "Final Refined eBook Title",
  "description": "An enhanced 3-5 sentence description of the eBook that effectively positions it in the marketplace",
  "chapters": [
    {
      "title": "Chapter 1 Title",
      "description": "Detailed description of what this chapter covers and its value to readers",
      "order_index": 0
    },
    {
      "title": "Chapter 2 Title",
      "description": "Detailed description of what this chapter covers and its value to readers", 
      "order_index": 1
    },
    ...and so on
  ]
}

The first chapter (index 0) should be the Introduction, and the last chapter should be the Conclusion.
`;

  try {
    const response = await generateOpenRouterResponse(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 8000 // Increased to allow for more detailed chapter descriptions
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
  previousChapters: { title: string; content?: string }[],
  targetAudience?: string,
  formatApproach?: string,
  uniqueValue?: string
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
  const systemPrompt = `You are a world-class professional author, publisher, and subject matter expert with deep expertise in creating bestselling non-fiction books.

Your task is to write an exceptional ${chapterType} for the eBook titled "${bookTitle}". Your writing should be at the caliber of a New York Times bestselling author - engaging, insightful, and transformative for the reader.

Core principles for this writing:
1. DEPTH: Provide comprehensive coverage with meaningful insights, not surface-level content
2. ENGAGEMENT: Use storytelling, examples, case studies, and varied writing techniques to maintain interest
3. STRUCTURE: Create a clear, logical flow with effective use of headings, subheadings, lists, and other elements
4. PRACTICALITY: Include actionable takeaways, frameworks, templates, or exercises when appropriate
5. EXPERTISE: Demonstrate authoritative knowledge while remaining accessible to the target audience
6. COHERENCE: Maintain strong narrative connections to previous chapters and the book's central thesis

${targetAudience ? `\nTARGET AUDIENCE: ${targetAudience}\nTailor your tone, terminology, examples, and content depth specifically for this audience. Address their particular pain points, knowledge level, and goals.` : ''}
${formatApproach ? `\nFORMAT/APPROACH: ${formatApproach}\nMaintain this specific format and approach consistently throughout your writing. This is the chosen methodology for delivering value to readers.` : ''}
${uniqueValue ? `\nUNIQUE VALUE PROPOSITION: ${uniqueValue}\nEmphasize and reinforce this unique perspective or value proposition throughout your writing. This is what differentiates this book in the marketplace.` : ''}

Each chapter should be substantial (approximately 3,000-4,000 words) to ensure the complete book reaches 40,000+ words total. The writing should reflect current best practices and trends in the subject area.`;

  // Create context from previous chapters if available
  let previousChapterContexts = '';
  if (previousChapters && previousChapters.length > 0 && !isIntroduction) {
    previousChapterContexts = "PREVIOUS CHAPTERS SUMMARY:\n";
    
    // For introductions, we don't need previous chapters
    // For other chapters, include summaries of previous chapters
    const chaptersToInclude = previousChapters
      .filter(ch => ch.content && ch.content.trim().length > 0)
      .slice(0, isConclusion ? previousChapters.length : Math.min(3, previousChapters.length));
    
    chaptersToInclude.forEach((chapter, idx) => {
      const content = chapter.content || "";
      
      // Get first paragraph as a quick overview
      const firstParagraph = content.split('\n\n')[0] || "";
      
      // Extract headings for structure understanding
      const headings = content.match(/##\s.+/g) || [];
      const headingsText = headings.length > 0 ? `Key sections: ${headings.slice(0, 5).join(', ')}${headings.length > 5 ? '...' : ''}` : '';
      
      // Extract key points
      const bulletPoints = content.match(/- .+/g) || [];
      const keyPoints = bulletPoints.length > 0 
        ? `Key points: ${bulletPoints.slice(0, 3).join(', ')}${bulletPoints.length > 3 ? '...' : ''}`
        : '';
      
      previousChapterContexts += `Chapter ${idx + 1}: "${chapter.title}"\n${firstParagraph}\n${headingsText}\n${keyPoints}\n\n`;
    });
  }

  const prompt = `
# WRITING ASSIGNMENT: ${chapterType.toUpperCase()} FOR "${bookTitle}"

## BOOK OVERVIEW
- TITLE: "${bookTitle}"
- DESCRIPTION: "${bookDescription}"
${targetAudience ? `- TARGET AUDIENCE: ${targetAudience}` : ''}
${formatApproach ? `- FORMAT/APPROACH: ${formatApproach}` : ''}
${uniqueValue ? `- UNIQUE VALUE: ${uniqueValue}` : ''}

## CHAPTER DETAILS
- TITLE: "${chapterTitle}"
- DESCRIPTION: "${chapterDescription}"
- CHAPTER NUMBER: ${chapterIndex + 1} of ${totalChapters}
- TYPE: ${chapterType}

${previousChapterContexts ? previousChapterContexts : ''}

## CONTENT RESEARCH MATERIAL
${brainDumpContent.substring(0, 25000)}

## CHAPTER BLUEPRINT

${isIntroduction ? `
### Introduction Blueprint:
1. Begin with a powerful hook that immediately captures reader attention (story, statistic, question, scenario)
2. Establish the core problem or opportunity that this book addresses
3. Build credibility by demonstrating understanding of reader challenges
4. Present a clear value proposition - what readers will gain from this book
5. Introduce the book's unique approach or framework
6. Preview the transformation journey readers will experience
7. Provide a roadmap of chapters with brief descriptions
8. End with a compelling transition to the first content chapter
` : isConclusion ? `
### Conclusion Blueprint:
1. Begin by acknowledging the journey readers have completed
2. Synthesize the key insights and lessons from all previous chapters
3. Revisit the core transformation the book promised and delivered
4. Provide a framework for implementing the book's teachings in real life
5. Address potential obstacles and how to overcome them
6. Share inspirational success stories or examples
7. Offer clear next steps or a specific call to action
8. End with a powerful closing thought that resonates emotionally
` : `
### Main Chapter Blueprint:
1. Begin with a compelling opening that sets context and generates interest
2. Clearly establish this chapter's core purpose and promise
3. Outline the key questions or problems this chapter addresses
4. Present 4-6 major sections with clear subheadings
5. For each section:
   - Present the core concept clearly
   - Provide evidence or reasoning to support it
   - Include relevant examples, case studies, or stories
   - Offer practical application or implementation guidance
6. Include visual elements where helpful (tables, diagrams, charts)
7. Address common questions or objections related to the topic
8. Summarize key takeaways from the chapter
9. End with a strong transition to the next chapter
`}

## WRITING SPECIFICATIONS
- LENGTH: Approximately 3,000-4,000 words
- STYLE: Professional, authoritative yet conversational and engaging
- FORMATTING: Use markdown for structure (## for major headings, ### for subheadings)
- ELEMENTS: Include varied elements like stories, examples, analogies, frameworks, checklists, bullet points, etc.
- TONE: Confident, empathetic, and solution-focused

Please write the complete ${chapterType} now, delivering exceptional quality content that would meet publishing industry standards.
`;

  try {
    // Use appropriate temperature based on chapter type
    const temperature = isIntroduction || isConclusion ? 0.7 : 0.75;
    
    return await generateOpenRouterResponse(prompt, {
      systemPrompt,
      temperature,
      maxTokens: 8000, // Increased from 4096 to allow for more comprehensive chapters
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
  // Only include "Table of Contents" as the heading, not the book title
  let toc = `## Table of Contents\n\n`;
  
  chapters.sort((a, b) => a.order_index - b.order_index).forEach((chapter, index) => {
    // Use standardized format for chapter links
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
  // Ensure we have a valid title
  const bookTitle = title && title.trim() ? title.trim() : "Untitled eBook";
  
  // Sort chapters by order_index
  const sortedChapters = [...chapters].sort((a, b) => a.order_index - b.order_index);
  
  // Generate TOC (using a separate helper or within this function)
  // Note: The previous generateTableOfContents was defined elsewhere, let's keep it separate
  // Assuming generateTableOfContents exists and works correctly
  const toc = generateTableOfContents(bookTitle, sortedChapters);
  
  // Compile full ebook content with proper metadata and formatting
  let ebookContent = `# ${bookTitle}\n\n`;
  
  // Add description if available
  if (description && description.trim()) {
    ebookContent += `${description}\n\n`;
  }
  
  // Add table of contents
  ebookContent += `${toc}\n\n`;
  
  // Add each chapter with consistent formatting
  sortedChapters.forEach((chapter, index) => {
    if (chapter.content) {
      // Clean up potential issues in chapter content
      let chapterContent = chapter.content.trim();
      
      // Clean the incoming title: remove potential "Chapter X: " prefix
      let cleanTitle = chapter.title.replace(/^Chapter\s*\d+\s*:\s*/i, '').trim();
      if (!cleanTitle) {
        cleanTitle = `Chapter ${index + 1}`; // Fallback if title becomes empty
      }

      // Create standardized chapter heading with proper spacing
      ebookContent += `\n\n# Chapter ${index + 1}: ${cleanTitle}\n\n`;
      
      // If chapter content already contains the title as a heading, try to remove it to avoid duplication
      // Make this check more robust
      const potentialHeading = `# ${cleanTitle}`;
      const potentialHeadingL2 = `## ${cleanTitle}`;
      const contentStartsWithHeading = 
        chapterContent.startsWith(potentialHeading) || 
        chapterContent.startsWith(potentialHeadingL2) ||
        // Also check for the numbered format we just created
        chapterContent.startsWith(`# Chapter ${index + 1}: ${cleanTitle}`) ||
        chapterContent.startsWith(`## Chapter ${index + 1}: ${cleanTitle}`);

      if (contentStartsWithHeading) {
        // Remove the first line and any following empty lines more carefully
        const lines = chapterContent.split('\n');
        let firstContentLine = 1;
        while (lines[firstContentLine]?.trim() === '' && firstContentLine < lines.length) {
          firstContentLine++;
        }
        chapterContent = lines.slice(firstContentLine).join('\n').trim();
      }
      
      // Add chapter content with proper spacing
      ebookContent += `${chapterContent}\n\n`;
    } else {
      // Handle chapters with no content gracefully (e.g., add a placeholder or skip)
      console.warn(`Chapter ${index + 1} ("${chapter.title}") has no content.`);
    }
  });
  
  // For debugging - log content size to help diagnose issues
  console.log(`Generated eBook content: ${ebookContent.length} characters, ${ebookContent.split('\n').length} lines`);
  
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