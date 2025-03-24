import { Buffer } from 'buffer';
import { LinkItem } from '../types/BrainDumpTypes';
import { OpenRouterRequest, OpenRouterResponse } from '../types/ebook.types';

// Constants for OpenRouter API - Use environment variables if available
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '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';
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-lite-001';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Custom interface for the OpenRouter file format
interface OpenRouterFile {
  data: string;
  mime_type: string;
}

// Interface for the AI response
export interface AIAnalysisResponse {
  summary: string;
  ebookIdeas: Array<{
    title: string;
    description: string;
    chapters: string[];
  }>;
  error?: string;
}

// Function to convert a file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Function to extract text from a YouTube video URL
export const extractYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

// Prepare link content including transcripts
const prepareLinkContent = (links: LinkItem[]): string => {
  let content = '';
  
  links.forEach(link => {
    if (link.type === 'youtube') {
      if (link.transcript) {
        content += `YOUTUBE VIDEO: ${link.title}\nURL: ${link.url}\nTRANSCRIPT:\n${link.transcript}\n\n`;
      } else {
        content += `YOUTUBE VIDEO: ${link.title}\nURL: ${link.url}\n(No transcript available)\n\n`;
      }
    } else {
      content += `WEBPAGE: ${link.title}\nURL: ${link.url}\n\n`;
    }
  });
  
  return content;
};

// Main function to send content to OpenRouter for analysis
export const analyzeContent = async ({
  text,
  files,
  links
}: {
  text: string;
  files: Array<{
    file: File;
    type: string;
  }>;
  links: Array<LinkItem>;
}): Promise<AIAnalysisResponse> => {
  try {
    // Prepare the files for OpenRouter (convert to base64)
    const filePromises = files.map(async fileItem => {
      const base64 = await fileToBase64(fileItem.file);
      return {
        data: base64,
        mime_type: fileItem.file.type
      } as OpenRouterFile;
    });
    
    const processedFiles = await Promise.all(filePromises);
    
    // Process links and include transcripts
    const linksContent = prepareLinkContent(links);
    
    // Combine all content for analysis
    let contentToAnalyze = '';
    
    if (text) {
      contentToAnalyze += `USER TEXT CONTENT:\n${text}\n\n`;
    }
    
    if (linksContent) {
      contentToAnalyze += `LINKS PROVIDED:\n${linksContent}\n`;
    }
    
    if (files.length > 0) {
      contentToAnalyze += `FILES PROVIDED: ${files.length} file(s)\n`;
      files.forEach(file => {
        contentToAnalyze += `- ${file.file.name} (${file.type})\n`;
      });
    }
    
    // Prepare the system prompt for the AI
    const systemPrompt = `
You are an expert e-book creator and content organizer. Your task is to analyze the provided content and suggest structured e-book ideas.

Analyze the content carefully and extract the main themes, topics, and patterns. Then provide:

1. A concise summary of the content's main focus (2-3 sentences)
2. At least 2 e-book ideas based on the content, each with:
   - A compelling title
   - A brief description (1-2 sentences)
   - 3-5 suggested chapter titles

Return your analysis in JSON format with the following structure:
{
  "summary": "Content summary here...",
  "ebookIdeas": [
    {
      "title": "E-book title 1",
      "description": "Brief description",
      "chapters": ["Chapter 1 title", "Chapter 2 title", "Chapter 3 title"]
    },
    {
      "title": "E-book title 2",
      "description": "Brief description",
      "chapters": ["Chapter 1 title", "Chapter 2 title", "Chapter 3 title"]
    }
  ]
}
`;

    // Prepare the request payload
    const payload = {
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: contentToAnalyze
            },
            ...processedFiles.map(file => ({
              type: "image_url",
              image_url: {
                url: `data:${file.mime_type};base64,${file.data}`
              }
            }))
          ]
        }
      ],
      response_format: { type: "json_object" }
    };

    // Call the OpenRouter API
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Autopen AI E-book Creation Assistant'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage = 'Error calling OpenRouter API';
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'API authentication failed. Please check your OpenRouter API key.';
        } else if (response.status === 429) {
          errorMessage = 'API rate limit exceeded. Please try again later.';
        } else if (response.status >= 500) {
          errorMessage = 'OpenRouter service is experiencing issues. Please try again later.';
        }
      } catch (e) {
        // Failed to parse error JSON, use status code for more specific message
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'No auth credentials found or invalid API key';
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response content from AI');
    }

    // Parse the AI response (should be JSON)
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return parsedResponse as AIAnalysisResponse;
    } catch (error) {
      console.error('Failed to parse AI response as JSON', error);
      console.log('Raw AI response:', aiResponse);
      
      // Return a structured error
      return {
        summary: "Failed to process the AI response.",
        ebookIdeas: [],
        error: "The AI returned a response in an unexpected format."
      };
    }
  } catch (error) {
    console.error('Error in analyzeContent:', error);
    
    // Handle the case where there's no actual content but we need to show something
    if ((!text || text.trim() === '') && files.length === 0 && links.length === 0) {
      return {
        summary: "No content was provided for analysis. Please add text, upload files, or provide links for the AI to analyze.",
        ebookIdeas: [],
        error: "No content provided"
      };
    }
    
    // Provide a helpful error message based on the error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // In development or when requested, provide mock data for testing
    const useMockData = import.meta.env.DEV && error.toString().includes('auth');
    
    if (useMockData) {
      console.log('Using mock data due to API authentication issues in development');
      
      // Return mock data for development purposes
      return {
        summary: "This is mock analysis data for development. The actual AI analysis service couldn't be reached.",
        ebookIdeas: [
          {
            title: "Content Organization Strategies",
            description: "A comprehensive guide to organizing different types of content for maximum impact and readability.",
            chapters: ["Understanding Content Types", "Structural Frameworks", "Visual Organization", "Flow and Narrative", "Testing and Iteration"]
          },
          {
            title: "The Digital Content Creator's Handbook",
            description: "Essential techniques and tools for creating high-quality digital content across multiple platforms.",
            chapters: ["Content Planning", "Creation Workflows", "Editing and Refinement", "Distribution Strategies", "Analytics and Improvement"]
          }
        ],
        error: "Using mock data: " + errorMessage
      };
    }
    
    return {
      summary: "An error occurred during analysis.",
      ebookIdeas: [],
      error: errorMessage
    };
  }
};

/**
 * OpenRouter API service for interacting with various AI models
 */
export class OpenRouterService {
  private static readonly API_URL = import.meta.env.VITE_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
  private static readonly API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  /**
   * Generate text using the OpenRouter API
   * @param params OpenRouter request parameters
   * @returns Promise with OpenRouter response
   */
  public static async generateText(params: OpenRouterRequest): Promise<OpenRouterResponse> {
    if (!this.API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Autopen eBook Creator'
      };

      // Prepare request payload with system message for better context
      const systemMessage = "You are an expert eBook creator assistant helping to generate high-quality, professional content for an eBook. Follow the instructions carefully and provide only the requested output format.";
      
      const payload = {
        model: params.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: params.prompt }
        ],
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2000,
        top_p: params.top_p || 0.95,
        stream: false
      };

      console.log(`Sending request to OpenRouter API with model: ${params.model}`);
      
      // Implement retry logic
      const MAX_RETRIES = 3;
      let retries = 0;
      let response;
      
      while (retries < MAX_RETRIES) {
        try {
          response = await fetch(this.API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          
          if (response.ok) break;
          
          // If we get a 429 (rate limit) or 5xx (server error), retry
          if (response.status === 429 || response.status >= 500) {
            retries++;
            console.log(`API request failed with status ${response.status}, retrying (${retries}/${MAX_RETRIES})...`);
            
            // Exponential backoff: 2^retries * 1000ms (1s, 2s, 4s)
            const backoffTime = Math.min(Math.pow(2, retries) * 1000, 10000);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            // For other errors, don't retry
            break;
          }
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') {
            throw new Error('OpenRouter API request timed out');
          }
          throw fetchError;
        }
      }

      clearTimeout(timeoutId);

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('OpenRouter API error:', {
          status: response?.status,
          statusText: response?.statusText,
          errorData
        });
        throw new Error(`OpenRouter API error: ${response?.status} ${response?.statusText} ${JSON.stringify(errorData || {})}`);
      }

      const data = await response.json();
      
      // Convert the OpenRouter response format to our expected format
      return {
        id: data.id,
        object: data.object,
        created: data.created,
        model: data.model,
        choices: data.choices.map((choice: any) => ({
          text: choice.message.content,
          index: choice.index,
          logprobs: null,
          finish_reason: choice.finish_reason
        }))
      };
    } catch (error: any) {
      console.error('Error in generateText:', error);
      if (error.name === 'AbortError') {
        throw new Error('OpenRouter API request timed out');
      }
      
      // Provide more helpful error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network connection error: Unable to connect to the AI service. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }

  /**
   * Generate title for an eBook using the specified model
   * @param rawData The input data to use for title generation
   * @param model The OpenRouter model to use (defaults to google/gemma-3-12b-it:free)
   * @returns Promise with the generated title
   */
  public static async generateEbookTitle(
    rawData: string,
    model: string = 'google/gemma-3-12b-it:free'
  ): Promise<string> {
    const prompt = `Given the following structured data containing key themes, topics, and summaries, generate an engaging and viral eBook title that succinctly encapsulates the core message. The title should be catchy, clear, and adaptable to various genres or content styles. If the provided data is minimal, infer a creative title based on best-practice title structures.

Raw Data:
${rawData}

Output only the title without any additional text or formatting.`;

    const response = await this.generateText({
      model,
      prompt,
      temperature: 0.8,
      max_tokens: 50
    });

    return response.choices[0].text.trim();
  }

  /**
   * Generate table of contents for an eBook using the specified model
   * @param rawData The input data to use for TOC generation
   * @param title The eBook title
   * @param model The OpenRouter model to use (defaults to deepseek/deepseek-r1-zero:free)
   * @returns Promise with the generated TOC as a JSON string
   */
  public static async generateEbookTOC(
    rawData: string,
    title: string,
    model: string = 'deepseek/deepseek-r1-zero:free'
  ): Promise<string> {
    const prompt = `Review the following structured data comprising key points, themes, and summaries. Develop a detailed table of contents for an eBook titled "${title}" by outlining chapter titles. For each chapter, list the corresponding data points or topics that will be discussed. Ensure the sequence offers a logical flow and accommodates both broad and niche content areas. If gaps are detected, propose additional sections that could enhance the narrative.

Raw Data:
${rawData}

Format your response as a valid JSON object with this structure:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "dataPoints": ["Data point 1", "Data point 2", "..."]
    }
  ]
}

Provide only the JSON without any additional text or formatting.`;

    const response = await this.generateText({
      model,
      prompt,
      temperature: 0.7,
      max_tokens: 2000
    });

    // Ensure we get valid JSON
    try {
      const text = response.choices[0].text.trim();
      // Extract JSON if it's wrapped in code blocks or has extra text
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                        text.match(/```\s*([\s\S]*?)\s*```/) || 
                        text.match(/(\{[\s\S]*\})/);
      
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      
      // Validate by parsing
      JSON.parse(jsonString);
      
      return jsonString;
    } catch (error) {
      console.error('Error parsing TOC JSON:', error);
      throw new Error('Failed to generate valid table of contents. The AI output was not properly formatted as JSON.');
    }
  }

  /**
   * Generate a chapter for an eBook using the specified model
   * @param chapterTitle The title of the chapter
   * @param dataPoints Array of data points for this chapter
   * @param model The OpenRouter model to use (defaults to deepseek/deepseek-r1-zero:free)
   * @returns Promise with the generated chapter content
   */
  public static async generateEbookChapter(
    chapterTitle: string,
    dataPoints: string[],
    model: string = 'deepseek/deepseek-r1-zero:free'
  ): Promise<string> {
    const dataPointsText = dataPoints.map(dp => `- ${dp}`).join('\n');
    
    const prompt = `Compose a comprehensive chapter for the eBook titled '${chapterTitle}' by incorporating the following data points:

${dataPointsText}

The chapter must be detailed, coherent, and engaging, with a clear narrative structure. Include explanations, examples, and smooth transitions to enhance readability. If the input data is sparse, intelligently expand on common themes while remaining consistent with the overall ebook purpose.

Output only the chapter content without any additional text or formatting.`;

    const response = await this.generateText({
      model,
      prompt,
      temperature: 0.7,
      max_tokens: 4000
    });

    return response.choices[0].text.trim();
  }

  /**
   * Generate an introduction for an eBook using the specified model
   * @param title The eBook title
   * @param tableOfContents The table of contents object
   * @param model The OpenRouter model to use (defaults to google/gemma-3-12b-it:free)
   * @returns Promise with the generated introduction
   */
  public static async generateEbookIntroduction(
    title: string,
    tableOfContents: any,
    model: string = 'google/gemma-3-12b-it:free'
  ): Promise<string> {
    const chapterTitles = tableOfContents.chapters.map((ch: any) => ch.title).join('\n- ');
    
    const prompt = `Craft an engaging introduction for an eBook titled '${title}' that leverages the following table of contents:

- ${chapterTitles}

Your introduction should establish a strong hook, outline the main themes, and set clear expectations for the reader. Aim for 300–500 words, ensuring the tone is inviting and adaptable to a variety of content styles. Consider starting with a thought-provoking question or a striking statistic to capture attention.

Output only the introduction without any additional text or formatting.`;

    const response = await this.generateText({
      model,
      prompt,
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].text.trim();
  }

  /**
   * Generate a conclusion for an eBook using the specified model
   * @param title The eBook title
   * @param tableOfContents The table of contents object
   * @param model The OpenRouter model to use (defaults to google/gemma-3-12b-it:free)
   * @returns Promise with the generated conclusion
   */
  public static async generateEbookConclusion(
    title: string,
    tableOfContents: any,
    model: string = 'google/gemma-3-12b-it:free'
  ): Promise<string> {
    const chapterSummaries = tableOfContents.chapters.map((ch: any, i: number) => 
      `${i+1}. ${ch.title}: ${ch.dataPoints.join(', ')}`
    ).join('\n');
    
    const prompt = `Develop a compelling conclusion for the ebook titled '${title}' by summarizing the essential points from the following chapters:

${chapterSummaries}

Reinforce the central message, tie together any loose ends, and provide the reader with actionable takeaways or a memorable closing thought. Aim for a 500–1000-word conclusion that is both reflective and inspiring.

Output only the conclusion without any additional text or formatting.`;

    const response = await this.generateText({
      model,
      prompt,
      temperature: 0.7,
      max_tokens: 1500
    });

    return response.choices[0].text.trim();
  }

  /**
   * Review and revise an eBook draft using the specified model
   * @param ebookContent The complete eBook content to review
   * @param model The OpenRouter model to use (defaults to deepseek/deepseek-r1-zero:free)
   * @returns Promise with the revised eBook content
   */
  public static async reviewAndReviseEbook(
    ebookContent: any,
    model: string = 'deepseek/deepseek-r1-zero:free'
  ): Promise<any> {
    // First, prepare the content for review in a structured format
    const title = ebookContent.title;
    const introduction = ebookContent.introduction;
    const conclusion = ebookContent.conclusion;
    const chaptersText = ebookContent.chapters?.map((ch: any, i: number) => 
      `CHAPTER ${i+1}: ${ch.title}\n\n${ch.content}`
    ).join('\n\n---\n\n');
    
    const contentForReview = `
TITLE: ${title}

INTRODUCTION:
${introduction}

CHAPTERS:
${chaptersText}

CONCLUSION:
${conclusion}
`;

    console.log('Starting AI review and revision process');
    
    // Step 1: Detailed review and feedback generation
    const reviewPrompt = `You are a professional editor reviewing an eBook draft. Your task is to provide a comprehensive, detailed review focusing on improving the quality, readability, and professionalism of the content.

Please analyze the following eBook draft carefully, looking for:

1. COHERENCE: Evaluate the logical flow of ideas and arguments across chapters and sections
2. CLARITY: Check if explanations are clear and concepts well-presented
3. CONSISTENCY: Assess consistency in tone, style, terminology, and formatting
4. ENGAGEMENT: Determine how compelling and interesting the content is for readers
5. COMPLETENESS: Identify any gaps or areas that need more development
6. LANGUAGE: Note any awkward phrasing, grammatical issues, or repetitive language

EBOOK CONTENT:
${contentForReview}

Provide your review as a structured list of SPECIFIC feedback points organized by section (Title, Introduction, each Chapter, Conclusion). For each issue, explain:
1. What exactly needs improvement (quote problematic text when possible)
2. Why it's an issue
3. Specific, actionable suggestions for how to fix it

Format your feedback clearly using proper headings and bullet points, making it easy to understand each recommended change.`;

    try {
      const reviewResponse = await this.generateText({
        model,
        prompt: reviewPrompt,
        temperature: 0.5, // Lower temperature for more focused analysis
        max_tokens: 3000  // Increased for detailed review
      });

      const reviewNotes = reviewResponse.choices[0].text.trim();
      console.log('AI review completed, length:', reviewNotes.length);

      // Step 2: Iterative chapter-by-chapter revision
      const revisedChapters = [];
      console.log(`Starting revision of ${ebookContent.chapters?.length} chapters`);
      
      // Revise chapters one by one for better quality and to avoid token limits
      if (ebookContent.chapters && ebookContent.chapters.length > 0) {
        for (let i = 0; i < ebookContent.chapters.length; i++) {
          const chapter = ebookContent.chapters[i];
          console.log(`Revising chapter ${i+1}: ${chapter.title}`);
          
          const chapterRevisionPrompt = `You are revising Chapter ${i+1} of an eBook based on editorial feedback. Here is the overall feedback for the entire eBook:

${reviewNotes}

Now, focus specifically on improving this chapter. Enhance clarity, coherence, and reader engagement while maintaining the original content's core message and structure.

ORIGINAL CHAPTER ${i+1}: ${chapter.title}
${chapter.content}

Produce a revised version of this chapter only. Keep the same chapter title but improve the content based on the feedback. Your revision should enhance readability, fix any issues mentioned in the feedback, and make the content more engaging and professional.`;

          const chapterResponse = await this.generateText({
            model,
            prompt: chapterRevisionPrompt,
            temperature: 0.6,
            max_tokens: 4000 // Increased for substantial chapters
          });

          const revisedChapterContent = chapterResponse.choices[0].text.trim();
          revisedChapters.push({
            title: chapter.title,
            content: revisedChapterContent,
            chapterIndex: i,
            id: chapter.id,
            dataPoints: chapter.dataPoints || []
          });
        }
      }

      // Step 3: Revise the title, introduction and conclusion
      const metaContentRevisionPrompt = `Based on the following editorial feedback about an eBook:

${reviewNotes}

Please revise these specific sections of the eBook. Make them more engaging, clear, and professional while maintaining the core message:

TITLE: ${title}
INTRODUCTION:
${introduction}
CONCLUSION:
${conclusion}

Provide your response in valid JSON format:
{
  "title": "Improved Title",
  "introduction": "Revised introduction text...",
  "conclusion": "Revised conclusion text..."
}`;

      const metaContentResponse = await this.generateText({
        model,
        prompt: metaContentRevisionPrompt,
        temperature: 0.6,
        max_tokens: 4000
      });

      // Process the response
      try {
        const text = metaContentResponse.choices[0].text.trim();
        
        // Extract JSON if it's wrapped in code blocks or has extra text
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                          text.match(/```\s*([\s\S]*?)\s*```/) || 
                          text.match(/(\{[\s\S]*\})/);
        
        const jsonString = jsonMatch ? jsonMatch[1] : text;
        const parsedMetaContent = JSON.parse(jsonString);
        
        // Combine revised content
        const revisedContent = {
          title: parsedMetaContent.title || title,
          introduction: parsedMetaContent.introduction || introduction,
          chapters: revisedChapters.length > 0 ? revisedChapters : ebookContent.chapters,
          conclusion: parsedMetaContent.conclusion || conclusion,
          rawData: ebookContent.rawData, // Preserve original data
          tableOfContents: ebookContent.tableOfContents // Preserve TOC
        };
        
        console.log('AI revision completed successfully');
        return revisedContent;
        
      } catch (jsonError) {
        console.error('Error parsing revised meta content JSON:', jsonError);
        console.log('Raw response text:', metaContentResponse.choices[0].text);
        
        // Fallback to just returning the revised chapters with original meta content
        return {
          title: title,
          introduction: introduction,
          chapters: revisedChapters.length > 0 ? revisedChapters : ebookContent.chapters,
          conclusion: conclusion,
          rawData: ebookContent.rawData,
          tableOfContents: ebookContent.tableOfContents
        };
      }
    } catch (error) {
      console.error('Error in review and revise process:', error);
      throw new Error(`Failed to review and revise the eBook: ${error.message}`);
    }
  }
}