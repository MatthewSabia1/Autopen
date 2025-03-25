# AutoPen Library

This directory contains core library functionality for the AutoPen application.

## Key Components

### openRouter.ts

Integration with OpenRouter API for AI content generation. Functions include:

- `generateOpenRouterResponse`: Core function for making AI requests with retry logic
- `generateIdeasFromBrainDump`: Generates eBook ideas from user input
- `generateEbookStructure`: Creates eBook structure with chapters
- `generateChapterContent`: Generates content for individual chapters
- `formatEbookForExport`: Formats eBook content for export

### pdfGenerator.ts

Handles export functionality for the eBook generation workflow:

- `generatePdf`: Creates PDF files from markdown content using html2pdf.js
- `generateEpub`: Creates EPUB files (with browser/server aware implementation)
- `generateMarkdown`: Creates markdown files for download

### contexts/WorkflowContext.tsx

React context that manages the entire eBook creation workflow:

- State management for multi-step workflow
- Database operations for storing workflow state
- Integration with OpenRouter API for content generation
- Handles files, links, and brain dump analysis
- Manages chapter generation with context awareness

## Environment Variables

- `OPENROUTER_KEY`: API key for OpenRouter integration

## Dependencies

These libraries must be installed:

- html2pdf.js: For PDF generation
- jszip: For EPUB generation

To install:

```
npm install html2pdf.js jszip
```

## Usage Examples

### Content Generation

```typescript
import { generateIdeasFromBrainDump } from './openRouter';

// Generate ideas from user input
const ideas = await generateIdeasFromBrainDump(
  "My content here...",
  ["file1.txt", "image.jpg"],
  ["https://example.com/article"]
);
```

### Export Functionality

```typescript
import { generatePdf, generateMarkdown } from './pdfGenerator';

// Generate PDF
const pdfBlob = await generatePdf(
  "My eBook Title",
  "Book description",
  chaptersArray,
  { paperSize: 'a4', withCover: true }
);

// Create download link
const url = URL.createObjectURL(pdfBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'ebook.pdf';
a.click();
```

### Workflow Context

```tsx
import { WorkflowProvider, useWorkflow } from './contexts/WorkflowContext';

// Wrap your app with the provider
<WorkflowProvider>
  <YourComponent />
</WorkflowProvider>

// Use the workflow in components
function YourComponent() {
  const { 
    currentStep, 
    createProject, 
    analyzeBrainDump, 
    generateEbookChapter 
  } = useWorkflow();
  
  // Use workflow functions
}
```