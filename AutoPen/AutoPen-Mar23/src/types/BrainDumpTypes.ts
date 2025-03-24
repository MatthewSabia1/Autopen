export type FileItem = {
  id: string;
  file: File;
  preview?: string;
  type: 'document' | 'image';
  name: string;
  size: number;
};

export type LinkItem = {
  id: string;
  url: string;
  title: string;
  type: 'webpage' | 'youtube';
  thumbnail?: string;
  transcript?: string;
  isLoadingTranscript?: boolean;
  transcriptError?: string;
};

export type AnalysisData = {
  files: FileItem[];
  links: LinkItem[];
  text: string;
};

export type EbookIdea = {
  title: string;
  description: string;
  chapters: string[];
};

export type AnalysisResult = {
  summary: string;
  ebookIdeas: EbookIdea[];
  error?: string;
};