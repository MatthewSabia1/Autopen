import { logError } from './utils/debug';

/**
 * Google Gemini API integration for AutoPen
 */

// API Key for Gemini
const GEMINI_API_KEY = 'AIzaSyDuVam0hncS3-xYE0oLjdifjtzfRf_0e9w';

// API endpoints
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL_ID = 'gemini-1.5-flash-latest'; // Using the latest Flash model

/**
 * Interface for API request parameters
 */
interface GeminiRequestParams {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
}

/**
 * Interface for API response
 */
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  promptFeedback?: {
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  };
}

/**
 * Generate a response from Gemini API with retry logic
 */
export async function generateGeminiResponse(prompt: string, options: {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  maxRetries?: number;
} = {}): Promise<string> {
  const maxRetries = options.maxRetries || 3;
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      // Configure request parameters
      const params: GeminiRequestParams = {
        contents: [
          {
            parts: [
              { text: options.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 8192
        }
      };

      // Make API request
      const response = await fetch(
        `${GEMINI_API_URL}/${GEMINI_MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json() as GeminiResponse;
      
      // Check if we got a valid response
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }

      // Extract the text from the response
      return data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      lastError = error;
      logError('generateGeminiResponse', error, { 
        promptLength: prompt.length,
        retry: retries + 1,
        maxRetries
      });
      
      // Only retry on network errors or rate limit errors
      // Don't retry on input validation errors
      if (error.message && (
        error.message.includes('fetch failed') || 
        error.message.includes('429') ||
        error.message.includes('500') ||
        error.message.includes('503')
      )) {
        retries++;
        // Exponential backoff: wait longer between each retry
        const delay = Math.min(1000 * Math.pow(2, retries), 10000); // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Don't retry for other errors
        break;
      }
    }
  }

  // If we've exhausted all retries or encountered a non-retryable error
  throw new Error(`Failed to generate response after ${retries} retries: ${lastError?.message}`);
}

/**
 * Generate ideas from brain dump data using Gemini
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
    const response = await generateGeminiResponse(prompt, {
      systemPrompt,
      temperature: 0.7
    });

    // Extract the JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse ideas from Gemini response');
    }

    return JSON.parse(jsonMatch[0]);
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
    const response = await generateGeminiResponse(prompt, {
      systemPrompt,
      temperature: 0.5
    });

    // Extract the JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse eBook structure from Gemini response');
    }

    return JSON.parse(jsonMatch[0]);
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
  const previousChapterContexts = previousChapters
    .filter(ch => ch.content)
    .map((ch, idx) => {
      const content = ch.content || "";
      // Extract first paragraph and any headings to create a summary
      const firstParagraph = content.split('\n\n')[0] || "";
      const headings = content.match(/##\s.+/g) || [];
      return `Chapter ${idx + 1}: "${ch.title}"\n${firstParagraph}\nKey sections: ${headings.join(', ')}`;
    })
    .join('\n\n');

  const prompt = `
WRITE ${chapterType.toUpperCase()} FOR EBOOK: "${bookTitle}"

BOOK DESCRIPTION: "${bookDescription}"

CHAPTER TITLE: "${chapterTitle}"
CHAPTER DESCRIPTION: "${chapterDescription}"
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
    return await generateGeminiResponse(prompt, {
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