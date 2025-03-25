import { logError } from './utils/debug';

/**
 * OpenRouter API integration for AutoPen
 */

// API Key for OpenRouter
// NOTE: In production, this should be stored in an environment variable
// Using a hardcoded key only for development purposes
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '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';

// API endpoints
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Specific models to use per user request
// Only use deepseek models
const MODELS = [
  'deepseek/deepseek-r1:free',         // Primary model
  'deepseek/deepseek-chat-v3-0324:free' // Fallback model
];

// Start with the primary model
let OPENROUTER_MODEL = MODELS[0];

// Expose a function to switch models in case of failures
const switchToNextModel = () => {
  const currentIndex = MODELS.indexOf(OPENROUTER_MODEL);
  if (currentIndex < MODELS.length - 1) {
    OPENROUTER_MODEL = MODELS[currentIndex + 1];
    console.log(`Switched to model: ${OPENROUTER_MODEL}`);
    return true;
  }
  return false; // No more models to try
};

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
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096
      };

      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout - increased from 30s
      
      // Debug the request
      notifyProgress(`Calling OpenRouter API with model: ${OPENROUTER_MODEL}`);
      console.log(`OpenRouter request params:`, {
        model: params.model,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        messageCount: params.messages.length,
        url: OPENROUTER_API_URL
      });
      
      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
            'HTTP-Referer': 'https://autopen.app',
            'X-Title': 'AutoPen',
            'User-Agent': 'AutoPen/1.0.0'
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
        const delay = Math.min(2000 * Math.pow(2, retries), 10000); // Max 10 seconds (reduced from 20s)
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
    title: "Complete Guide to Personal Development",
    description: "A comprehensive guide covering essential aspects of personal growth, including goal setting, habit formation, time management, and mindfulness practices.",
    source_data: "Generated as a fallback option based on common personal development themes."
  },
  {
    title: "Effective Communication in the Digital Age",
    description: "Strategies and techniques for clear, impactful communication across digital platforms, social media, and remote work environments.",
    source_data: "Generated as a fallback option based on communication trends."
  },
  {
    title: "The Art of Productivity: From Overwhelm to Flow",
    description: "A practical approach to productivity that focuses on creating flow states, managing energy instead of time, and creating systems that work for your unique needs.",
    source_data: "Generated as a fallback option based on productivity concepts."
  },
  {
    title: "Financial Independence: A Step-by-Step Blueprint",
    description: "A structured guide to achieving financial freedom through smart budgeting, investing strategies, passive income creation, and wealth mindset development.",
    source_data: "Generated as a fallback option based on personal finance principles."
  }
];

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
    // Notify that we're starting the process
    if (onProgress) {
      onProgress({
        retry: 0,
        maxRetries: 3,
        message: "Starting content analysis..."
      });
    }
    
    const response = await generateOpenRouterResponse(prompt, {
      systemPrompt,
      temperature: 0.7,
      onProgress: onProgress
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
    
    // Use fallback ideas after notifying the user
    if (onProgress) {
      onProgress({
        retry: 0,
        maxRetries: 0,
        message: "API connection failed. Using backup ideas instead."
      });
    }
    
    console.warn("Using fallback ebook ideas due to API failure:", error.message);
    
    // Wait a moment to ensure user sees the message
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return fallback ideas
    return FALLBACK_EBOOK_IDEAS;
  }
}

/**
 * Generate an eBook title and table of contents based on the selected idea
 */
// Fallback ebook structure for when the API fails
const generateFallbackStructure = (idea: { title: string; description: string }) => {
  return {
    title: idea.title,
    description: idea.description || "A comprehensive guide covering key concepts and practical advice.",
    chapters: [
      { title: "Introduction", description: "Overview of the book and what readers will learn.", order_index: 0 },
      { title: "Understanding the Basics", description: "Fundamental concepts and terminology.", order_index: 1 },
      { title: "Key Principles", description: "Core principles and frameworks.", order_index: 2 },
      { title: "Common Challenges", description: "Typical obstacles and how to overcome them.", order_index: 3 },
      { title: "Practical Strategies", description: "Actionable techniques and methods.", order_index: 4 },
      { title: "Real-World Applications", description: "Case studies and examples.", order_index: 5 },
      { title: "Advanced Concepts", description: "Taking your understanding to the next level.", order_index: 6 },
      { title: "Tools and Resources", description: "Essential tools and resources to support your journey.", order_index: 7 },
      { title: "Future Trends", description: "Emerging developments and what to expect.", order_index: 8 },
      { title: "Conclusion", description: "Summary and final thoughts.", order_index: 9 }
    ]
  };
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
    console.warn("Using fallback ebook structure due to API failure:", error.message);
    return generateFallbackStructure(idea);
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
  const isIntroduction = chapterIndex === 0;
  const isConclusion = chapterIndex === totalChapters - 1;
  
  if (isIntroduction) {
    return `# Introduction
    
## Welcome to "${bookTitle}"

This book aims to provide you with a comprehensive understanding of ${chapterTitle.toLowerCase()}. In the following chapters, we'll explore various aspects of this topic, from fundamental concepts to practical applications.

## Why This Matters

${chapterDescription || "This subject is increasingly important in today's rapidly changing world."}

## What You'll Learn

Throughout this book, you'll gain insights into:

- Core principles and methodologies
- Practical techniques and strategies
- Real-world applications and case studies
- Tools and resources to support your journey

## How to Use This Book

Whether you're a beginner or have some experience in this field, this book is designed to meet you where you are. Each chapter builds upon the previous one, so I recommend reading them in sequence for the best understanding.

Let's begin our exploration of ${bookTitle}.`;
  } else if (isConclusion) {
    return `# Conclusion

## Key Takeaways

Throughout this book, we've explored the various dimensions of ${bookTitle.toLowerCase()}. Let's revisit some of the key points we've covered:

- The fundamental principles that form the foundation of this subject
- Practical strategies for implementation and growth
- Common challenges and how to overcome them
- Tools and resources to support your ongoing journey

## Next Steps

As you move forward, consider how you might apply what you've learned in your specific context. Remember that mastery comes through consistent practice and application.

## Final Thoughts

Thank you for joining me on this journey through ${bookTitle}. I hope the insights and strategies shared in this book will serve as valuable tools in your personal and professional growth.

Keep learning, keep growing, and keep pushing the boundaries of what's possible.`;
  } else {
    return `# ${chapterTitle}

## Overview

${chapterDescription || "This chapter explores important concepts and practical applications."}

## Key Concepts

In this chapter, we'll examine several important ideas:

### Concept 1: Foundation

Understanding the basics is crucial before moving to advanced topics. This section covers the essential elements that form the foundation of this subject.

### Concept 2: Application

Theory without application has limited value. Here, we'll look at how to put these ideas into practice in real-world scenarios.

### Concept 3: Integration

Learning how these concepts integrate with existing knowledge and systems is vital for comprehensive understanding.

## Practical Examples

Let's consider a few examples that illustrate these concepts:

1. **Example A**: This demonstrates how the principles can be applied in a business context.
2. **Example B**: Here we see how individuals have successfully implemented these ideas.
3. **Example C**: This case study shows both challenges and solutions.

## Common Challenges

When working with these concepts, you might encounter several challenges:

- Challenge 1 and strategies to overcome it
- Challenge 2 and effective approaches
- Challenge 3 and proven solutions

## Summary

This chapter has explored ${chapterTitle.toLowerCase()}, covering key concepts, practical applications, and common challenges. In the next chapter, we'll build on these ideas as we examine [next topic].`;
  }
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
      temperature: 0.7,
      maxTokens: 4096 // Maximum token limit for a substantial chapter
    });
  } catch (error: any) {
    logError('generateChapterContent', error);
    console.warn(`Failed to generate chapter content: ${error.message}`);
    
    // Use fallback content instead of throwing an error
    return generateFallbackChapterContent(
      bookTitle,
      chapterTitle,
      chapterDescription,
      chapterIndex,
      totalChapters
    );
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