import { summarizeText, extractKeywords, extractTopics, chunkText } from './ai/textProcessor';

/**
 * Maximum content size to process in a single operation (in characters)
 */
const MAX_CONTENT_SIZE = 100000;

/**
 * Core function to analyze brain dump content from both standalone and workflow contexts
 * 
 * @param content The main text content to analyze
 * @param files Optional file attachments
 * @param links Optional links to include in analysis
 * @param progressCallback Callback function to report progress
 * @returns Analyzed content object
 */
export const analyzeBrainDumpContent = async (
  content: string,
  files?: any[],
  links?: any[],
  progressCallback?: (message: string) => void
): Promise<any> => {
  try {
    console.log("analyzeBrainDumpContent started with:", {
      contentLength: content?.length || 0,
      filesCount: files?.length || 0,
      linksCount: links?.length || 0
    });
    
    // Progress tracking
    const progress = progressCallback || ((msg: string) => console.log(msg));
    const startTime = Date.now();
    
    // Step 1: Collect and preserve all content for analysis
    progress("Collecting and organizing content...");
    
    // Create structured content objects to preserve all original content
    const contentSources = {
      mainContent: content || '',
      files: files?.map(file => ({
        id: file.id,
        name: file.name || file.file_name || 'Unnamed file',
        type: file.type || 'unknown',
        content: file.content || null,
        size: file.size || file.file_size || 0
      })) || [],
      links: links?.map(link => ({
        id: link.id,
        url: link.url || '',
        title: link.title || link.url || 'Unnamed link',
        type: link.type || link.link_type || 'webpage',
        transcript: link.transcript || null
      })) || []
    };
    
    // Track content statistics for each source
    const sourceStats = {
      main: { chars: content?.length || 0, words: content?.split(/\s+/).length || 0 },
      files: { count: files?.length || 0, chars: 0, words: 0 },
      links: { count: links?.length || 0, chars: 0, transcripts: 0, chars: 0, words: 0 }
    };
    
    // Combine content with better source tracking
    const documentSources: Array<{
      type: 'main' | 'file' | 'link',
      id: string,
      title: string,
      content: string,
      sourceInfo?: any
    }> = [];
    
    // Add main content as a document source
    if (content && content.trim()) {
      documentSources.push({
        type: 'main',
        id: 'main-content',
        title: 'Main Content',
        content: content
      });
    }
    
    // Add file contents if they have text content
    if (files && files.length > 0) {
      progress("Processing file content...");
      console.log("Files to process:", files.length);
      
      // Process each file with content
      let fileIndex = 0;
      for (const file of files) {
        if (fileIndex % 5 === 0) {
          progress(`Processing files (${fileIndex}/${files.length})...`);
        }
        
        // Text files have content we can extract
        if (file.content && typeof file.content === 'string') {
          const fileContent = file.content;
          sourceStats.files.chars += fileContent.length;
          sourceStats.files.words += fileContent.split(/\s+/).length;
          
          documentSources.push({
            type: 'file',
            id: file.id,
            title: file.name || file.file_name || `File ${fileIndex + 1}`,
            content: fileContent,
            sourceInfo: {
              fileType: file.type,
              fileSize: file.size || file.file_size,
              fileName: file.name || file.file_name
            }
          });
          
          console.log(`Added content from file: ${file.name || file.file_name || 'unnamed file'}`);
        }
        fileIndex++;
      }
    }
    
    // Add link contents, especially YouTube transcripts
    if (links && links.length > 0) {
      progress("Processing link content...");
      console.log("Links to process:", links.length);
      
      // Process each link with content
      let linkIndex = 0;
      for (const link of links) {
        if (linkIndex % 5 === 0) {
          progress(`Processing links (${linkIndex}/${links.length})...`);
        }
        
        if (link.transcript && typeof link.transcript === 'string') {
          sourceStats.links.transcripts++;
          sourceStats.links.chars += link.transcript.length;
          sourceStats.links.words += link.transcript.split(/\s+/).length;
          
          documentSources.push({
            type: 'link',
            id: link.id,
            title: `${link.title || link.url || 'Unknown'} (Transcript)`,
            content: link.transcript,
            sourceInfo: {
              url: link.url,
              linkType: link.type || link.link_type
            }
          });
          
          console.log(`Added transcript from link: ${link.url}`);
        }
        linkIndex++;
      }
    }
    
    console.log("Document sources collected:", {
      totalSources: documentSources.length,
      mainStats: sourceStats.main,
      fileStats: sourceStats.files,
      linkStats: sourceStats.links
    });
    
    // Intelligently combine content only if needed for analysis
    // For very large combined content, we'll process each source separately
    const totalContentSize = documentSources.reduce((sum, source) => sum + source.content.length, 0);
    const isExtremelyLarge = totalContentSize > MAX_CONTENT_SIZE * 2;
    
    let combinedText = '';
    
    if (isExtremelyLarge) {
      progress(`Content is extremely large (${Math.round(totalContentSize/1000)}KB). Using distributed processing...`);
      console.log("Using distributed processing for extremely large content");
      // We'll process each source separately later, no need to combine yet
    } else {
      // Combine with source markers for better context
      documentSources.forEach((source, index) => {
        if (index > 0) combinedText += '\n\n';
        
        // Add source markers for better context
        if (source.type !== 'main') {
          combinedText += `=== ${source.title} ===\n\n`;
        }
        
        combinedText += source.content;
      });
      
      console.log("Combined text length:", combinedText.length);
    }
    
    // Step 2: Identify natural sections in the content
    progress("Identifying content structure...");
    
    let contentSections;
    
    if (isExtremelyLarge) {
      // For extremely large content, process each source independently
      contentSections = [];
      let globalSectionIndex = 0;
      
      for (let i = 0; i < documentSources.length; i++) {
        const source = documentSources[i];
        
        // Show progress update for large sources
        if (documentSources.length > 3) {
          progress(`Analyzing source ${i+1}/${documentSources.length}: ${source.title}`);
        }
        
        // Segment this source
        const sourceSections = segmentContent(source.content);
        
        // Add source information to each section
        const augmentedSections = sourceSections.map((section, sectionIndex) => ({
          ...section,
          id: `section-${globalSectionIndex + sectionIndex}`,
          sourceType: source.type,
          sourceId: source.id,
          sourceTitle: source.title
        }));
        
        contentSections.push(...augmentedSections);
        globalSectionIndex += sourceSections.length;
      }
    } else {
      // For normal-sized content, segment the combined text
      contentSections = segmentContent(combinedText);
    }
    
    console.log(`Identified ${contentSections.length} content sections`);
    
    // Step 3: Basic text analysis
    progress("Analyzing text characteristics...");
    
    // Calculate total words across all sources
    const totalWords = documentSources.reduce((sum, source) => {
      return sum + source.content.split(/\s+/).length;
    }, 0);
    
    // Calculate reading time (average reading speed: 200-250 words per minute)
    const readingTimeMinutes = Math.ceil(totalWords / 225);
    
    // Count sentences across all content
    const totalSentences = documentSources.reduce((sum, source) => {
      return sum + source.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    }, 0);
    
    // Step 4: Identify topics and themes
    progress("Identifying key topics and themes...");
    let topics = [];
    
    if (isExtremelyLarge) {
      // For extremely large content, process topics in batches
      const batchSize = 3; // Number of sources to process in each batch
      const allTopics = [];
      
      // Process sources in batches to avoid memory issues
      for (let i = 0; i < documentSources.length; i += batchSize) {
        const batch = documentSources.slice(i, i + batchSize);
        const batchText = batch.map(source => source.content).join("\n\n");
        
        progress(`Analyzing topics batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documentSources.length/batchSize)}...`);
        
        try {
          const batchTopics = await identifyTopics(batchText, contentSections);
          allTopics.push(...batchTopics);
        } catch (err) {
          console.error(`Error processing topics batch ${i}-${i+batchSize}:`, err);
          // Continue with other batches even if one fails
        }
      }
      
      // Deduplicate and select top topics
      const uniqueTopicNames = new Set();
      topics = allTopics.filter(topic => {
        const normalized = topic.name.toLowerCase();
        if (uniqueTopicNames.has(normalized)) return false;
        uniqueTopicNames.add(normalized);
        return true;
      }).slice(0, 12); // Limit to top 12 topics
    } else {
      try {
        topics = await identifyTopics(combinedText, contentSections);
      } catch (err) {
        console.error("Error identifying topics:", err);
        // Provide fallback topics
        topics = [{
          id: 'topic-main',
          name: 'Main Content',
          description: 'Primary content from the brain dump',
          relatedSections: contentSections.slice(0, 5).map(s => s.id)
        }];
        
        progress("Topics analysis encountered an issue, using basic topics...");
      }
    }
    
    console.log(`Identified ${topics.length} topics`);
    
    // Step 5: Generate summary
    progress("Generating content summary...");
    let summary = '';
    
    try {
      if (isExtremelyLarge) {
        // For extremely large content, summarize each source and then combine
        const sourceSummaries = [];
        
        for (let i = 0; i < Math.min(documentSources.length, 5); i++) {
          // Only process the first 5 sources to avoid overload
          const source = documentSources[i];
          progress(`Summarizing source ${i+1}/${Math.min(documentSources.length, 5)}: ${source.title}`);
          
          try {
            const sourceSummary = await summarizeText(source.content);
            sourceSummaries.push(`${source.title}: ${sourceSummary}`);
          } catch (err) {
            console.error(`Error summarizing source ${i}:`, err);
            // Add a minimal summary if there's an error
            sourceSummaries.push(`${source.title}: Content available but not summarized due to processing limitations.`);
          }
        }
        
        // Combine source summaries
        summary = sourceSummaries.join("\n\n");
        
        // If there are more sources than we processed, add a note
        if (documentSources.length > 5) {
          summary += `\n\n(${documentSources.length - 5} additional sources not included in summary due to size constraints)`;
        }
      } else {
        summary = await summarizeText(combinedText);
      }
      
      progress("Generated summary...");
      console.log("Summary generated successfully");
    } catch (err) {
      console.error("Error generating summary:", err);
      progress("Summary generation failed, creating basic summary...");
      
      // Fallback to basic summary
      if (combinedText.length > 500) {
        summary = combinedText.substring(0, 497) + '...';
      } else {
        summary = combinedText;
      }
    }
    
    // Step 6: Extract keywords
    progress("Extracting important keywords...");
    let keywords: string[] = [];
    
    try {
      if (isExtremelyLarge) {
        // For extremely large content, extract keywords from multiple sources
        const allKeywords = [];
        
        // Process up to 5 sources for keywords
        for (let i = 0; i < Math.min(documentSources.length, 5); i++) {
          const source = documentSources[i];
          try {
            const sourceKeywords = await extractKeywords(source.content);
            allKeywords.push(...sourceKeywords);
          } catch (err) {
            console.error(`Error extracting keywords from source ${i}:`, err);
            // Continue with other sources even if one fails
          }
        }
        
        // Deduplicate and rank keywords
        const keywordFreq = new Map();
        allKeywords.forEach(kw => {
          const normalized = kw.toLowerCase();
          keywordFreq.set(normalized, (keywordFreq.get(normalized) || 0) + 1);
        });
        
        // Sort by frequency and select top keywords
        keywords = Array.from(keywordFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(entry => {
            // Find original casing
            const original = allKeywords.find(k => k.toLowerCase() === entry[0]);
            return original || entry[0];
          });
      } else {
        keywords = await extractKeywords(combinedText);
      }
      
      progress("Extracted keywords...");
      console.log("Keywords extracted:", keywords);
    } catch (err) {
      console.error("Error extracting keywords:", err);
      progress("Keyword extraction failed, using basic extraction...");
      
      // Fallback to basic keyword extraction
      // Get common words and filter out stop words
      const words = combinedText.split(/\s+/);
      const wordFrequency: {[key: string]: number} = {};
      words.forEach(word => {
        const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleaned.length > 3 && !isStopWord(cleaned)) {
          wordFrequency[cleaned] = (wordFrequency[cleaned] || 0) + 1;
        }
      });
      
      // Sort by frequency
      keywords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => entry[0]);
    }
    
    // Step 7: Create structured outline
    progress("Creating content outline...");
    const outline = generateOutline(contentSections, topics);
    
    // Step 8: Organize the analyzed data
    progress("Organizing analysis results...");
    
    // Create the analysis result object
    const analysisResult = {
      // Original content preserved and structured
      originalContent: contentSources,
      
      // Document sources tracking
      documentSources: documentSources.map(source => ({
        type: source.type,
        id: source.id,
        title: source.title,
        sourceInfo: source.sourceInfo
      })),
      
      // Structured content sections
      sections: contentSections,
      
      // Identified topics
      topics,
      
      // Content outline
      outline,
      
      // Quick reference data
      summary,
      keywords,
      stats: {
        wordCount: totalWords,
        sentenceCount: totalSentences,
        readingTimeMinutes,
        sectionCount: contentSections.length,
        topicCount: topics.length,
        fileCount: files?.length || 0,
        linkCount: links?.length || 0,
        sourceStats
      },
      
      // Processing metadata
      processingInfo: {
        processingMethod: isExtremelyLarge ? 'distributed' : 'combined',
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        version: '1.1'
      }
    };
    
    progress("Analysis complete!");
    console.log("Analysis result generated with full content structure preserved");
    
    return analysisResult;
  } catch (err: any) {
    console.error("Error analyzing brain dump content:", err);
    throw new Error(`Analysis failed: ${err.message || 'Unknown error'}`);
  }
};

/**
 * Segments text content into meaningful sections
 * 
 * @param content Text content to segment
 * @returns Array of content sections
 */
function segmentContent(content: string): Array<{id: string, title: string, content: string, wordCount: number}> {
  if (!content.trim()) {
    return [];
  }
  
  // Special handling for extremely large content - chunk it first
  if (content.length > MAX_CONTENT_SIZE) {
    console.log(`Content too large (${content.length} chars), chunking before segmentation`);
    const chunks = chunkText(content, 50000, 500);
    console.log(`Split into ${chunks.length} chunks for segmentation`);
    
    // Process each chunk and combine results
    let allSections: Array<{id: string, title: string, content: string, wordCount: number}> = [];
    let sectionIndex = 0;
    
    chunks.forEach((chunk, chunkIndex) => {
      // Process this chunk
      const chunkSections = segmentContentInternal(chunk);
      
      // Add to all sections with proper IDs
      chunkSections.forEach((section, i) => {
        allSections.push({
          ...section,
          id: `section-${sectionIndex + i}`,
          title: section.title + (chunks.length > 1 ? ` (Part ${chunkIndex + 1})` : '')
        });
      });
      
      sectionIndex += chunkSections.length;
    });
    
    return allSections;
  }
  
  // For normal sized content, use standard segmentation
  return segmentContentInternal(content);
}

/**
 * Internal implementation of content segmentation
 */
function segmentContentInternal(content: string): Array<{id: string, title: string, content: string, wordCount: number}> {
  // Split content based on common section indicators
  const headingRegex = /(?:^|\n)(#+\s+.+|\d+\.\s+.+|[A-Z][A-Za-z\s]+:)(?:\n|$)/g;
  
  let sections: Array<{id: string, title: string, content: string, wordCount: number}> = [];
  let lastIndex = 0;
  let match;
  
  // First try to find explicit headings
  while ((match = headingRegex.exec(content)) !== null) {
    const startIndex = match.index;
    const heading = match[1].trim();
    
    // If this isn't the first match, save the previous section
    if (startIndex > lastIndex) {
      const sectionText = content.substring(lastIndex, startIndex).trim();
      if (sectionText) {
        const words = sectionText.split(/\s+/);
        sections.push({
          id: `section-${sections.length}`,
          title: sections.length === 0 ? 'Introduction' : 'Untitled Section',
          content: sectionText,
          wordCount: words.length
        });
      }
    }
    
    // Update the lastIndex for the next section
    lastIndex = startIndex + match[0].length;
    
    // Clean up the heading (remove #, numbering, etc.)
    let cleanHeading = heading
      .replace(/^#+\s+/, '')  // Remove markdown heading marks
      .replace(/^\d+\.\s+/, '')  // Remove numbering
      .replace(/:$/, '');     // Remove trailing colon
    
    // Ready for next section which will use this heading
    if (sections.length > 0) {
      sections[sections.length - 1].title = cleanHeading;
    } else {
      // If this is the first match and it's at the start of the content, create a section for it
      const nextMatchIndex = headingRegex.lastIndex;
      const sectionEnd = nextMatchIndex > 0 ? nextMatchIndex : content.length;
      const sectionText = content.substring(lastIndex, sectionEnd).trim();
      
      if (sectionText) {
        const words = sectionText.split(/\s+/);
        sections.push({
          id: `section-${sections.length}`,
          title: cleanHeading,
          content: sectionText,
          wordCount: words.length
        });
      }
    }
  }
  
  // Add the final section if there's content left
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex).trim();
    if (remainingText) {
      const words = remainingText.split(/\s+/);
      sections.push({
        id: `section-${sections.length}`,
        title: sections.length === 0 ? 'Main Content' : 'Additional Content',
        content: remainingText,
        wordCount: words.length
      });
    }
  }
  
  // If no sections were identified using headings, fallback to paragraph-based segmentation
  if (sections.length <= 1) {
    sections = [];
    
    // Split by double newlines which usually indicate paragraph breaks
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Group related paragraphs into logical sections
    // For simplicity, every ~300 words will form a new section
    const wordsPerSection = 300;
    let currentSection = '';
    let currentWordCount = 0;
    let sectionIndex = 0;
    
    for (const paragraph of paragraphs) {
      const paragraphWordCount = paragraph.split(/\s+/).length;
      
      // If adding this paragraph exceeds our target section size and we already have content,
      // create a new section with what we have so far
      if (currentWordCount > 0 && currentWordCount + paragraphWordCount > wordsPerSection) {
        // Generate a more meaningful title based on content rather than "Section X"
        const firstSentenceMatch = currentSection.match(/^([^.!?]+[.!?])/);
        let sectionTitle = `Content Section ${sectionIndex + 1}`;
        
        if (firstSentenceMatch) {
          // Use first sentence if it's reasonably short (under 60 chars)
          const firstSentence = firstSentenceMatch[1].trim();
          if (firstSentence.length < 60) {
            sectionTitle = firstSentence;
          } else {
            // Otherwise use the first few words
            const words = firstSentence.split(/\s+/).slice(0, 6).join(' ');
            sectionTitle = words + '...';
          }
        } else {
          // If no clear sentence, use first few words
          const words = currentSection.trim().split(/\s+/).slice(0, 6).join(' ');
          sectionTitle = words + (words.length < currentSection.length ? '...' : '');
        }
        
        sections.push({
          id: `section-${sectionIndex}`,
          title: sectionTitle,
          content: currentSection.trim(),
          wordCount: currentWordCount
        });
        
        sectionIndex++;
        currentSection = paragraph;
        currentWordCount = paragraphWordCount;
      } else {
        // Otherwise, add this paragraph to the current section
        currentSection += (currentSection ? '\n\n' : '') + paragraph;
        currentWordCount += paragraphWordCount;
      }
    }
    
    // Add the last section if there's anything left
    if (currentSection) {
      // Generate a more meaningful title for the last section too
      const firstSentenceMatch = currentSection.match(/^([^.!?]+[.!?])/);
      let sectionTitle = `Content Section ${sectionIndex + 1}`;
      
      if (firstSentenceMatch) {
        // Use first sentence if it's reasonably short
        const firstSentence = firstSentenceMatch[1].trim();
        if (firstSentence.length < 60) {
          sectionTitle = firstSentence;
        } else {
          // Otherwise use the first few words
          const words = firstSentence.split(/\s+/).slice(0, 6).join(' ');
          sectionTitle = words + '...';
        }
      } else {
        // If no clear sentence, use first few words
        const words = currentSection.trim().split(/\s+/).slice(0, 6).join(' ');
        sectionTitle = words + (words.length < currentSection.length ? '...' : '');
      }
      
      sections.push({
        id: `section-${sectionIndex}`,
        title: sectionTitle,
        content: currentSection.trim(),
        wordCount: currentWordCount
      });
    }
  }
  
  return sections;
}

/**
 * Identifies topics and themes within the content
 * 
 * @param fullContent The complete text content
 * @param sections Identified content sections
 * @returns Array of identified topics with related content
 */
async function identifyTopics(
  fullContent: string, 
  sections: Array<{id: string, title: string, content: string, wordCount: number}>
): Promise<Array<{id: string, name: string, description: string, relatedSections: string[]}>> {
  try {
    // Check if content is too large
    if (fullContent.length > MAX_CONTENT_SIZE) {
      console.log(`Content too large for topic identification (${fullContent.length} chars), chunking...`);
      
      // Process in chunks
      const chunks = chunkText(fullContent, 50000, 1000);
      console.log(`Split into ${chunks.length} chunks for topic identification`);
      
      // Process each chunk for topics
      const allChunkTopics: Array<{name: string, description: string}> = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing topics for chunk ${i+1}/${chunks.length}`);
        
        try {
          // Get section titles to help with topic identification
          const sectionTitles = sections
            .filter(s => chunks[i].includes(s.content.substring(0, 100)))
            .map(s => s.title);
          
          const chunkTopics = await extractTopics(chunks[i], sectionTitles);
          allChunkTopics.push(...chunkTopics);
        } catch (err) {
          console.error(`Error extracting topics from chunk ${i+1}:`, err);
          // Continue with other chunks
        }
      }
      
      // Deduplicate topics
      const uniqueTopicNames = new Set();
      const uniqueTopics = allChunkTopics.filter(topic => {
        const normalized = topic.name.toLowerCase();
        if (uniqueTopicNames.has(normalized)) return false;
        uniqueTopicNames.add(normalized);
        return true;
      });
      
      console.log(`Extracted ${uniqueTopics.length} unique topics from ${allChunkTopics.length} total`);
      
      // Map topics to our required format and find related sections
      const formattedTopics = uniqueTopics.slice(0, 10).map((topic, index) => { 
        // Find sections related to this topic
        const relatedSections = findRelatedSections(sections, topic.name);
        
        return {
          id: `topic-${index}`,
          name: topic.name,
          description: topic.description,
          relatedSections
        };
      });
      
      return formattedTopics;
    }

    // For regular-sized content, use the normal approach
    // Get section titles to help with topic identification
    const sectionTitles = sections.map(section => section.title);
    
    // Try to use AI-powered topic extraction first
    try {
      const aiTopics = await extractTopics(fullContent, sectionTitles);
      console.log("AI-powered topic extraction successful:", aiTopics);
      
      // Map topics to our required format and find related sections
      const formattedTopics = aiTopics.map((topic, index) => {
        // Find sections related to this topic
        const relatedSections = sections
          .filter(section => 
            section.title.toLowerCase().includes(topic.name.toLowerCase()) || 
            section.content.toLowerCase().includes(topic.name.toLowerCase()) ||
            (topic.name.split(' ').length > 1 && topic.name.split(' ').some(word => 
              section.content.toLowerCase().includes(word.toLowerCase()) && word.length > 3
            ))
          )
          .map(section => section.id);
        
        // If we couldn't find any sections directly, assign some sections based on content
        const finalRelatedSections = relatedSections.length > 0 
          ? relatedSections 
          : findRelatedSectionsByContent(sections, topic.name);
        
        return {
          id: `topic-${index}`,
          name: topic.name,
          description: topic.description,
          relatedSections: finalRelatedSections
        };
      });
      
      // Only return non-empty topics
      const validTopics = formattedTopics.filter(topic => topic.relatedSections.length > 0);
      
      if (validTopics.length >= 3) {
        return validTopics;
      }
      
      console.log("Not enough valid AI topics, falling back to keyword-based topics");
    } catch (err) {
      console.error("Error in AI topic extraction, falling back to keyword-based approach:", err);
    }
    
    // Fallback to keyword-based approach if AI extraction fails or returns too few topics
    
    // Get common words from section titles
    const titleWords = sections
      .map(section => section.title.toLowerCase())
      .join(' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !isStopWord(word));
    
    // Count occurrences of each word in the full content
    const wordFrequency: {[key: string]: number} = {};
    const contentWords = fullContent.toLowerCase().split(/\s+/);
    
    for (const word of contentWords) {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3 && !isStopWord(cleaned)) {
        wordFrequency[cleaned] = (wordFrequency[cleaned] || 0) + 1;
      }
    }
    
    // Get top frequent words for potential topics
    const potentialTopics = Object.entries(wordFrequency)
      .filter(([word]) => titleWords.includes(word) || wordFrequency[word] > 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(entry => entry[0]);
    
    // Create topics based on these words
    const topics: Array<{id: string, name: string, description: string, relatedSections: string[]}> = [];
    
    for (let i = 0; i < potentialTopics.length; i++) {
      const topicWord = potentialTopics[i];
      const capitalizedTopic = topicWord.charAt(0).toUpperCase() + topicWord.slice(1);
      
      // Find related sections
      const relatedSections = sections
        .filter(section => 
          section.title.toLowerCase().includes(topicWord) || 
          section.content.toLowerCase().includes(topicWord))
        .map(section => section.id);
      
      // Only create topic if it has related sections
      if (relatedSections.length > 0) {
        topics.push({
          id: `topic-${i}`,
          name: capitalizedTopic,
          description: `Content related to ${topicWord}`,
          relatedSections
        });
      }
    }
    
    // If we didn't find any meaningful topics, create general ones based on sections
    if (topics.length === 0) {
      // Create basic topic groups: Introduction, Main Points, Details, Conclusion
      const sectionCount = sections.length;
      
      if (sectionCount > 0) {
        const introSections = sections.slice(0, Math.ceil(sectionCount * 0.25)).map(s => s.id);
        const mainSections = sections.slice(Math.ceil(sectionCount * 0.25), Math.ceil(sectionCount * 0.6)).map(s => s.id);
        const detailSections = sections.slice(Math.ceil(sectionCount * 0.6), Math.ceil(sectionCount * 0.9)).map(s => s.id);
        const conclusionSections = sections.slice(Math.ceil(sectionCount * 0.9)).map(s => s.id);
        
        topics.push({
          id: 'topic-intro',
          name: 'Introduction',
          description: 'Opening content and introductory material',
          relatedSections: introSections
        });
        
        if (mainSections.length > 0) {
          topics.push({
            id: 'topic-main',
            name: 'Main Content',
            description: 'Primary information and core content',
            relatedSections: mainSections
          });
        }
        
        if (detailSections.length > 0) {
          topics.push({
            id: 'topic-details',
            name: 'Details',
            description: 'Supporting information and specific details',
            relatedSections: detailSections
          });
        }
        
        if (conclusionSections.length > 0) {
          topics.push({
            id: 'topic-conclusion',
            name: 'Conclusion',
            description: 'Summary points and concluding content',
            relatedSections: conclusionSections
          });
        }
      }
    }
    
    return topics;
  } catch (err) {
    console.error("Error in identifyTopics:", err);
    
    // Fallback to basic topics if there's an error
    const basicTopics = [];
    if (sections.length > 0) {
      basicTopics.push({
        id: 'topic-main',
        name: 'Main Content',
        description: 'Primary information from the document',
        relatedSections: sections.map(s => s.id)
      });
    }
    
    return basicTopics;
  }
}

/**
 * Find sections related to a given topic using more efficient algorithms
 */
function findRelatedSections(
  sections: Array<{id: string, title: string, content: string, wordCount: number}>,
  topic: string
): string[] {
  const topicWords = topic.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  if (topicWords.length === 0) return [];
  
  const relatedSections = [];
  
  // Score each section based on relevance to the topic
  const sectionScores = sections.map(section => {
    let score = 0;
    
    // Check title for direct match (highest relevance)
    if (section.title.toLowerCase().includes(topic.toLowerCase())) {
      score += 10;
    }
    
    // Check for individual word matches in title
    topicWords.forEach(word => {
      if (section.title.toLowerCase().includes(word)) {
        score += 5;
      }
    });
    
    // Count occurrences in content
    const contentLower = section.content.toLowerCase();
    score += (contentLower.split(topic.toLowerCase()).length - 1) * 2;
    
    // Count word occurrences
    topicWords.forEach(word => {
      score += (contentLower.split(word).length - 1) * 0.5;
    });
    
    return { id: section.id, score };
  });
  
  // Sort by score and get top matches
  const topMatches = sectionScores
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Get top 5 most relevant sections
    .map(item => item.id);
  
  return topMatches;
}

/**
 * Helper function to find sections related to a topic based on content similarity
 */
function findRelatedSectionsByContent(
  sections: Array<{id: string, title: string, content: string, wordCount: number}>,
  topicName: string
): string[] {
  // Simple heuristic: look for keywords from the topic in the section content
  const keywords = topicName.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  
  // If no good keywords, assign to sections based on position
  if (keywords.length === 0) {
    return sections.length > 0 ? [sections[0].id] : [];
  }
  
  // Find sections that contain these keywords
  const relatedSections = sections
    .filter(section => 
      keywords.some(keyword => 
        section.content.toLowerCase().includes(keyword)
      )
    )
    .map(section => section.id);
  
  // If still no matches, use the first few sections
  if (relatedSections.length === 0 && sections.length > 0) {
    const count = Math.min(2, sections.length);
    return sections.slice(0, count).map(s => s.id);
  }
  
  return relatedSections;
}

/**
 * Generates a hierarchical outline of the content
 * 
 * @param sections Content sections
 * @param topics Identified topics
 * @returns Content outline
 */
function generateOutline(
  sections: Array<{id: string, title: string, content: string, wordCount: number}>,
  topics: Array<{id: string, name: string, description: string, relatedSections: string[]}>
): Array<{title: string, items: Array<{id: string, title: string}>}> {
  const outline: Array<{title: string, items: Array<{id: string, title: string}>}> = [];
  
  // Add sections to outline
  outline.push({
    title: 'Content Sections',
    items: sections.map(section => ({
      id: section.id,
      title: section.title
    }))
  });
  
  // Add topics to outline
  outline.push({
    title: 'Key Topics',
    items: topics.map(topic => ({
      id: topic.id,
      title: topic.name
    }))
  });
  
  return outline;
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
 * Generates a structured markdown document from the analysis results
 * This can be saved and used directly in the Creator tool
 * 
 * @param analysisResult The complete analysis result object
 * @returns Formatted markdown document
 */
export function generateStructuredDocument(analysisResult: any): string {
  if (!analysisResult) return '';
  
  const { summary, keywords, sections, topics, stats } = analysisResult;
  
  // Build the markdown document
  let document = `# ${analysisResult.title || 'Brain Dump Analysis'}\n\n`;
  
  // Add summary
  document += `## Summary\n\n${summary || 'No summary available.'}\n\n`;
  
  // Add basic stats
  document += `## Document Statistics\n\n`;
  document += `- **Word Count:** ${stats.wordCount.toLocaleString()}\n`;
  document += `- **Reading Time:** ${stats.readingTimeMinutes} min\n`;
  document += `- **Sections:** ${stats.sectionCount}\n`;
  document += `- **Topics:** ${stats.topicCount}\n`;
  if (stats.fileCount > 0) document += `- **Files:** ${stats.fileCount}\n`;
  if (stats.linkCount > 0) document += `- **Links:** ${stats.linkCount}\n`;
  document += '\n';
  
  // Add keywords if available
  if (keywords && keywords.length > 0) {
    document += `## Keywords\n\n`;
    document += keywords.map(k => `\`${k}\``).join(' • ') + '\n\n';
  }
  
  // Add topics with descriptions
  if (topics && topics.length > 0) {
    document += `## Topics & Themes\n\n`;
    
    topics.forEach((topic, index) => {
      document += `### ${index + 1}. ${topic.name}\n\n`;
      document += `${topic.description}\n\n`;
      
      // Add related sections for each topic
      if (topic.relatedSections && topic.relatedSections.length > 0) {
        document += `**Related Sections:**\n\n`;
        
        topic.relatedSections.forEach(sectionId => {
          const section = sections.find(s => s.id === sectionId);
          if (section) {
            // If section has a generic title like "Section X", show a content excerpt instead
            if (section.title.match(/^Section \d+$/)) {
              // Get the first 40-60 characters of content as a preview
              const contentPreview = section.content.substring(0, Math.min(60, section.content.length));
              const truncatedPreview = contentPreview.length < section.content.length 
                ? contentPreview.replace(/\s+\S*$/, '') + '...' // Truncate at last complete word
                : contentPreview;
              document += `- ${truncatedPreview}\n`;
            } else {
              // Use the actual title if it's not generic
              document += `- ${section.title}\n`;
            }
          }
        });
        
        document += '\n';
      }
    });
  }
  
  // Add all content sections with their content
  if (sections && sections.length > 0) {
    document += `## Content Sections\n\n`;
    
    sections.forEach((section, index) => {
      document += `### ${index + 1}. ${section.title}\n\n`;
      document += `${section.content}\n\n`;
    });
  }
  
  // Footer with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  document += `---\n\nGenerated on ${timestamp} • ${stats.wordCount.toLocaleString()} words\n`;
  
  return document;
} 