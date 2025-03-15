import { Buffer } from 'buffer';
import { LinkItem } from '../types/BrainDumpTypes';

// Constants for OpenRouter API
const OPENROUTER_API_KEY = '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';
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
        'X-Title': 'Textera AI E-book Creation Assistant'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error calling OpenRouter API');
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
    return {
      summary: "An error occurred during analysis.",
      ebookIdeas: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};