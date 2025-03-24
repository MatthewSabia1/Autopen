# Overview of the Creator Tool Workflow for eBooks

The Creator tool takes cleaned data from the Brain Dump tool or processes raw data input by the user, then transforms it into a finished eBook. The process involves generating a title, structuring the content, creating detailed chapters, adding introductory and concluding sections, allowing user review, and producing a final PDF.

## Workflow Implementation

The eBook workflow follows a step-by-step process managed through a dedicated workflow component. Each step in the workflow is tracked in the database through the `workflow_step` and `workflow_progress` fields, allowing users to continue where they left off if their session is interrupted.

### Workflow Components

The workflow is implemented through a series of React components:

1. **EbookWorkflow**: The master component managing the overall workflow
2. **WorkflowProgress**: A visual progress indicator showing completed and upcoming steps
3. **Individual step components**: Specialized components for each workflow step

## Workflow Steps

### Step 1: Input Handling
- Users can start the product creation flow (Creator Tool) from opening it directly and being prompted to input data to be used manually, or started by clicking "Creator Product" button(s) on the results after processing data with the Brain Dump tool.
- The input can be in raw text format, which will be processed by the AI, or users can provide structured content directly.
- Implementation: `InputStep.tsx` component handles both manual input and automated input from the Brain Dump tool.

### Step 2: Generate a Viral Title
- **Description**: Create an attention-grabbing title for the eBook based on the cleaned data.
- **OpenRouter Model**: google/gemma-3-12b-it:free
- **Prompt**: "Given the following structured data containing key themes, topics, and summaries, generate an engaging and viral eBook title that succinctly encapsulates the core message. The title should be catchy, clear, and adaptable to various genres or content styles. If the provided data is minimal, infer a creative title based on best-practice title structures."
- **Output**: A single, catchy title (e.g., "Unleash Your Potential: The Ultimate Guide to Personal Growth").
- **Implementation**: `TitleStep.tsx` component provides UI for generating, editing, and saving the title.

### Step 3: Generate Table of Contents
- **Description**: Structure the eBook by creating a table of contents (TOC) with chapter titles and mapping relevant data to each chapter.
- **OpenRouter Model**: deepseek/deepseek-r1-zero:free
- **Prompt**: "Review the following structured data comprising key points, themes, and summaries. Develop a detailed table of contents for an eBook by outlining chapter titles. For each chapter, list the corresponding data points or topics that will be discussed. Ensure the sequence offers a logical flow and accommodates both broad and niche content areas. If gaps are detected, propose additional sections that could enhance the narrative."
- **Output**: A TOC with chapter titles and associated data points (e.g.,  
    * Chapter 1: "The Foundations of Success" – [data points A, B, C]  
    * Chapter 2: "Building Your Mindset" – [data points D, E]).
- **Notes**: The AI determines the number of chapters based on the data's depth and breadth, ensuring a logical flow.
- **Implementation**: `TOCStep.tsx` component allows for generating, editing, adding, removing, and reordering chapters.

### Step 4: Generate Chapter Contents
- **Description**: Produce detailed content for each chapter using the mapped data points.
- **OpenRouter Model**: deepseek/deepseek-r1-zero:free
- **Prompt**: "Compose a comprehensive chapter for the eBook titled '[chapter title]' by incorporating the following data points: [list of data points]. The chapter must be detailed, coherent, and engaging, with a clear narrative structure. Include explanations, examples, and smooth transitions to enhance readability. If the input data is sparse, intelligently expand on common themes while remaining consistent with the overall ebook purpose. Also, monitor token limits by splitting content into subsections if needed."
- **Process**:  
    * Loop through each chapter from the TOC.
    * Feed the relevant data points into the prompt for that chapter.
    * Generate one chapter at a time to stay within token limits and maintain focus.
- **Output**: Fully written chapters (e.g., 1,000–4,000 words each, depending on data volume).
- **Notes**: Sequential generation ensures coherence, though parallel processing could speed things up if implemented later. If a chapter exceeds token limits, it can be split into subsections.
- **Implementation**: `ChapterStep.tsx` component manages the generation of individual chapter content, with progress tracking for multi-chapter books.

### Step 5: Generate Introduction
- **Description**: Write an engaging introduction to hook readers and preview the eBook's content.
- **OpenRouter Model**: google/gemma-3-12b-it:free
- **Prompt**: "Craft an engaging introduction for an eBook titled '[title]' that leverages the following table of contents: [list of chapter titles]. Your introduction should establish a strong hook, outline the main themes, and set clear expectations for the reader. Aim for 300–500 words, ensuring the tone is inviting and adaptable to a variety of content styles. Consider starting with a thought-provoking question or a striking statistic to capture attention."
- **Output**: An introduction (e.g., 300–500 words) that sets the tone and purpose of the eBook.
- **Notes**: This step enhances the eBook's professionalism and reader engagement.
- **Implementation**: `IntroductionStep.tsx` component handles the generation and editing of the introduction section.

### Step 6: Generate Conclusion
- **Description**: Summarize key points and leave readers with a lasting impression.
- **OpenRouter Model**: google/gemma-3-12b-it:free
- **Prompt**: "Develop a compelling conclusion for the ebook by summarizing the essential points from the following chapters: [list of chapter titles with brief summaries]. Reinforce the central message, tie together any loose ends, and provide the reader with actionable takeaways or a memorable closing thought. Aim for a 500–1000-word conclusion that is both reflective and inspiring."
- **Output**: A conclusion (e.g., 500–1000 words) tying the eBook together.
- **Notes**: Added to ensure a complete narrative arc.
- **Implementation**: `ConclusionStep.tsx` component handles the generation and editing of the conclusion section.

### Step 7: Assemble Draft eBook
- **Description**: Combine all generated components into a cohesive draft.
- **Process**:  
    * Structure the content in order: Title, Introduction, Table of Contents, Chapters, Conclusion.
    * Present as plain text, Markdown, or an editable in-app format (e.g., a web editor).
- **OpenRouter Model**: None; this is a programmatic step.
- **Tools**: Use a scripting language (e.g., Python) to concatenate the text.
- **Output**: A draft eBook in an editable format.
- **Implementation**: `DraftStep.tsx` component assembles all content and displays a preview of the full eBook.

### Step 8: AI-Driven Review and Revision
- **Description**: In this revised Step 8, the AI takes full responsibility for reviewing the draft eBook, identifying areas for improvement, generating internal notes, and applying revisions to produce a polished version of the content. This eliminates the need for user intervention during this stage and streamlines the editing process.
- **Process**:
  1. **Initial Review**  
     * The AI analyzes the entire draft eBook, including the title, introduction, table of contents, chapters, and conclusion.  
     * It evaluates the content for:  
       * Coherence: Does the narrative flow logically?  
       * Consistency: Are the tone, style, and terminology uniform?  
       * Completeness: Are there gaps or underdeveloped sections?  
       * Engagement: Is the content compelling and reader-friendly?  
       * Alignment: Does it match the eBook's intended purpose?
  2. **Generate Notes**  
     * The AI creates a list of specific suggestions for improvement based on its review. Examples might include:  
       * "Chapter 3 needs more examples to clarify the main argument."  
       * "The transition from Chapter 1 to Chapter 2 feels abrupt; add a connecting sentence."  
       * "The introduction lacks a hook; consider starting with a question or statistic."
     * These notes are internal to the AI process and guide the subsequent revisions.
  3. **Make Revisions**  
     * Using the notes it generated, the AI revises the draft by:  
       * Rewriting sections for clarity or depth.  
       * Adding or removing content as needed.  
       * Reorganizing sections for better flow.  
       * Adjusting the tone or style for consistency.
     * For example, if the note says "Add examples in Chapter 3," the AI will generate relevant examples and integrate them seamlessly into the text.
  4. **Iterative Refinement**  
     * After making the initial revisions, the AI reviews the updated draft again, generates a new set of notes (if needed), and applies further changes.  
     * This cycle repeats until the AI determines the eBook meets a high standard of quality—e.g., when no significant issues remain or the notes become minimal.
  5. **Final Check**  
     * The AI performs a final review to confirm the eBook is polished and ready. If it passes, the process moves to the next step (e.g., generating the final PDF). If not, it triggers another revision cycle.
- **AI Model**: deepseek/deepseek-r1-zero:free
- **Prompts Used**:
  * **Review Prompt**: "Conduct a comprehensive review of the draft eBook provided below. Assess the overall coherence, narrative flow, consistency in tone and style, completeness of the arguments, and reader engagement. Identify specific sections that need improvement—ranging from structural adjustments to sentence-level clarity—and list actionable, detailed suggestions for enhancement. Your feedback should address both macro (overall structure) and micro (language, transitions) elements."
  * **Revision Prompt**: "Using the following list of actionable suggestions: [insert list of notes], revise the provided draft eBook. Address each feedback point thoroughly to improve clarity, coherence, and reader engagement while preserving the original intent and structure of the ebook. Ensure that every change enhances the narrative flow and consistency in tone."
  * **Final Check Prompt**: "Perform a final review of the revised eBook provided below. Confirm that the content is cohesive, consistent in style, and engaging for the target audience. If any minor issues or areas for improvement still exist, list them clearly; if not, state that the ebook is fully polished and ready for final formatting."
- **Output**: A revised and polished draft eBook, ready for final formatting (e.g., PDF generation).
- **Implementation**: `ReviewStep.tsx` component manages the AI review process, showing progress and the final polished content.

### Step 9: Generate Final PDF
- **Description**: Convert the approved draft into a polished PDF.
- **Process**:  
    * Use a document generation library (e.g., jsPDF with jsPDF-AutoTable).
    * Apply a predefined template with styles for headings, paragraphs, page numbers, etc.
- **OpenRouter Model**: None; this is a formatting step.
- **Output**: A professional PDF eBook.
- **Notes**: Optional enhancements (e.g., cover page, images) could be added later but are excluded for simplicity.
- **Implementation**: `PDFStep.tsx` component handles the PDF generation, preview, and download functionality.

## Data Storage and Persistence

All eBook content is stored in the Supabase database in the `creator_contents` table, with the following structure for eBooks:

1. **Content**: A JSONB field storing the complete eBook structure (TOC, chapters, introduction, conclusion)
2. **Workflow Progress**: A JSONB field tracking the user's progress through the workflow
3. **Versions**: A JSONB field storing different versions of the eBook as the user progresses

## Security and Permissions

The eBook creator functionality is protected by Supabase's Row Level Security (RLS) policies:

1. Users can only view their own eBooks
2. Creation is allowed for any authenticated user
3. Updates and deletions are restricted to the owner of the content

## Additional Considerations
- **Length Control**: Users can specify eBook length (e.g., short: 10,000 words; medium: 20,000 words) at the start, adjusting prompt instructions (e.g., "Keep chapters concise").
- **Consistency**: The TOC data mapping ensures chapters align with the overall theme, and the AI review step ensures a coherent final product.
- **Scalability**: This workflow focuses on eBooks but can be adapted for courses (e.g., modules instead of chapters) or blog posts (e.g., single-section outputs) later.
- **Error Handling**: All steps include robust error handling and retry mechanisms for failed AI generations.
- **Fallback Options**: Manual editing is available at every step if the AI generation doesn't meet expectations.

## Technical Documentation

For detailed technical implementation information, database schema, and API details, please refer to the [eBook Technical Implementation](./eBook_Technical_Implementation.md) document.
