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
    if (parsedUrl.hostname.includes('youtube.com')) {
      return parsedUrl.searchParams.get('v');
    } else if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.slice(1);
    }
  } catch {
    // Invalid URL
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
 * Formats transcript items into a single readable string
 */
export const getFormattedTranscript = (items: TranscriptItem[] | YouTubeApiTranscriptItem[]): string => {
  return items.map(item => item.text.trim()).join(' ');
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
  
  try {
    // Fetch transcript using youtube-transcript package
    const apiTranscriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!apiTranscriptItems || apiTranscriptItems.length === 0) {
      return { 
        transcript: null, 
        error: 'No transcript available for this video' 
      };
    }
    
    // Format transcript items into a readable string
    const formattedTranscript = getFormattedTranscript(apiTranscriptItems);
    
    // Convert API items to our application format
    const transcriptItems = convertToTranscriptItems(apiTranscriptItems);
    
    return {
      transcript: formattedTranscript,
      error: null,
      items: transcriptItems
    };
  } catch (error: any) {
    console.error('Error fetching YouTube transcript:', error);
    return {
      transcript: null,
      error: error.message || 'Failed to fetch transcript'
    };
  }
}; 