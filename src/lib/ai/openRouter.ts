/**
 * OpenRouter integration for text processing
 * Falls back gracefully when API key isn't available
 */

// Type for completion options
interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stop?: string | string[];
  stream?: boolean;
  model?: string;
}

// Type for streaming callback
type StreamCallback = (chunk: string, isLast: boolean) => void;

// Extended client interface with streaming support
interface OpenRouterClient {
  complete: (prompt: string, options?: CompletionOptions) => Promise<string>;
  completeStreaming: (prompt: string, callback: StreamCallback, options?: CompletionOptions) => Promise<void>;
  isAvailable: () => boolean;
}

// Rate limiting tracking
const rateLimits = {
  lastRequestTime: 0,
  requestCount: 0,
  isRateLimited: false,
  rateLimitedUntil: 0,
  consecutiveErrors: 0
};

// Model selection based on complexity
const selectModelForTask = (promptLength: number, maxTokens: number): string => {
  // Calculate approximate complexity
  const totalTokens = promptLength / 4 + maxTokens;
  
  if (totalTokens > 14000) {
    return 'anthropic/claude-3-opus-20240229'; // Most powerful, highest token limit
  } else if (totalTokens > 7000) {
    return 'anthropic/claude-3-sonnet-20240229'; // Good balance
  } else {
    return 'openai/gpt-3.5-turbo'; // Fast and cost-effective
  }
};

// Check if we should retry based on error
const shouldRetry = (error: any): boolean => {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  const retryableErrors = [
    'rate limit',
    'too many requests',
    'timeout',
    'connection',
    'network',
    'socket',
    'econnreset',
    'server error',
    'internal server'
  ];
  
  return retryableErrors.some(errText => errorString.includes(errText));
};

let openRouterInstance: OpenRouterClient | null = null;

// Check if we have OpenRouter API key from env
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

console.log("OpenRouter initialization - API key available:", !!apiKey);

if (apiKey) {
  // Create OpenRouter client
  openRouterInstance = {
    /**
     * Complete a prompt with standard request/response
     * @param prompt The prompt to complete
     * @param options Completion options
     * @returns Generated completion text
     */
    complete: async (prompt: string, options?: CompletionOptions): Promise<string> => {
      try {
        // Basic rate limiting protection
        const now = Date.now();
        
        // Check if we're in a rate limited state
        if (rateLimits.isRateLimited && now < rateLimits.rateLimitedUntil) {
          console.warn(`OpenRouter rate limited until ${new Date(rateLimits.rateLimitedUntil)}`);
          throw new Error("API rate limited. Please try again later.");
        }
        
        // Basic self-imposed rate limiting - no more than 5 requests per 5 seconds
        if (now - rateLimits.lastRequestTime < 5000) {
          rateLimits.requestCount++;
          if (rateLimits.requestCount > 5) {
            // Self-imposed rate limiting for 10 seconds
            rateLimits.isRateLimited = true;
            rateLimits.rateLimitedUntil = now + 10000;
            rateLimits.requestCount = 0;
            console.warn("Self-imposed rate limiting activated");
            throw new Error("Too many requests. Pausing briefly to avoid rate limits.");
          }
        } else {
          // Reset counter if more than 5 seconds since last request
          rateLimits.lastRequestTime = now;
          rateLimits.requestCount = 1;
        }
        
        console.log("OpenRouter.complete called with prompt length:", prompt?.length || 0);
        
        // Default options
        const defaultOptions = {
          maxTokens: 500,
          temperature: 0.7
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Dynamically select model based on content size
        const model = finalOptions.model || selectModelForTask(prompt.length, finalOptions.maxTokens);
        console.log(`Using model: ${model} for prompt length: ${prompt.length}`);
        
        // OpenRouter endpoint
        const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        
        console.log("Making OpenRouter API request...");
        
        // Call the API with retries
        let retries = 0;
        const maxRetries = 2;
        
        while (true) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Autopen Brain Dump'
              },
              body: JSON.stringify({
                model,
                messages: [
                  { 
                    role: 'system', 
                    content: 'You are a helpful assistant specializing in summarizing and extracting information from text.' 
                  },
                  { role: 'user', content: prompt }
                ],
                max_tokens: finalOptions.maxTokens,
                temperature: finalOptions.temperature,
                top_p: finalOptions.topP || 1,
                presence_penalty: finalOptions.presencePenalty || 0,
                frequency_penalty: finalOptions.frequencyPenalty || 0,
                stop: finalOptions.stop
              })
            });
            
            // Handle various response statuses
            if (response.status === 429) {
              // Rate limit reached
              const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
              rateLimits.isRateLimited = true;
              rateLimits.rateLimitedUntil = Date.now() + (retryAfter * 1000);
              
              console.warn(`Rate limit reached. Retry after ${retryAfter} seconds.`);
              
              if (retries < maxRetries) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait briefly
                continue; // Retry
              }
              
              throw new Error(`API rate limited. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`);
            } else if (response.status >= 500) {
              // Server error
              console.error("OpenRouter server error:", response.status);
              
              if (retries < maxRetries) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue; // Retry
              }
              
              throw new Error("Server error. Please try again later.");
            } else if (!response.ok) {
              const errorText = await response.text();
              console.error("OpenRouter API error:", response.status, errorText);
              throw new Error(`API error (${response.status}): ${errorText}`);
            }
            
            // Success - Process response
            const data = await response.json();
            console.log("OpenRouter API response received:", {
              status: response.status,
              hasChoices: !!data.choices,
              choicesLength: data.choices?.length
            });
            
            if (!data.choices || data.choices.length === 0) {
              console.error("No choices in OpenRouter response:", data);
              throw new Error("No content returned from OpenRouter API");
            }
            
            // Reset error counter on success
            rateLimits.consecutiveErrors = 0;
            
            return data.choices[0].message.content;
          } catch (err) {
            if (retries < maxRetries && shouldRetry(err)) {
              console.warn(`Retrying after error (${retries + 1}/${maxRetries}):`, err);
              retries++;
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            throw err;
          }
        }
      } catch (err) {
        console.error('Error calling OpenRouter API:', err);
        
        // Increment consecutive error counter
        rateLimits.consecutiveErrors++;
        
        // If we keep getting errors, implement a cool-down
        if (rateLimits.consecutiveErrors > 3) {
          rateLimits.isRateLimited = true;
          rateLimits.rateLimitedUntil = Date.now() + 60000; // 1 minute cooldown
          console.warn("Multiple consecutive errors, cooling down for 1 minute");
        }
        
        // Return a fallback message instead of throwing to avoid breaking UI
        return "Unable to process with AI at this time. Please try again later.";
      }
    },
    
    /**
     * Complete a prompt with streaming response
     * @param prompt The prompt to complete
     * @param callback Callback function to receive chunks
     * @param options Completion options
     */
    completeStreaming: async (prompt: string, callback: StreamCallback, options?: CompletionOptions): Promise<void> => {
      try {
        // Check rate limits
        const now = Date.now();
        if (rateLimits.isRateLimited && now < rateLimits.rateLimitedUntil) {
          callback("API rate limited. Please try again later.", true);
          return;
        }
        
        // Default options with streaming enabled
        const defaultOptions = {
          maxTokens: 500,
          temperature: 0.7,
          stream: true
        };
        
        const finalOptions = { ...defaultOptions, ...options, stream: true };
        
        // Dynamically select model
        const model = finalOptions.model || selectModelForTask(prompt.length, finalOptions.maxTokens);
        
        // OpenRouter endpoint
        const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Autopen Brain Dump'
          },
          body: JSON.stringify({
            model,
            messages: [
              { 
                role: 'system', 
                content: 'You are a helpful assistant specializing in summarizing and extracting information from text.' 
              },
              { role: 'user', content: prompt }
            ],
            max_tokens: finalOptions.maxTokens,
            temperature: finalOptions.temperature,
            top_p: finalOptions.topP || 1,
            presence_penalty: finalOptions.presencePenalty || 0,
            frequency_penalty: finalOptions.frequencyPenalty || 0,
            stop: finalOptions.stop,
            stream: true
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenRouter API streaming error:", response.status, errorText);
          callback(`API error (${response.status}): ${errorText}`, true);
          return;
        }
        
        if (!response.body) {
          callback("No streaming response body available", true);
          return;
        }
        
        // Process the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        
        try {
          while (true) {
            const { value, done } = await reader.read();
            
            if (done) {
              // Final chunk
              callback(fullText, true);
              break;
            }
            
            // Decode and process this chunk
            const chunk = decoder.decode(value, { stream: true });
            
            // Handle the SSE format
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                
                if (data === '[DONE]') {
                  // End of stream
                  continue;
                }
                
                try {
                  const jsonData = JSON.parse(data);
                  if (jsonData.choices && jsonData.choices[0].delta?.content) {
                    const contentChunk = jsonData.choices[0].delta.content;
                    fullText += contentChunk;
                    callback(contentChunk, false);
                  }
                } catch (e) {
                  console.warn('Error parsing streaming JSON:', e);
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Error processing stream:', streamError);
          callback(`Error during streaming: ${streamError.message}`, true);
        } finally {
          reader.releaseLock();
        }
      } catch (err) {
        console.error('Error in completeStreaming:', err);
        callback(`Unable to stream completion: ${err.message}`, true);
      }
    },
    
    /**
     * Check if OpenRouter is available
     * @returns True if the client is available and not rate limited
     */
    isAvailable: (): boolean => {
      const now = Date.now();
      if (rateLimits.isRateLimited && now < rateLimits.rateLimitedUntil) {
        return false;
      }
      return true;
    }
  };
  
  console.log('OpenRouter integration initialized');
} else {
  console.log('OpenRouter API key not found, falling back to local processing');
  openRouterInstance = null;
}

export const openRouter = openRouterInstance; 