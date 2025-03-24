import { Json } from './database.types';

/**
 * Enum for eBook workflow steps
 */
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

/**
 * Type for workflow progress tracking
 */
export interface WorkflowProgress {
  currentStep: EbookWorkflowStep | null;
  totalSteps: number | null;
  stepsCompleted: EbookWorkflowStep[];
  stepProgress?: {
    [key in EbookWorkflowStep]?: number;
  };
}

/**
 * Interface for AI model settings
 */
export interface AIModelSettings {
  title?: {
    model: string;
    temperature?: number;
    max_tokens?: number;
  };
  toc?: {
    model: string;
    temperature?: number;
    max_tokens?: number;
  };
  chapters?: {
    model: string;
    temperature?: number;
    max_tokens?: number;
  };
  introduction?: {
    model: string;
    temperature?: number;
    max_tokens?: number;
  };
  conclusion?: {
    model: string;
    temperature?: number;
    max_tokens?: number;
  };
  review?: {
    model: string;
    temperature?: number;
    max_tokens?: number;
  };
}

/**
 * Interface for eBook chapter
 */
export interface EbookChapter {
  id?: string;
  title: string;
  content: string | null;
  chapterIndex: number;
  metadata?: Record<string, any>;
  dataPoints?: string[]; // Associated data points from the TOC
}

/**
 * Interface for table of contents
 */
export interface TableOfContents {
  chapters: {
    title: string;
    dataPoints: string[];
  }[];
}

/**
 * Interface for eBook content
 */
export interface EbookContent {
  title?: string;
  tableOfContents?: TableOfContents;
  introduction?: string;
  chapters?: EbookChapter[];
  conclusion?: string;
  rawData?: string; // Original data from Brain Dump or manual input
}

/**
 * Interface for eBook version
 */
export interface EbookVersion {
  id?: string;
  versionNumber: number;
  pdfUrl: string | null;
  createdAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for OpenRouter API requests
 */
export interface OpenRouterRequest {
  model: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

/**
 * Interface for OpenRouter API responses
 */
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