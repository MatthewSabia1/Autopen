# AutoPen Workflow System

This directory contains components for the modular content creation workflow system.

## Overview

The workflow system is designed to support multiple content creation types (eBook, course, blog, etc.) with a common framework for:

- Content input (Brain Dump)
- Idea selection and analysis
- Structured content generation
- Export to various formats

## Components

### WorkflowSelectionPage

Entry point for all workflow types. Displays available workflow options and allows the user to choose which type of content to create.

**Features:**
- Visual cards for each workflow type
- Indicators for "coming soon" workflows
- Overview of the workflow process
- Direct navigation to specific workflow types

### WorkflowContainer

Dynamic container that loads the appropriate workflow component based on the URL parameter. Handles routing between different workflow implementations.

**Features:**
- URL-based workflow type detection
- Error handling for invalid workflow types
- Synchronizes URL parameters with workflow context
- Navigation safety checks

### EbookCreationWorkflow

Implementation of the eBook creation workflow. Guides users through the process of creating a complete eBook.

**Steps:**
1. Creator (initial setup)
2. Brain Dump (content input)
3. Idea Selection (choose from AI-generated ideas)
4. eBook Structure (define chapters and outline)
5. eBook Writing (generate chapter content)
6. eBook Preview (finalize and export)

### Step Components

Each workflow includes step-specific components that handle the individual stages of the workflow:

- **CreatorStep**: Project creation and setup
- **BrainDumpStep**: Content input with file and link support
- **IdeaSelectionStep**: Select from AI-generated ideas
- **EbookWritingStep**: Chapter-by-chapter content generation
- **EbookPreviewStep**: Preview and export to multiple formats

## URL Structure

- `/workflow`: Main workflow selection page
- `/workflow/:type`: Type-specific workflow (e.g., `/workflow/ebook`)
- `/workflow/:type/:id`: Project-specific workflow with ID

## Adding New Workflow Types

When adding a new workflow type:

1. Create a new workflow component (e.g., `CourseCreationWorkflow.tsx`)
2. Create step components for the new workflow
3. Update `WorkflowContainer.tsx` to load the new workflow
4. Update workflow types in `WorkflowContext.tsx`
5. Add the new option to `WorkflowSelectionPage.tsx`

## Navigation Pattern

All navigation between workflows should use the context's `resetWorkflow` function:

```typescript
const { resetWorkflow } = useWorkflow();

// Navigate to eBook workflow
resetWorkflow('ebook');
```

This ensures that:
1. The workflow type is set correctly in context
2. The URL is updated to match the workflow type
3. The workflow state is properly initialized