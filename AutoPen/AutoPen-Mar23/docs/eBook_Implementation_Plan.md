# eBook Workflow Implementation Plan

## 1. Overview

This document outlines the implementation plan for the eBook creation workflow within the existing Creator tool framework. The eBook workflow transforms raw data into professionally formatted eBooks through a 9-step AI-driven content generation process. This implementation will establish patterns and components that can be reused for future product types.

## 2. Architecture

### 2.1 System Architecture

The eBook workflow implementation will follow a modular architecture with the following key components:

1. **Workflow Manager**: Orchestrates the 9-step eBook creation process, managing state transitions and data flow.
2. **AI Generation Service**: Handles communication with the OpenRouter API for AI content generation.
3. **Content Assembly Module**: Combines generated content components into a cohesive eBook.
4. **PDF Generation Service**: Converts assembled content into downloadable PDFs.
5. **Frontend Components**: UI elements for workflow navigation, content preview, and editing.

### 2.2 Database Schema Extensions

Based on the existing Creator tool's database structure, we'll extend the `creator_contents` table with additional fields and create new tables to support the eBook workflow:

```sql
-- Extend creator_contents table with eBook-specific fields
ALTER TABLE public.creator_contents
ADD COLUMN IF NOT EXISTS workflow_step TEXT,
ADD COLUMN IF NOT EXISTS generation_progress JSONB DEFAULT '{"current_step": null, "total_steps": null, "steps_completed": []}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_model_settings JSONB DEFAULT '{}'::jsonb;

-- Create table for eBook chapters
CREATE TABLE IF NOT EXISTS public.ebook_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  content_id UUID REFERENCES public.creator_contents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  chapter_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create table for eBook versions
CREATE TABLE IF NOT EXISTS public.ebook_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  content_id UUID REFERENCES public.creator_contents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add appropriate indexes
CREATE INDEX IF NOT EXISTS ebook_chapters_content_id_idx ON public.ebook_chapters(content_id);
CREATE INDEX IF NOT EXISTS ebook_versions_content_id_idx ON public.ebook_versions(content_id);

-- Add RLS policies for the new tables
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ebook_chapters
CREATE POLICY ebook_chapters_select_policy
  ON public.ebook_chapters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_chapters.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_chapters_insert_policy
  ON public.ebook_chapters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_chapters.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_chapters_update_policy
  ON public.ebook_chapters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_chapters.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_chapters_delete_policy
  ON public.ebook_chapters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_chapters.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

-- Create RLS policies for ebook_versions
CREATE POLICY ebook_versions_select_policy
  ON public.ebook_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_versions.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_versions_insert_policy
  ON public.ebook_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_versions.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_versions_update_policy
  ON public.ebook_versions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_versions.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_versions_delete_policy
  ON public.ebook_versions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_versions.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );
```

## 3. Implementation Components

### 3.1 Backend Services

#### 3.1.1 OpenRouter API Integration Service
- Create a service to interact with OpenRouter API for various AI models
- Implement error handling and retry logic for API calls
- Implement prompt management and token optimization

#### 3.1.2 eBook Workflow Manager
- Implement the state machine for the 9-step workflow
- Manage transitions between workflow steps
- Track progress and handle interruptions/resumptions

#### 3.1.3 Content Assembly Service
- Combine generated components (title, TOC, chapters, intro, conclusion)
- Format content with proper structure
- Validate assembled content for completeness

#### 3.1.4 PDF Generation Service
- Convert assembled content to PDF format
- Apply styling and formatting
- Handle pagination and document metadata

### 3.2 Frontend Components

#### 3.2.1 Workflow UI Components
- `EbookWorkflow`: Main component for the eBook creation workflow
- `WorkflowStep`: Base component for implementing each step of the workflow
- `WorkflowNavigation`: Component for moving between workflow steps
- `WorkflowProgress`: Visual indicator of workflow progress

#### 3.2.2 Content Generation UI Components
- `GenerationSettings`: Controls for AI model settings and generation parameters
- `GenerationPreview`: Real-time preview of generated content
- `GenerationFeedback`: UI for providing feedback to improve generation

#### 3.2.3 Content Editing UI Components
- `ChapterEditor`: Rich text editor for modifying chapter content
- `TableOfContentsEditor`: UI for reordering, adding, or removing chapters
- `PDFPreview`: Preview component for the final PDF output

### 3.3 TypeScript Types and Interfaces

```typescript
// Types for the eBook workflow
export interface EbookWorkflowState {
  currentStep: EbookWorkflowStep;
  progress: {
    stepsCompleted: EbookWorkflowStep[];
    currentStepProgress: number;
    isGenerating: boolean;
  };
  error: string | null;
}

export enum EbookWorkflowStep {
  INPUT_HANDLING = 'input_handling',
  GENERATE_TITLE = 'generate_title',
  GENERATE_TOC = 'generate_toc',
  GENERATE_CHAPTERS = 'generate_chapters',
  GENERATE_INTRODUCTION = 'generate_introduction',
  GENERATE_CONCLUSION = 'generate_conclusion',
  ASSEMBLE_DRAFT = 'assemble_draft',
  AI_REVIEW = 'ai_review',
  GENERATE_PDF = 'generate_pdf'
}

// Types for the OpenRouter API integration
export interface OpenRouterRequest {
  model: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    text: string;
    index: number;
    logprobs: null;
    finish_reason: string;
  }[];
}

// Types for the eBook content
export interface EbookChapter {
  id: string;
  title: string;
  content: string;
  chapterIndex: number;
  metadata: Record<string, any>;
}

export interface EbookContent {
  title: string;
  tableOfContents: {
    chapters: {
      title: string;
      dataPoints: string[];
    }[];
  };
  introduction: string;
  chapters: EbookChapter[];
  conclusion: string;
}

export interface EbookVersion {
  id: string;
  versionNumber: number;
  pdfUrl: string;
  createdAt: string;
  metadata: Record<string, any>;
}
```

## 4. Implementation Approach

### 4.1 Database Implementation

1. Create a migration script for the database schema extensions
2. Update the TypeScript types to reflect the new database schema
3. Extend the existing `useCreator` hook to handle eBook-specific data

### 4.2 Backend Implementation

1. Implement OpenRouter API integration service
2. Develop the eBook workflow manager
3. Implement content assembly service
4. Create the PDF generation service

### 4.3 Frontend Implementation

1. Create reusable workflow components
2. Implement step-specific UI components
3. Build content preview and editing interfaces
4. Develop PDF preview and download functionality

### 4.4 Testing Strategy

1. Unit tests for workflow logic and API integrations
2. Integration tests for workflow step transitions
3. End-to-end tests for complete workflow execution
4. User acceptance testing with sample eBook generation

## 5. Implementation Schedule

### Phase 1: Foundation (Week 1)
- Database schema extensions
- TypeScript type definitions
- OpenRouter API integration service
- Basic workflow manager

### Phase 2: Core Functionality (Week 2)
- Implement individual workflow steps
- Develop content generation UI
- Build content assembly service
- Create basic PDF generation

### Phase 3: UI Refinement (Week 3)
- Enhance workflow navigation
- Improve content preview and editing
- Develop PDF preview functionality
- Implement progress tracking

### Phase 4: Testing & Polishing (Week 4)
- Comprehensive testing
- Performance optimization
- Error handling improvements
- Documentation and finalization

## 6. Extension to Future Product Types

This implementation is designed to establish patterns that can be extended to other product types:

1. **Abstract Workflow Framework**: The workflow manager is designed to be extended for different product types
2. **Modular Content Generation**: The AI generation service supports different prompt templates and models
3. **Flexible Content Assembly**: The assembly service can be configured for different content structures
4. **Pluggable Output Formats**: The output generation can be extended for formats beyond PDF

Future product types (courses, blog posts, etc.) can leverage this framework by:
1. Defining their specific workflow steps
2. Creating their own content models and database schema
3. Implementing product-specific UI components
4. Configuring appropriate AI models and prompts

## 7. Considerations and Risks

### 7.1 Technical Considerations
- Token limits for OpenRouter API calls
- Performance optimization for large eBooks
- PDF generation quality and format consistency

### 7.2 Potential Risks
- OpenRouter API availability and rate limits
- Content quality variability across AI models
- PDF generation compatibility across devices

### 7.3 Mitigation Strategies
- Implement caching and retry mechanisms
- Allow manual editing to address AI content quality issues
- Use established PDF libraries with broad compatibility 