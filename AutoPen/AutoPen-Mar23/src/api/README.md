# YouTube Transcript API Integration

This document outlines how to implement the backend API service for YouTube transcript extraction.

## API Endpoint Structure

The frontend expects a transcript endpoint at:
```
/api/transcripts/youtube/{videoId}
```

This would typically be implemented as a serverless function (AWS Lambda, Vercel Edge Functions, etc.) or as an endpoint in your Node.js/Express backend.

## Implementation Example

Here's a sample implementation using Node.js with Express:

```javascript
const express = require('express');
const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');
const router = express.Router();

// Status endpoint for availability checking
router.get('/status', (req, res) => {
  res.status(200).json({ status: 'available' });
});

// YouTube transcript endpoint
router.get('/youtube/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { language = 'en' } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ 
        error: 'Video ID is required' 
      });
    }
    
    // Use youtube-transcript library to fetch the transcript
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId, { lang: language });
    
    if (!transcriptData || transcriptData.length === 0) {
      return res.status(404).json({ 
        error: 'No transcript available for this video',
        transcript: []
      });
    }
    
    // Format the transcript to match the expected interface
    const formattedTranscript = transcriptData.map(item => ({
      text: item.text,
      start: item.offset / 1000, // Convert ms to seconds
      duration: item.duration / 1000
    }));
    
    return res.status(200).json({
      transcript: formattedTranscript
    });
    
  } catch (error) {
    console.error('YouTube transcript fetch error:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch transcript',
      transcript: []
    });
  }
});

module.exports = router;
```

## Installation Requirements

Install these packages for the implementation:
```
npm install axios youtube-transcript
```

## Security Considerations

1. Consider implementing rate limiting to prevent abuse
2. Add API key validation for authenticated requests
3. Set up CORS headers to restrict access to your frontend domains
4. Consider caching to improve performance and reduce API calls

## In Production

For production, you should:

1. Implement proper error handling with detailed logging
2. Add metrics to track API usage and errors
3. Consider implementing a cache layer (Redis, Memcached, etc.) to store previously fetched transcripts
4. Handle different language selections properly

## Testing

You can test this API using a tool like Postman or curl:

```bash
curl -X GET "http://your-api.com/api/transcripts/youtube/VIDEO_ID_HERE"
```