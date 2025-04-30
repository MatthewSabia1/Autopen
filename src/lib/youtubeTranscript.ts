import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Interface for YouTube API transcript items from the library
 */
export interface YouTubeApiTranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

/**
 * Interface for our application's transcript items
 */
export interface TranscriptItem {
  text: string;
  start: string;
  duration: string;
}

/**
 * Interface for transcript response
 */
export interface TranscriptResponse {
  transcript: string | null;
  error: string | null;
  items?: TranscriptItem[];
}

// Simple in-memory cache for transcripts
// Key: videoId, Value: TranscriptResponse
const transcriptCache: Map<string, TranscriptResponse> = new Map();
// Cache expiration time in milliseconds (1 hour)
const CACHE_EXPIRATION = 60 * 60 * 1000;
// Store cache timestamps
const cacheTimestamps: Map<string, number> = new Map();

/**
 * Helper function to check if URL is a YouTube URL
 */
export const isYoutubeUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    return hostname.includes('youtube.com') || hostname.includes('youtu.be');
  } catch {
    return false;
  }
};

/**
 * Helper function to extract YouTube video ID
 */
export const extractYoutubeVideoId = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    
    // Handle youtube.com domains
    if (parsedUrl.hostname.includes('youtube.com')) {
      // First check standard ?v= parameter
      const vParam = parsedUrl.searchParams.get('v');
      if (vParam) return vParam;
      
      // Check for /embed/ URLs
      if (parsedUrl.pathname.startsWith('/embed/')) {
        return parsedUrl.pathname.split('/')[2];
      }
      
      // Check for /v/ URLs
      if (parsedUrl.pathname.startsWith('/v/')) {
        return parsedUrl.pathname.split('/')[2];
      }
    } 
    // Handle youtu.be short URLs
    else if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.slice(1);
    }
  } catch {
    // If URL parsing fails, try regex approach as fallback
    const standardRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(standardRegex);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

/**
 * Convert API transcript items to our application format
 */
export const convertToTranscriptItems = (apiItems: YouTubeApiTranscriptItem[]): TranscriptItem[] => {
  return apiItems.map(item => ({
    text: item.text,
    start: item.offset.toString(),
    duration: item.duration.toString()
  }));
};

/**
 * Enhanced formatter for transcript text to improve readability
 * Adds proper punctuation, capitalizes first letters of sentences, and adds paragraph breaks
 */
export const formatTranscriptText = (rawText: string): string => {
  if (!rawText) return '';
  
  try {
    // Split into sentences (looking for end punctuation followed by a space)
    let text = rawText.trim();
    
    // Add periods to apparent sentence fragments without ending punctuation
    text = text.replace(/([a-zA-Z0-9])\s+([A-Z])/g, '$1. $2');
    
    // Ensure spacing after punctuation
    text = text.replace(/([.!?])([A-Za-z])/g, '$1 $2');
    
    // Capitalize the first letter of sentences
    text = text.replace(/(^|[.!?]\s+)([a-z])/g, function(match, p1, p2) {
      return p1 + p2.toUpperCase();
    });
    
    // Capitalize the first letter of the text if it starts with a lowercase
    if (/^[a-z]/.test(text)) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    // Add periods at the end of sentences if missing
    if (!text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
      text += '.';
    }
    
    // Add paragraph breaks for better readability (roughly every 5 sentences)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length > 10) {
      const paragraphs: string[] = [];
      for (let i = 0; i < sentences.length; i += 5) {
        paragraphs.push(sentences.slice(i, i + 5).join(' '));
      }
      text = paragraphs.join('\n\n');
    }
    
    return text;
  } catch (e) {
    console.warn("Error formatting transcript text:", e);
    return rawText; // Fall back to original text if any error occurs
  }
};

/**
 * Formats transcript items into a single readable string
 */
export const getFormattedTranscript = (items: TranscriptItem[] | YouTubeApiTranscriptItem[]): string => {
  const rawText = items.map(item => item.text.trim()).join(' ');
  return formatTranscriptText(rawText);
};

/**
 * Error types for better error handling
 */
export enum TranscriptErrorType {
  NOT_FOUND = 'NOT_FOUND',
  DISABLED = 'DISABLED',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Classifies error based on error message
 */
const classifyError = (error: any): { type: TranscriptErrorType, message: string } => {
  const message = error?.message || 'Unknown error';
  
  if (message.includes('Could not find any transcripts')) {
    return { 
      type: TranscriptErrorType.NOT_FOUND,
      message: 'No transcript available for this video'
    };
  }
  
  if (message.includes('Subtitles are disabled for this video')) {
    return {
      type: TranscriptErrorType.DISABLED,
      message: 'Transcripts are disabled for this video'
    };
  }
  
  if (message.includes('429') || message.includes('Too many requests')) {
    return {
      type: TranscriptErrorType.RATE_LIMITED,
      message: 'Rate limited by YouTube. Please try again later.'
    };
  }
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      type: TranscriptErrorType.NETWORK_ERROR,
      message: 'Network error while fetching transcript. Please check your internet connection.'
    };
  }
  
  if (message.includes('API') || message.includes('auth')) {
    return {
      type: TranscriptErrorType.API_ERROR,
      message: 'YouTube API error. Please try again later.'
    };
  }
  
  return {
    type: TranscriptErrorType.UNKNOWN,
    message: `Failed to fetch transcript: ${message}`
  };
};

/**
 * Clean up old cache entries
 */
const cleanupCache = (): void => {
  const now = Date.now();
  
  // Remove expired cache entries
  for (const [videoId, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_EXPIRATION) {
      transcriptCache.delete(videoId);
      cacheTimestamps.delete(videoId);
    }
  }
  
  // If cache gets too large, remove oldest entries
  if (transcriptCache.size > 100) {
    const oldestEntries = Array.from(cacheTimestamps.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 50)
      .map(entry => entry[0]);
      
    oldestEntries.forEach(videoId => {
      transcriptCache.delete(videoId);
      cacheTimestamps.delete(videoId);
    });
  }
};

/**
 * Fetches transcript for a YouTube video
 * @param videoId YouTube video ID
 * @returns Transcript response with transcript text or error
 */
export const fetchYoutubeTranscript = async (videoId: string): Promise<TranscriptResponse> => {
  if (!videoId) {
    return { 
      transcript: null, 
      error: 'Invalid YouTube video ID provided' 
    };
  }
  
  // Check cache first
  if (transcriptCache.has(videoId)) {
    // Update timestamp to show it was recently used
    cacheTimestamps.set(videoId, Date.now());
    console.log(`Using cached transcript for video ${videoId}`);
    return transcriptCache.get(videoId)!;
  }
  
  try {
    // Run cache cleanup occasionally
    if (Math.random() < 0.1) { // 10% chance
      cleanupCache();
    }
    
    // Fetch transcript using youtube-transcript package
    const apiTranscriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!apiTranscriptItems || apiTranscriptItems.length === 0) {
      const response = { 
        transcript: null, 
        error: 'No transcript available for this video' 
      };
      
      // Cache negative results too
      transcriptCache.set(videoId, response);
      cacheTimestamps.set(videoId, Date.now());
      
      return response;
    }
    
    // Format transcript items into a readable string
    const formattedTranscript = getFormattedTranscript(apiTranscriptItems);
    
    // Convert API items to our application format
    const transcriptItems = convertToTranscriptItems(apiTranscriptItems);
    
    const response = {
      transcript: formattedTranscript,
      error: null,
      items: transcriptItems
    };
    
    // Cache successful results
    transcriptCache.set(videoId, response);
    cacheTimestamps.set(videoId, Date.now());
    
    return response;
  } catch (error: any) {
    console.error('Error fetching YouTube transcript:', error);
    
    // Classify error for better error handling
    const classifiedError = classifyError(error);
    
    const response = {
      transcript: null,
      error: classifiedError.message
    };
    
    // Cache errors briefly (5 minutes) to prevent hammering the API
    // Except for network errors which might be temporary
    if (classifiedError.type !== TranscriptErrorType.NETWORK_ERROR) {
      transcriptCache.set(videoId, response);
      cacheTimestamps.set(videoId, Date.now() - CACHE_EXPIRATION + 300000);
    }
    
    return response;
  }
};

/**
 * Enhanced regex for finding YouTube URLs in text content
 * More comprehensive than the URL checker to ensure we don't miss any format
 */
export const youtubeUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s"]*)/g; 