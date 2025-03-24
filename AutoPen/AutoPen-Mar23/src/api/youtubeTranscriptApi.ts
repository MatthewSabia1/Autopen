/**
 * YouTube Transcript API Client
 * 
 * This module provides a production-ready client for fetching YouTube video transcripts.
 * It interacts with our backend API service that handles the actual transcript extraction.
 */

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptResponse {
  transcript: TranscriptSegment[];
  error?: string;
}

/**
 * Configuration options for the YouTube Transcript API
 */
interface TranscriptApiConfig {
  baseUrl: string;
  apiKey?: string;
  language?: string;
  timeout?: number;
}

/**
 * Default configuration for the API client
 */
const DEFAULT_CONFIG: TranscriptApiConfig = {
  baseUrl: '/api/transcripts',
  language: 'en',
  timeout: 10000 // 10 seconds timeout
};

/**
 * Creates a YouTube transcript API client with the specified configuration.
 * 
 * @param config - Configuration options for the API client
 * @returns An object with methods for interacting with the transcript API
 */
export const createYoutubeTranscriptApi = (config: Partial<TranscriptApiConfig> = {}) => {
  // Merge provided config with defaults
  const fullConfig: TranscriptApiConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  /**
   * Fetches a transcript for a YouTube video from the server API
   * 
   * @param videoId - The YouTube video ID
   * @returns A promise resolving to the transcript response
   */
  const fetchTranscript = async (videoId: string): Promise<TranscriptResponse> => {
    if (!videoId) {
      throw new Error('Video ID is required');
    }

    try {
      // Build request URL with query parameters
      const url = new URL(`${fullConfig.baseUrl}/youtube/${encodeURIComponent(videoId)}`);
      
      if (fullConfig.language) {
        url.searchParams.append('language', fullConfig.language);
      }
      
      // Set up request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), fullConfig.timeout);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (fullConfig.apiKey) {
        headers['Authorization'] = `Bearer ${fullConfig.apiKey}`;
      }
      
      // Make the request
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      // Validate the response structure
      if (!data || !Array.isArray(data.transcript)) {
        throw new Error('Invalid response format from transcript API');
      }
      
      return {
        transcript: data.transcript,
        error: data.error
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Transcript request timed out after ${fullConfig.timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error occurred while fetching transcript');
    }
  };

  /**
   * Checks if our transcript API is available
   * 
   * @returns A promise resolving to a boolean indicating availability
   */
  const isApiAvailable = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${fullConfig.baseUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  return {
    fetchTranscript,
    isApiAvailable
  };
};

// Create a default instance for easy import
export const youtubeTranscriptApi = createYoutubeTranscriptApi();

/**
 * Utility to extract a YouTube video ID from a URL
 * 
 * @param url - The YouTube video URL
 * @returns The extracted video ID or null if not found
 */
export const extractYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};