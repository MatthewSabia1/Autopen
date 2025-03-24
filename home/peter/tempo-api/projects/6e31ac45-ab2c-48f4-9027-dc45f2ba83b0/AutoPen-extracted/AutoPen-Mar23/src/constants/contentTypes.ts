export const CONTENT_TYPES = [
  {
    id: 'ebook',
    name: 'E-Book',
    description: 'Create a complete digital book with chapters and sections'
  },
  {
    id: 'course',
    name: 'Online Course',
    description: 'Educational content organized into modules and lessons'
  },
  {
    id: 'blog',
    name: 'Blog Post',
    description: 'Article format with introduction, body, and conclusion'
  },
  {
    id: 'video_script',
    name: 'Video Script',
    description: 'Script for video production with sections and talking points'
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Email newsletter format with sections and call-to-actions'
  },
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Content for social media platforms in various formats'
  }
];

export interface ContentType {
  id: string;
  name: string;
  description: string;
} 