/**
 * YouTube Transcript Utility
 * 
 * This module provides functions to work with YouTube video transcripts.
 * It uses multiple reliable methods with fallbacks to fetch transcripts.
 */

// Function to extract a YouTube video ID from a URL
export const extractYoutubeVideoId = (url: string): string | null => {
  // Handle various YouTube URL formats
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

// Interface for transcript response
export interface TranscriptResponse {
  transcript: TranscriptSegment[];
  error?: string;
}

// Interface for a transcript segment
export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

/**
 * Creates a mock transcript for when all fetching methods fail
 * This provides a fallback so the app can continue functioning
 */
const createMockTranscript = (videoId: string): TranscriptResponse => {
  console.log(`Creating mock transcript for video ${videoId}`);
  
  // Create a simple mock transcript
  return {
    transcript: [
      {
        text: "This is a placeholder transcript because the actual transcript could not be retrieved.",
        start: 0,
        duration: 5
      },
      {
        text: "You can still analyze this video, but without the actual transcript content.",
        start: 5,
        duration: 5
      },
      {
        text: "Consider adding your own notes about this video's content in the text area.",
        start: 10,
        duration: 5
      }
    ],
    error: "Note: This is a mock transcript because external transcript services are currently unavailable."
  };
};

/**
 * Try to fetch transcript from YouTube directly
 * This approach may fail due to CORS issues, but we'll try it as a first option
 */
const fetchTranscriptDirect = async (videoId: string): Promise<TranscriptResponse> => {
  try {
    console.log(`Attempting direct transcript fetch for video ${videoId}`);
    
    // Check for valid video ID to prevent URL construction errors
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
      throw new Error('Invalid YouTube video ID');
    }
    
    // Using the YouTube API directly with proper URL construction
    const apiUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${encodeURIComponent(videoId)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from YouTube directly: ${response.status} ${response.statusText}`);
    }
    
    try {
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from YouTube');
      }
      
      return {
        transcript: [{ text, start: 0, duration: 10 }]
      };
    } catch (error) {
      throw new Error('Failed to process YouTube response');
    }
  } catch (error) {
    console.error('Error in direct transcript method:', error);
    throw error;
  }
};

/**
 * Fetch transcript using a server-side proxy to avoid CORS issues
 * This is more reliable than direct fetching, but requires proper server setup
 */
const fetchTranscriptServerProxy = async (videoId: string): Promise<TranscriptResponse> => {
  try {
    console.log(`Attempting proxy transcript fetch for video ${videoId}`);
    
    // Check for valid video ID to prevent URL construction errors
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
      throw new Error('Invalid YouTube video ID');
    }
    
    // This would typically call a backend endpoint that proxies the request to YouTube
    // Since we're mocking this for now, we'll simulate a successful response
    
    // For development environments or if no proxy is available, generate realistic mock data
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log('Development environment detected, using enhanced mock transcript');
      
      // Create a more realistic mock transcript based on video ID
      // This makes the transcript deterministic for the same video
      const wordBanks = [
        ['Hello', 'Welcome', 'Today', 'In this video', 'Let me show', 'I will explain'],
        ['we will discuss', 'I want to talk about', 'lets explore', 'we are going to learn', 'I will demonstrate'],
        ['this concept', 'these techniques', 'this important topic', 'these fascinating ideas', 'this tutorial'],
        ['in detail', 'step by step', 'thoroughly', 'with examples', 'from beginning to end']
      ];
      
      // Use video ID to seed the "random" selection for deterministic results
      const hash = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const segments = [];
      
      // Generate 10-20 segments of transcript
      const numSegments = 10 + (hash % 10);
      
      for (let i = 0; i < numSegments; i++) {
        // Create sentences from word banks using hash + index to select words
        const sentenceWords = wordBanks.map((bank, bankIndex) => {
          const selection = (hash + i + bankIndex) % bank.length;
          return bank[selection];
        });
        
        // Join the words to form a sentence
        let text = sentenceWords.join(' ') + '.';
        
        // Add some variation for longer segments
        if (i % 3 === 0) {
          text += ' ' + sentenceWords[1] + ' ' + sentenceWords[2] + ' more ' + sentenceWords[3] + '.';
        }
        
        segments.push({
          text,
          start: i * 30,
          duration: 30
        });
      }
      
      return {
        transcript: segments,
        error: "Note: Using enhanced mock transcript data in development environment."
      };
    }
    
    // Simulate server error in non-development environments if no real proxy is available
    throw new Error('Transcript proxy server not configured');
    
  } catch (error) {
    console.error('Error in proxy transcript method:', error);
    throw error;
  }
};

/**
 * Fetch transcript using a client-side method
 * This is a production-ready approach that extracts captions from YouTube pages
 */
const fetchTranscriptClientSide = async (videoId: string): Promise<TranscriptResponse> => {
  try {
    console.log(`Fetching transcript client-side for video ${videoId}`);
    
    // Ensure valid video ID
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
      throw new Error('Invalid YouTube video ID for client-side fetch');
    }
    
    // Try to extract transcript from YouTube's internal API
    const videoInfoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
      // Set up headers to appear as a normal browser
      const headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      };
      
      // Get the HTML of the video page
      const response = await fetch(videoInfoUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video page: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Look for the captionTracks section in the response
      const captionTracksMatch = html.match(/"captionTracks":\[(.*?)\]/);
      
      if (!captionTracksMatch) {
        throw new Error('No caption tracks found in the video page');
      }
      
      // Parse the caption tracks to find available languages
      const captionTracks = captionTracksMatch[1];
      
      // Look for English tracks first, but accept any if no English is available
      let baseUrlMatch = captionTracks.match(/"baseUrl":"(.*?)","name":{"simpleText":"English"/);
      
      // If no English track, look for auto-generated English
      if (!baseUrlMatch) {
        baseUrlMatch = captionTracks.match(/"baseUrl":"(.*?)","name":{"simpleText":"English \(auto-generated\)"/);
      }
      
      // If still no match, just take the first caption track
      if (!baseUrlMatch) {
        baseUrlMatch = captionTracks.match(/"baseUrl":"(.*?)"/);
      }
      
      if (!baseUrlMatch) {
        throw new Error('No caption URL found in the video page');
      }
      
      // Clean the URL (remove escape characters)
      const captionUrl = baseUrlMatch[1]
        .replace(/\\u0026/g, '&')
        .replace(/\\"/g, '"');
      
      // Now fetch the actual captions
      const captionsResponse = await fetch(captionUrl);
      
      if (!captionsResponse.ok) {
        throw new Error(`Failed to fetch captions: ${captionsResponse.status} ${captionsResponse.statusText}`);
      }
      
      const captionsText = await captionsResponse.text();
      
      // If it's XML, parse it to extract just the text and timestamps
      if (captionsText.includes('<?xml')) {
        const transcript: TranscriptSegment[] = [];
        
        // Basic XML parsing
        const textMatches = captionsText.match(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g);
        
        if (textMatches && textMatches.length > 0) {
          for (const match of textMatches) {
            const startMatch = match.match(/start="([\d.]+)"/);
            const durMatch = match.match(/dur="([\d.]+)"/);
            const textMatch = match.match(/<text[^>]*>(.*?)<\/text>/);
            
            if (startMatch && durMatch && textMatch) {
              const start = parseFloat(startMatch[1]);
              const duration = parseFloat(durMatch[1]);
              const text = textMatch[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
              
              transcript.push({ text, start, duration });
            }
          }
        }
        
        if (transcript.length > 0) {
          return { transcript };
        }
      }
      
      // If XML parsing failed or it's not XML, just use the whole text
      return {
        transcript: [{ 
          text: captionsText
            .replace(/<[^>]*>/g, '') // Remove XML/HTML tags
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'"),
          start: 0, 
          duration: 0 
        }]
      };
      
    } catch (fetchError) {
      console.error('Error fetching caption data:', fetchError);
      throw new Error(`Failed to extract captions: ${fetchError.message}`);
    }
  } catch (error) {
    console.error('Error in client-side transcript method:', error);
    throw error;
  }
};

/**
 * Create a more realistic mock transcript with topic-specific content
 */
const fetchEnhancedMockTranscript = async (videoId: string): Promise<TranscriptResponse> => {
  try {
    console.log(`Using enhanced mock transcript for video ${videoId}`);
    
    // Handle invalid video ID
    if (!videoId || typeof videoId !== 'string') {
      return createMockTranscript('unknown');
    }
    
    // Use last 3 characters of video ID to determine a "topic" for the transcript
    const topicSeed = videoId.slice(-3);
    const topicNum = topicSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
    
    // Define different transcript templates based on topics
    const topics = [
      {
        // Technology topic
        intro: "Today we are going to talk about the latest developments in technology and how they are changing our world.",
        points: [
          "First, lets discuss artificial intelligence and machine learning applications.",
          "Next, we will explore cloud computing and its impact on business operations.",
          "Then, we will look at mobile technology trends for the coming year.",
          "Finally, I will share some thoughts on digital privacy and security concerns."
        ],
        conclusion: "Thanks for watching this video. If you found it helpful, please like and subscribe for more tech content."
      },
      {
        // Business topic
        intro: "In this business strategy video, I will be sharing some key insights on growing your company in todays market.",
        points: [
          "The first principle we will cover is customer-centric business models.",
          "Second, we will analyze effective digital marketing strategies that deliver results.",
          "Third, lets talk about building sustainable competitive advantages.",
          "Fourth, I will explain how to develop strong team leadership within your organization."
        ],
        conclusion: "I hope these business strategies help you achieve your goals. Do not forget to check out my other business videos."
      },
      {
        // Education topic
        intro: "Welcome to this educational video on effective learning techniques and study methods.",
        points: [
          "We will start by examining the science behind spaced repetition and memory formation.",
          "Next, I will demonstrate practical note-taking systems that improve retention.",
          "Then, we will explore how to create optimal study environments for different learning styles.",
          "Finally, I will show you techniques for managing test anxiety and improving performance."
        ],
        conclusion: "Thank you for watching this educational content. Remember to implement these techniques gradually for best results."
      },
      {
        // Health topic
        intro: "Hello and welcome to this health and wellness video where we will explore evidence-based approaches to better health.",
        points: [
          "First, we will discuss nutrition fundamentals and common misconceptions about healthy eating.",
          "Next, I will explain effective exercise routines that work for busy schedules.",
          "Third, lets talk about sleep science and how to improve your rest quality.",
          "Finally, I will share stress management techniques that can improve overall wellbeing."
        ],
        conclusion: "I hope you found this health information valuable. Remember to consult healthcare professionals before making significant changes."
      },
      {
        // Arts topic
        intro: "Welcome to this creative arts video where I will be sharing techniques and inspiration for your artistic journey.",
        points: [
          "Lets begin with foundational principles of composition and design that apply across mediums.",
          "Next, I will demonstrate color theory applications that will enhance your visual work.",
          "Then, we will explore creative processes used by professional artists to overcome blocks.",
          "Finally, I will share resources and communities that can help you develop your skills further."
        ],
        conclusion: "Thank you for joining me in this creative exploration. I would love to see what you create using these techniques."
      }
    ];
    
    const selectedTopic = topics[topicNum];
    
    // Build transcript segments from the selected topic
    const transcript = [
      { text: selectedTopic.intro, start: 0, duration: 15 }
    ];
    
    // Add the main points with timestamps
    let currentTime = 15;
    selectedTopic.points.forEach((point, index) => {
      transcript.push({
        text: point,
        start: currentTime,
        duration: 20
      });
      currentTime += 20;
      
      // Add some detail points for each main point
      transcript.push({
        text: `Let me elaborate more on this point. ${point.replace("we will", "I will").replace("First,", "").replace("Next,", "").replace("Then,", "").replace("Finally,", "")}`,
        start: currentTime,
        duration: 25
      });
      currentTime += 25;
    });
    
    // Add conclusion
    transcript.push({
      text: selectedTopic.conclusion,
      start: currentTime,
      duration: 10
    });
    
    return {
      transcript,
      error: "Note: Using enhanced mock transcript based on video ID patterns."
    };
  } catch (error) {
    console.error('Error generating enhanced mock transcript:', error);
    return createMockTranscript('fallback');
  }
};

/**
 * Basic mock transcript with random segments
 */
const fetchBasicMockTranscript = async (videoId: string): Promise<TranscriptResponse> => {
  try {
    console.log(`Using basic mock transcript data for video ${videoId}`);
    
    // Handle invalid video ID
    if (!videoId || typeof videoId !== 'string') {
      return createMockTranscript('unknown');
    }
    
    // Generate random number of segments based on video ID to make it somewhat deterministic
    const hash = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const numSegments = (hash % 20) + 5; // Between 5 and 25 segments
    
    const transcript = [];
    for (let i = 0; i < numSegments; i++) {
      transcript.push({
        text: `This is segment ${i+1} of the mock transcript for video ${videoId.substring(0, 5)}...`,
        start: i * 5,
        duration: 5
      });
    }
    
    return {
      transcript,
      error: "Note: This is a mock transcript as external transcript services are unavailable."
    };
  } catch (error) {
    console.error('Error generating basic mock transcript:', error);
    return createMockTranscript('fallback');
  }
};

/**
 * Fetch transcript using the Transcript API service (production method)
 * This is the preferred production method that calls our backend service
 */
import { youtubeTranscriptApi } from '../api/youtubeTranscriptApi';

const fetchTranscriptAPI = async (videoId: string): Promise<TranscriptResponse> => {
  try {
    console.log(`Attempting to fetch transcript via API service for ${videoId}`);
    
    // Check for valid video ID 
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
      throw new Error('Invalid YouTube video ID');
    }
    
    // First check if our API is available
    const isApiAvailable = await youtubeTranscriptApi.isApiAvailable().catch(() => false);
    
    if (!isApiAvailable) {
      console.warn('YouTube transcript API is not available, trying fallback methods');
      throw new Error('YouTube transcript API is not available');
    }
    
    // Call our production API client
    try {
      const result = await youtubeTranscriptApi.fetchTranscript(videoId);
      
      // Even if we get a result, check if it has actual content
      if (!result.transcript || result.transcript.length === 0) {
        throw new Error('Empty transcript received from API');
      }
      
      return result;
    } catch (apiError) {
      console.error('Transcript API error:', apiError);
      
      // Try a fallback method
      try {
        console.log('Attempting fallback method to retrieve transcript');
        return await fetchTranscriptDirect(videoId);
      } catch (fallbackError) {
        console.error('Fallback transcript method failed:', fallbackError);
        throw new Error('All API transcript fetching methods failed');
      }
    }
  } catch (error) {
    console.error('Error in API transcript method:', error);
    throw error;
  }
};

/**
 * Fetches the transcript for a YouTube video, trying multiple methods
 */
export const fetchYoutubeTranscript = async (videoId: string): Promise<TranscriptResponse> => {
  console.log(`Attempting to fetch transcript for YouTube video: ${videoId}`);
  
  // Validate videoId first to prevent downstream errors
  if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
    console.warn('Invalid YouTube video ID provided to fetchYoutubeTranscript');
    throw new Error('Invalid YouTube video ID');
  }
  
  // Check if we're in a development environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
  
  // Try multiple methods in sequence with appropriate error handling
  let methods = [
    { name: 'api-service', fn: fetchTranscriptAPI },      // Production-ready API method
    { name: 'direct', fn: fetchTranscriptDirect },        // Direct browser fetch
    { name: 'server-proxy', fn: fetchTranscriptServerProxy }, // Server proxy method
    { name: 'client-side', fn: fetchTranscriptClientSide },  // Client-side extraction
    { name: 'enhanced-mock', fn: fetchEnhancedMockTranscript }, // Dev-only mock data
    { name: 'basic-mock', fn: fetchBasicMockTranscript }     // Dev-only basic mock
  ];
  
  let lastError = null;
  
  // Only use mock data in development mode, never in production
  if (isDevelopment) {
    console.log('Development environment: will try real transcripts first, then fall back to mock data if needed');
    // We'll still try real methods first, then fall back to mocks in development
  } else {
    // In production, we ONLY want to use real transcript methods
    console.log('Production environment: using only real transcript methods, no mock data');
    // Filter out any mock methods for production use
    const realMethods = methods.filter(method => !method.name.includes('mock'));
    methods = realMethods;
  }
  
  for (const method of methods) {
    try {
      console.log(`Trying ${method.name} method for transcript...`);
      const result = await method.fn(videoId);
      
      // Verify that we have actual transcript content
      if (result.transcript && result.transcript.length > 0) {
        console.log(`Success using ${method.name} method! Found ${result.transcript.length} segments.`);
        
        // Add a note for mock data so users are aware
        if (method.name.includes('mock')) {
          result.error = result.error || "Note: Using simulated transcript data.";
        }
        
        return result;
      } else {
        console.log(`${method.name} method returned empty transcript, trying next method...`);
        lastError = new Error('No transcript segments found');
        continue;
      }
    } catch (error) {
      console.log(`${method.name} method failed:`, error);
      lastError = error;
      // Continue to the next method
    }
  }
  
  // If all methods fail:
  if (isDevelopment) {
    // In development, fall back to a mock transcript
    console.warn('All transcript methods failed, returning mock transcript for development use only');
    return createMockTranscript(videoId);
  } else {
    // In production, we return an empty transcript with a clear error message
    console.error('All transcript methods failed in production environment');
    return {
      transcript: [{
        text: "No transcript available for this video. Please try another video or add your own notes.",
        start: 0,
        duration: 0
      }],
      error: "Unable to retrieve transcript from YouTube. The video may not have captions available."
    };
  }
};

/**
 * Processes transcript segments into a readable text format
 */
export const formatTranscriptText = (segments: TranscriptSegment[]): string => {
  if (!segments || segments.length === 0) {
    return '';
  }
  
  // Join all text segments with spaces, trim each segment to avoid double spaces
  const rawText = segments.map(segment => segment.text.trim()).join(' ');
  
  // Clean up the text - remove any XML/HTML tags that might be present in some transcripts
  const cleanedText = rawText
    .replace(/<[^>]*>/g, '') // Remove HTML/XML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();                 // Trim start/end
  
  return cleanedText;
};

/**
 * Fetches and formats a transcript for a YouTube video URL
 */
export const getFormattedTranscript = async (url: string): Promise<{ text: string; error?: string }> => {
  try {
    // Validate URL first
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return { 
        text: '', 
        error: 'Invalid YouTube URL provided' 
      };
    }
    
    const videoId = extractYoutubeVideoId(url);
    
    if (!videoId) {
      return { 
        text: '', 
        error: 'Could not extract a valid YouTube video ID from the URL' 
      };
    }
    
    const { transcript, error } = await fetchYoutubeTranscript(videoId);
    
    // Format the transcript text (even if it's a mock transcript)
    const formattedText = formatTranscriptText(transcript);
    
    // Include any error from the transcript fetching process
    if (error) {
      console.log(`Transcript note for video ${videoId}: ${error}`);
      return { 
        text: formattedText, 
        error 
      };
    }
    
    console.log(`Successfully formatted transcript for video ${videoId}: ${formattedText.length} characters`);
    
    return { 
      text: formattedText 
    };
  } catch (error) {
    console.error(`Unexpected error getting transcript:`, error);
    
    // Even in case of error, return a usable result
    return {
      text: `[Transcript unavailable]`,
      error: error instanceof Error ? error.message : 'Failed to process transcript'
    };
  }
};

/**
 * Simple check if a URL is likely a YouTube video
 */
export const isYoutubeUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  return !!extractYoutubeVideoId(url);
};