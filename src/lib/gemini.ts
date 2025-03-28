import { logError } from './utils/debug';

/**
 * Google Gemini API integration for AutoPen
 */

// API Key for Gemini
// NOTE: In production, this should be stored in an environment variable
// Using a hardcoded key only for development purposes
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDuVam0hncS3-xYE0oLjdifjtzfRf_0e9w';

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
  const systemPrompt = `You are an expert content strategist and creative idea generator helping to create diverse, unique eBook ideas from unstructured content.
Analyze the content, identify key themes, topics, subtopics, and angles. Think deeply about different target audiences, perspectives, and formats.

Your goal is to generate 4-8 HIGHLY DIVERSE, NON-REPETITIVE eBook ideas with DIFFERENT STRUCTURES, FORMATS, and APPROACHES.

CRITICAL REQUIREMENTS:
1. NO TWO TITLES may follow the same pattern or format (e.g., avoid repetitive patterns like "X: A Complete Guide" for multiple ideas)
2. Each description MUST use different language patterns and sentence structures
3. Target audiences MUST be highly specific and different demographics
4. Each idea MUST use a completely different approach: how-to guide, case study collection, workbook, framework explanation, etc.
5. AVOID generic, broad ideas - be specific, focused, and unique

Here are EXAMPLES of diverse eBook types (use these for inspiration, but create your own):
- A tactical how-to manual with step-by-step instructions for beginners
- A deep analysis of case studies with lessons for industry veterans
- A provocative manifesto challenging conventional wisdom
- A practical workbook with exercises and templates
- A focused deep-dive on a specific niche application
- A collection of interviews and perspectives from diverse experts
- A problem-solving framework with decision trees and flowcharts`;

  const prompt = `
CONTENT:
${content.substring(0, 25000)}

${files.length > 0 ? `FILES: ${files.join(', ')}` : ''}
${links.length > 0 ? `LINKS: ${links.join(', ')}` : ''}

Process:
1) First, identify 10+ distinct themes, topics, or angles from the input data
2) For each theme, identify 3-4 completely different ways it could be approached
3) Select the most promising combinations that would make excellent, diverse eBooks
4) Ensure each idea uses a COMPLETELY DIFFERENT title format and structure

Based on this, generate 4-8 high-quality, EXTREMELY DIVERSE eBook ideas. 

IMPORTANT FORMAT REQUIREMENTS:
- DO NOT use the same title structure for any two ideas (avoid patterns like "The X Guide to Y" repeatedly)
- EVERY title must have a unique structure and approach
- NO GENERIC TITLES like "A Complete Guide" or "The Ultimate Guide" - be specific and creative
- NO REPETITIVE DESCRIPTIONS - each description should have a unique structure and focus

For each idea, provide:
1. Title: A catchy, marketable title with a unique structure
2. Description: A brief description of what the eBook would cover (2-3 sentences)
3. Target Audience: The specific audience this eBook serves (be very specific about demographics, experience level, etc.)
4. Format/Approach: The specific format or approach this eBook will take (e.g., workbook, case studies, how-to guide)
5. Unique Value: What makes this idea stand out from the others
6. Source: Which part of the input data inspired this idea

Format each idea as:
{
  "title": "Title Here",
  "description": "Description here...",
  "target_audience": "Specific audience description...",
  "format_approach": "Specific format/approach...",
  "unique_value": "What makes this idea stand out...",
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
  target_audience?: string;
  unique_value?: string;
}, brainDumpContent: string): Promise<{
  title: string;
  description: string;
  chapters: { title: string; description: string; order_index: number }[];
}> {
  const systemPrompt = `You are an expert eBook writer and editor with deep expertise in creating engaging, targeted content. 
Your task is to create a compelling title and detailed table of contents for an eBook based on the provided idea, 
target audience, unique value proposition, and content.

The eBook should be substantial, with enough chapters to reach 30,000+ words when fully developed.
You should tailor the structure and content approach specifically to the target audience's needs, interests, and knowledge level.
Emphasize the unique value throughout the chapter structure, ensuring the eBook delivers on its core promise.`;

  const prompt = `
IDEA TITLE: ${idea.title}
IDEA DESCRIPTION: ${idea.description}
${idea.target_audience ? `TARGET AUDIENCE: ${idea.target_audience}` : ''}
${idea.unique_value ? `UNIQUE VALUE: ${idea.unique_value}` : ''}

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
  previousChapters: { title: string; content?: string }[],
  targetAudience?: string,
  formatApproach?: string,
  uniqueValue?: string
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
Each chapter should be approximately 2,500-3,000 words in length to ensure the complete book reaches 30,000+ words total.
${targetAudience ? `\nTARGET AUDIENCE: ${targetAudience}\nTailor your writing style, examples, and content specifically for this audience.` : ''}
${formatApproach ? `\nFORMAT/APPROACH: ${formatApproach}\nFollow this specific format and approach consistently throughout your writing.` : ''}
${uniqueValue ? `\nUNIQUE VALUE: ${uniqueValue}\nEmphasize this unique perspective or value throughout your writing.` : ''}`;

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
${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}
${formatApproach ? `FORMAT/APPROACH: ${formatApproach}` : ''}
${uniqueValue ? `UNIQUE VALUE: ${uniqueValue}` : ''}

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