import { openRouter } from './openRouter';

/**
 * Splits text into optimal chunks for processing
 * 
 * @param text The full text to split
 * @param maxChunkSize Maximum size of each chunk in characters
 * @param overlap Number of characters to overlap between chunks
 * @returns Array of text chunks
 */
export function chunkText(text: string, maxChunkSize: number = 8000, overlap: number = 500): string[] {
  if (!text || text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let startPos = 0;

  while (startPos < text.length) {
    // Get a chunk of maxChunkSize or the remaining text
    let endPos = Math.min(startPos + maxChunkSize, text.length);
    
    // Try to end at a natural breakpoint (paragraph or sentence)
    if (endPos < text.length) {
      // Look for paragraph break
      const paragraphBreak = text.lastIndexOf('\n\n', endPos);
      if (paragraphBreak > startPos && paragraphBreak > endPos - 1500) {
        endPos = paragraphBreak;
      } else {
        // Look for sentence break
        const sentenceBreak = Math.max(
          text.lastIndexOf('. ', endPos),
          text.lastIndexOf('! ', endPos),
          text.lastIndexOf('? ', endPos)
        );
        if (sentenceBreak > startPos && sentenceBreak > endPos - 500) {
          endPos = sentenceBreak + 1; // Include the punctuation
        }
      }
    }

    // Add this chunk
    chunks.push(text.substring(startPos, endPos));
    
    // Move to next chunk with overlap
    startPos = Math.max(0, endPos - overlap);
  }

  return chunks;
}

/**
 * Summarizes text content using AI
 * 
 * @param text The text to summarize
 * @returns A summary of the text
 */
export async function summarizeText(text: string): Promise<string> {
  try {
    console.log("Starting summarizeText with text length:", text?.length || 0);

    // If text is small enough, process directly
    if (!text || text.length < 12000) {
      return await processSummarization(text);
    }
    
    // For longer text, process in chunks
    console.log("Text too large, processing in chunks");
    const chunks = chunkText(text, 12000, 500);
    console.log(`Split text into ${chunks.length} chunks for processing`);
    
    // Process each chunk
    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i+1}/${chunks.length}`);
      const chunkSummary = await processSummarization(
        chunks[i], 
        `Part ${i+1} of ${chunks.length}`
      );
      chunkSummaries.push(chunkSummary);
    }
    
    // If we have multiple summaries, synthesize them
    if (chunkSummaries.length > 1) {
      console.log("Synthesizing final summary from chunk summaries");
      const combinedSummary = chunkSummaries.join("\n\n");
      
      // Process the combined summaries to create a final summary
      return await processSummarization(
        combinedSummary, 
        "Final synthesis",
        800
      );
    } else {
      return chunkSummaries[0];
    }
  } catch (err) {
    console.error("Error in summarizeText:", err);
    // Instead of throwing, return a basic fallback
    const fallbackSummary = text.substring(0, 200) + (text.length > 200 ? "..." : "");
    console.log("Error occurred, using fallback simple truncation summary");
    return fallbackSummary;
  }
}

/**
 * Process a chunk of text for summarization
 * 
 * @param text Text to summarize
 * @param chunkInfo Optional info about this chunk for the prompt
 * @param maxTokens Max tokens for the response
 * @returns Summary of the text
 */
async function processSummarization(
  text: string, 
  chunkInfo: string = "", 
  maxTokens: number = 500
): Promise<string> {
  // Use entire text or truncate if still too large
  const maxLength = 15000;
  const textToProcess = text.length > maxLength 
    ? text.substring(0, maxLength - 100) + "... [content truncated]"
    : text;
  
  console.log(`Processing summary for ${chunkInfo || "content"}, length: ${textToProcess.length}`);
  
  // Check if OpenRouter integration is available
  if (openRouter) {
    console.log("Using OpenRouter for summary generation");
    
    const chunkContext = chunkInfo 
      ? `\nNote: This is ${chunkInfo} of the full content.` 
      : '';
    
    const prompt = `You are helping with a Brain Dump organization tool. This tool takes unstructured, unorganized information from various sources (text, files, links, etc.) and organizes it into a coherent, structured document.

I need you to write a comprehensive but concise summary of the following content. The summary should:
1. Capture the main themes and key points
2. Preserve the most important information
3. Be well-structured and easy to understand
4. Serve as an introduction to the organized document
5. Help the user quickly grasp what their unstructured content is about${chunkContext}

Here's the content to summarize:
      
${textToProcess}

Summary:`;
    
    try {
      const response = await openRouter.complete(prompt, {
        maxTokens: maxTokens,
        temperature: 0.5
      });
      
      console.log("OpenRouter summary response received");
      return response.trim();
    } catch (aiError) {
      console.error("Error calling OpenRouter API:", aiError);
      throw new Error("AI summary generation failed: " + (aiError.message || "Unknown error"));
    }
  } else {
    console.log("OpenRouter not available, using fallback summarization");
    // Fallback if AI not available
    // Simple extractive summarization - get first sentence and some key sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 3) {
      return sentences.join('. ') + '.';
    }
    
    // Get the first sentence, a middle sentence, and the last sentence
    const firstSentence = sentences[0].trim();
    const middleSentence = sentences[Math.floor(sentences.length / 2)].trim();
    const lastSentence = sentences[sentences.length - 1].trim();
    
    const summary = `${firstSentence}. ${middleSentence}. ${lastSentence}.`;
    console.log("Fallback summary generated");
    return summary;
  }
}

/**
 * Extracts keywords from text content
 * 
 * @param text The text to extract keywords from
 * @returns An array of keywords
 */
export async function extractKeywords(text: string): Promise<string[]> {
  try {
    console.log("Starting extractKeywords with text length:", text?.length || 0);

    // If text is small enough, process directly
    if (!text || text.length < 12000) {
      return await processKeywordExtraction(text);
    }
    
    // For longer text, process in chunks
    console.log("Text too large, processing keywords in chunks");
    const chunks = chunkText(text, 12000, 500);
    console.log(`Split text into ${chunks.length} chunks for keyword extraction`);
    
    // Process each chunk
    const allKeywords: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing keywords for chunk ${i+1}/${chunks.length}`);
      const chunkKeywords = await processKeywordExtraction(chunks[i]);
      allKeywords.push(...chunkKeywords);
    }
    
    // Deduplicate and prioritize keywords
    const keywordFrequency = new Map<string, number>();
    allKeywords.forEach(keyword => {
      const normalized = keyword.toLowerCase().trim();
      keywordFrequency.set(normalized, (keywordFrequency.get(normalized) || 0) + 1);
    });
    
    // Sort by frequency and pick the top 15
    const sortedKeywords = Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([keyword]) => {
        // Find the original case version from the array
        const originalCase = allKeywords.find(k => k.toLowerCase().trim() === keyword);
        return originalCase || keyword;
      });
    
    return sortedKeywords;
  } catch (err) {
    console.error("Error in extractKeywords:", err);
    // Return some basic keywords instead of failing
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const uniqueWords = Array.from(new Set(words)).slice(0, 5);
    console.log("Error occurred, using simple fallback keywords");
    return uniqueWords; 
  }
}

/**
 * Process a chunk of text for keyword extraction
 * 
 * @param text Text to extract keywords from
 * @returns Array of keywords
 */
async function processKeywordExtraction(text: string): Promise<string[]> {
  // Use entire text or truncate if still too large
  const maxLength = 15000;
  const textToProcess = text.length > maxLength 
    ? text.substring(0, maxLength - 100) + "... [content truncated]"
    : text;
  
  // Check if OpenRouter integration is available
  if (openRouter) {
    console.log("Using OpenRouter for keyword extraction");
    const prompt = `You are helping with a Brain Dump organization tool. This tool takes unstructured, unorganized information from various sources and organizes it into a structured document.

Extract 10-15 meaningful keywords or key phrases from the following content. The keywords should:
1. Reflect the most important topics, concepts, and themes
2. Help categorize and organize the content
3. Be specific enough to be useful but general enough to cover major themes
4. Be helpful for indexing and searching this content later
5. Include both technical terms (if any) and conceptual themes

Here's the content to analyze:
      
${textToProcess}

Keywords (provide as a comma-separated list):`;
    
    try {
      const response = await openRouter.complete(prompt, {
        maxTokens: 250,
        temperature: 0.3
      });
      
      console.log("OpenRouter keyword response received");
      
      // Parse the response to get keywords
      const keywords = response
        .split(/[,\n]/)
        .map(keyword => keyword.trim())
        .filter(keyword => 
          keyword.length > 0 && 
          !keyword.startsWith('-') && 
          !keyword.startsWith('•') &&
          !keyword.match(/^\d+\./)
        );
      
      console.log(`Parsed ${keywords.length} keywords`);
      return keywords;
    } catch (aiError) {
      console.error("Error calling OpenRouter API for keywords:", aiError);
      throw new Error("AI keyword extraction failed: " + (aiError.message || "Unknown error"));
    }
  } else {
    console.log("OpenRouter not available, using fallback keyword extraction");
    // Fallback if AI not available
    // Simple keyword extraction based on word frequency
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts: {[key: string]: number} = {};
    
    // Count word occurrences
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3 && !isStopWord(cleaned)) {
        wordCounts[cleaned] = (wordCounts[cleaned] || 0) + 1;
      }
    });
    
    // Sort by frequency and get top keywords
    const keywords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
    
    console.log("Fallback keywords extracted");
    return keywords;
  }
}

// Helper function to check if a word is a stop word
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 
    'from', 'with', 'in', 'out', 'over', 'under', 'again', 'further', 'then', 
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 
    'each', 'few', 'more', 'most', 'some', 'such', 'no', 'not', 'only', 'own', 
    'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'
  ]);
  
  return stopWords.has(word);
}

/**
 * Generates a title for a brain dump based on its content
 * 
 * @param text The brain dump content
 * @returns A generated title for the brain dump
 */
export async function generateTitle(text: string): Promise<string> {
  try {
    if (!text.trim()) {
      return "Untitled Brain Dump";
    }
    
    // Use a smaller portion of text if it's too large
    const maxLength = 5000; // We need less content to generate a title
    const textToProcess = text.length > maxLength 
      ? text.substring(0, maxLength) + "..."
      : text;
    
    // Check if OpenRouter integration is available
    if (openRouter) {
      const prompt = `You are helping with a Brain Dump organization tool that transforms unstructured information into organized content.

Generate a concise, descriptive title for the following content. The title should:
1. Be 3-7 words long
2. Clearly indicate the main subject or theme
3. Be specific enough to distinguish this content from others
4. Use engaging but professional language
5. Not use generic phrases like "Notes on" or "Thoughts about"

Content to title:
      
${textToProcess}

Title:`;
      
      const response = await openRouter.complete(prompt, {
        maxTokens: 30,
        temperature: 0.7
      });
      
      // Clean up the response
      let title = response.trim();
      
      // Remove quotes if present
      title = title.replace(/^["']|["']$/g, '');
      
      // Limit title length
      if (title.length > 60) {
        title = title.substring(0, 57) + '...';
      }
      
      // Ensure we have something
      return title || "Untitled Brain Dump";
    } else {
      // Fallback if AI not available
      // Extract first 5-7 words from content to form a title
      const words = text.trim().split(/\s+/);
      if (words.length === 0) return "Untitled Brain Dump";
      
      // Get first sentence if possible
      const firstSentence = text.split(/[.!?]+/)[0].trim();
      
      if (firstSentence.length < 50) {
        return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
      }
      
      // Otherwise, use first few words
      const titleWords = words.slice(0, 6);
      let title = titleWords.join(' ');
      
      // Trim if too long
      if (title.length > 60) {
        title = title.substring(0, 57) + '...';
      }
      
      return title.charAt(0).toUpperCase() + title.slice(1);
    }
  } catch (err) {
    console.error("Error in generateTitle:", err);
    return "Untitled Brain Dump";  // Always return something even if there's an error
  }
}

/**
 * Extract topics and themes from content using AI
 * 
 * @param text The content to extract topics from
 * @param sectionTitles Optional list of section titles to help identify topics
 * @returns Array of identified topics with descriptions
 */
export async function extractTopics(text: string, sectionTitles?: string[]): Promise<Array<{name: string, description: string}>> {
  try {
    console.log("Starting extractTopics with text length:", text?.length || 0);

    // If text is small enough, process directly
    if (!text || text.length < 10000) {
      return await processTopicExtraction(text, sectionTitles);
    }
    
    // For longer text, process in chunks
    console.log("Text too large, processing topics in chunks");
    const chunks = chunkText(text, 10000, 500);
    console.log(`Split text into ${chunks.length} chunks for topic extraction`);
    
    // Process each chunk
    const allTopics: Array<{name: string, description: string, chunkIndex: number}> = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing topics for chunk ${i+1}/${chunks.length}`);
      
      // For each chunk, get topics with the chunk index for tracking
      const chunkTopics = await processTopicExtraction(chunks[i], sectionTitles);
      chunkTopics.forEach(topic => {
        allTopics.push({...topic, chunkIndex: i});
      });
    }
    
    // Deduplicate and merge topics
    console.log(`Total topics from all chunks: ${allTopics.length}, deduplicating...`);
    const mergedTopics = mergeTopics(allTopics);
    console.log(`After merging, topics reduced to: ${mergedTopics.length}`);
    
    // Limit to a reasonable number of topics (max 10)
    const finalTopics = mergedTopics.slice(0, 10);
    
    return finalTopics;
  } catch (err) {
    console.error("Error in extractTopics:", err);
    // Return some basic fallback topics
    return [
      { name: "Main Topic", description: "Primary content focus" },
      { name: "Key Points", description: "Important information from the content" }
    ];
  }
}

/**
 * Process a chunk of text for topic extraction
 * 
 * @param text Text to extract topics from
 * @param sectionTitles Optional section titles
 * @returns Array of topics with descriptions
 */
async function processTopicExtraction(
  text: string, 
  sectionTitles?: string[]
): Promise<Array<{name: string, description: string}>> {
  // Use entire text or truncate if still too large
  const maxLength = 12000;
  const textToProcess = text.length > maxLength 
    ? text.substring(0, maxLength - 100) + "... [content truncated]"
    : text;

  // Add section titles to help identify topics if available
  let sectionContext = '';
  if (sectionTitles && sectionTitles.length > 0) {
    sectionContext = `The content has the following sections:\n${sectionTitles.map(title => `- ${title}`).join('\n')}\n\n`;
  }
  
  // Check if OpenRouter integration is available
  if (openRouter) {
    console.log("Using OpenRouter for topic extraction");
    
    const prompt = `You are helping with a Brain Dump organization tool that transforms unstructured information from various sources into organized, coherent content.

Your task is to identify 5-8 clear, distinct topics or themes in the following content. These topics will serve as the organizational structure for the final document.

For each topic:
1. Choose a concise, descriptive name (2-4 words)
2. Write a helpful description (1-2 sentences) explaining what this topic encompasses
3. Make topics specific enough to be meaningful but broad enough to cover related ideas
4. Ensure topics are distinct from each other and collectively cover the main content
5. Focus on the substantive themes rather than document structure (avoid topics like "Introduction" unless truly central)

${sectionContext}
Content to analyze:
${textToProcess}

Please respond in the following JSON format only, with no additional text:
[
  {
    "name": "Topic Name",
    "description": "Brief description of the topic - what it encompasses and why it matters"
  },
  ...
]`;
    
    try {
      const response = await openRouter.complete(prompt, {
        maxTokens: 900,
        temperature: 0.4
      });
      
      console.log("OpenRouter topic response received");
      
      // Parse the JSON response
      try {
        // Handle potential non-JSON formatting in the response
        let jsonString = response;
        
        // Extract JSON if there's surrounding text
        const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        const topics = JSON.parse(jsonString);
        
        if (Array.isArray(topics) && topics.length > 0) {
          console.log(`Successfully extracted ${topics.length} topics`);
          return topics;
        } else {
          throw new Error("Invalid topics format returned");
        }
      } catch (parseErr) {
        console.error("Error parsing topics JSON:", parseErr, "Response was:", response);
        throw new Error("Failed to parse AI response for topics");
      }
    } catch (aiError) {
      console.error("Error calling OpenRouter API for topics:", aiError);
      throw new Error("AI topic extraction failed: " + (aiError.message || "Unknown error"));
    }
  } else {
    console.log("OpenRouter not available, using fallback topic extraction");
    
    // Fallback topic extraction based on keyword frequency and grouping
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts: {[key: string]: number} = {};
    
    // Count word occurrences
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3 && !isStopWord(cleaned)) {
        wordCounts[cleaned] = (wordCounts[cleaned] || 0) + 1;
      }
    });
    
    // Get top frequent words for potential topics
    const topicWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // Create basic topics with descriptions
    return topicWords.map(word => {
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
      return {
        name: capitalized,
        description: `Content related to ${word}`
      };
    });
  }
}

/**
 * Merges and deduplicates topics from multiple chunks
 * 
 * @param topics Array of topics with chunk indices
 * @returns Merged array of unique topics
 */
function mergeTopics(
  topics: Array<{name: string, description: string, chunkIndex: number}>
): Array<{name: string, description: string}> {
  // Group similar topics
  const topicGroups = new Map<string, Array<{name: string, description: string, chunkIndex: number}>>();
  
  topics.forEach(topic => {
    const normalizedName = topic.name.toLowerCase().trim();
    
    // Check if this topic is similar to any existing group
    let foundGroup = false;
    for (const [groupKey, group] of topicGroups.entries()) {
      // Simple similarity check: 50% of words match
      const groupWords = new Set(groupKey.split(/\s+/));
      const topicWords = normalizedName.split(/\s+/);
      const matchCount = topicWords.filter(word => groupWords.has(word)).length;
      
      if (matchCount > 0 && matchCount >= topicWords.length * 0.5) {
        group.push(topic);
        foundGroup = true;
        break;
      }
    }
    
    // If no similar group found, create a new one
    if (!foundGroup) {
      topicGroups.set(normalizedName, [topic]);
    }
  });
  
  // Merge each group into a single topic
  const mergedTopics: Array<{name: string, description: string, score: number}> = [];
  
  for (const group of topicGroups.values()) {
    if (group.length === 1) {
      // Single topic, add as is with a score based on frequency
      const { name, description } = group[0];
      mergedTopics.push({ name, description, score: 1 });
    } else {
      // Multiple similar topics, merge them
      // Sort by chunk index to prioritize earlier sections
      group.sort((a, b) => a.chunkIndex - b.chunkIndex);
      
      // Use the name from the topic that appears in the earliest chunk
      const { name } = group[0];
      
      // Combine descriptions, taking the longest one
      const description = group
        .map(t => t.description)
        .reduce((longest, current) => 
          current.length > longest.length ? current : longest, 
          group[0].description
        );
      
      // Score based on frequency (how many chunks this topic appears in)
      const uniqueChunks = new Set(group.map(t => t.chunkIndex)).size;
      const score = uniqueChunks;
      
      mergedTopics.push({ name, description, score });
    }
  }
  
  // Sort by score descending
  return mergedTopics
    .sort((a, b) => b.score - a.score)
    .map(({ name, description }) => ({ name, description }));
}
