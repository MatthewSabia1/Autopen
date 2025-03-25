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

Handles export functionality for content generation workflows:

- `generatePdf`: Creates PDF files from markdown content using html2pdf.js
- `generateEpub`: Creates EPUB files directly in the browser using JSZip
- `generateMarkdown`: Creates markdown files for download

### contexts/WorkflowContext.tsx

React context that manages content creation workflows:

- Supports multiple workflow types (eBook, course, video, etc.)
- Modular design for adding new workflow types
- State management for multi-step workflows
- Database operations for storing workflow state
- Integration with OpenRouter API for content generation
- Handles files, links, and brain dump analysis for all workflow types

## Workflow Architecture

The AutoPen workflow system is designed to be modular and extensible, supporting multiple content creation types.

### Components

- **WorkflowSelectionPage**: Entry point for all workflow types
- **WorkflowContainer**: Dynamic loader for specific workflow implementations
- **EbookCreationWorkflow**: Implementation of the eBook workflow
- (Future implementations for other content types)

### URL Structure

- `/workflow`: Main workflow selection page
- `/workflow/:type`: Type-specific workflow (e.g., `/workflow/ebook`)
- `/workflow/:type/:id`: Project-specific workflow

### Workflow Types

Currently implemented:
- `ebook`: Full eBook creation workflow

Planned future types:
- `course`: Online course creation
- `video`: Video content creation
- `blog`: Blog series creation
- `social`: Social media campaign creation

## Environment Variables

- `OPENROUTER_KEY`: API key for OpenRouter integration

## Dependencies

These libraries must be installed:

- html2pdf.js: For PDF generation
- jszip: For EPUB generation in the browser

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
import { generatePdf, generateEpub, generateMarkdown } from './pdfGenerator';

// Generate PDF
const pdfBlob = await generatePdf(
  "My eBook Title",
  "Book description",
  chaptersArray,
  { paperSize: 'a4', withCover: true }
);

// Generate EPUB
const epubBlob = await generateEpub(
  "My eBook Title",
  "Book description",
  chaptersArray
);

// Generate Markdown
const mdBlob = generateMarkdown(
  "My eBook Title",
  "Book description",
  chaptersArray
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
import { WorkflowProvider, useWorkflow, WorkflowType } from './contexts/WorkflowContext';

// Wrap your app with the provider
<WorkflowProvider>
  <WorkflowContainer />
</WorkflowProvider>

// Use the workflow in components
function YourComponent() {
  const { 
    workflowType,
    setWorkflowType,
    currentStep, 
    setCurrentStep,
    createProject, 
    analyzeBrainDump,
    resetWorkflow
  } = useWorkflow();
  
  // Switch to a specific workflow type
  const startEbookWorkflow = () => {
    resetWorkflow('ebook');
  };
  
  // Use workflow functions based on type
  const handleAction = () => {
    if (workflowType === 'ebook') {
      // eBook specific actions
    } else if (workflowType === 'course') {
      // Course specific actions
    }
  };
}
```

### Adding a New Workflow Type

To add a new workflow type:

1. Update the `WorkflowType` type in `WorkflowContext.tsx`:
   ```typescript
   export type WorkflowType = 'ebook' | 'course' | 'video' | 'blog' | 'social';
   ```

2. Add type-specific steps:
   ```typescript
   export type CourseWorkflowStep = 
     | BaseWorkflowStep
     | 'course-structure' 
     | 'course-modules'
     | 'course-preview';
   
   // Update the combined type
   export type WorkflowStep = EbookWorkflowStep | CourseWorkflowStep;
   ```

3. Add type-specific state and functions to the context

4. Create a new workflow component:
   ```typescript
   // CourseCreationWorkflow.tsx
   export default function CourseCreationWorkflow() {
     const { workflowType } = useWorkflow();
     
     // Ensure correct workflow type
     useEffect(() => {
       if (workflowType !== 'course') {
         console.warn('Wrong workflow type');
       }
     }, [workflowType]);
     
     // Implement course-specific workflow
   }
   ```

5. Update the `WorkflowContainer` to load the new workflow:
   ```typescript
   // In WorkflowContainer.tsx
   return (
     <>
       {type === 'ebook' && <EbookCreationWorkflow />}
       {type === 'course' && <CourseCreationWorkflow />}
     </>
   );
   ```

6. Update `WorkflowSelectionPage` to include the new workflow type