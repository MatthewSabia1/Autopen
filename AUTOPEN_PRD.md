# Autopen: Product Requirements Document

## Project Overview
Autopen is a web application designed to help users organize and analyze their thoughts through a "brain dump" system. The application allows users to input their ideas, which are then analyzed and organized using AI. It features user authentication, project management, and content organization tools for transforming unstructured thoughts into polished content products.

## Core Functionality

### Authentication & User Management
- Secure user authentication via Supabase (signup, login, logout)
- User profile management and settings
- Session persistence and token management
- Offline detection and connectivity management

### Brain Dump Analysis
- Text input for unstructured thoughts and ideas
- File upload support (documents, images)
- Link/URL input with YouTube integration (transcript extraction)
- AI-powered content analysis and organization
- Results display with structured recommendations

### Content Organization
- Projects system for saving analyzed content
- Folder-based organization with nested hierarchy
- Content tagging and categorization
- Grid and list view options
- Search functionality across all content

### Creator Tools
- AI-assisted content generation
- Multiple content type templates:
  - E-Books
  - Online Courses
  - Blog Collections
  - Video Scripts
  - Newsletters
  - Social Media content
- Content editing and management interface

## Technical Architecture

### Frontend
- React 18 with TypeScript
- Vite as build tool
- TailwindCSS for styling with custom design system
- React Router for navigation
- React Context API for state management
- React Hook Form for form handling
- Lucide React for iconography

### Backend & API Integration
- Supabase for authentication and database
- PostgreSQL database with tables for:
  - profiles: User profile information
  - projects: User-created projects and content
  - brain_dumps: User thought input sessions
  - analysis_results: Processed results from brain dumps
  - project_items: Individual items within projects
  - project_folders: Folder organization system
  - folder_projects: Many-to-many relationship between folders and projects
  - creator_contents: AI-generated content items
- Row-level security policies
- Custom database functions (e.g., get_folder_item_count)
- OpenRouter API integration (google/gemini-2.0-flash-lite-001 model) for AI content analysis
- YouTube transcript API integration for video content analysis

### Data Management
- REST API communication with Supabase
- Local caching for offline functionality
- Optimistic UI updates with background syncing
- Real-time subscriptions for live updates

## Database Schema
```
profiles
  id (uuid, primary key)
  user_id (uuid, references auth.users.id)
  username (text)
  full_name (text)
  avatar_url (text)
  updated_at (timestamp)

projects
  id (uuid, primary key)
  user_id (uuid, references auth.users.id)
  title (text)
  description (text)
  content (jsonb)
  status (text)
  created_at (timestamp)
  updated_at (timestamp)

project_folders
  id (uuid, primary key)
  user_id (uuid, references auth.users.id)
  name (text)
  description (text)
  created_at (timestamp)
  updated_at (timestamp)

folder_projects
  id (uuid, primary key)
  folder_id (uuid, references project_folders.id)
  project_id (uuid, references projects.id)
  created_at (timestamp)

brain_dumps
  id (uuid, primary key)
  user_id (uuid, references auth.users.id)
  title (text)
  content (text)
  project_id (uuid, references projects.id)
  created_at (timestamp)
  updated_at (timestamp)

creator_contents
  id (uuid, primary key)
  user_id (uuid, references auth.users.id)
  title (text)
  content_type (text)
  status (text)
  content (jsonb)
  created_at (timestamp)
  updated_at (timestamp)
```

## API Endpoints & Integration

### Supabase API
- Authentication: `/auth/v1/` - User signup, login, session management
- Database API: `/rest/v1/` - CRUD operations for application data
- Storage API: `/storage/v1/` - File uploads and management
- Realtime API: Websocket connections for live updates

### External API Integration
- OpenRouter API (https://openrouter.ai/api/v1/chat/completions)
  - Used for AI-powered content analysis
  - Model: google/gemini-2.0-flash-lite-001
  - Processes text, files, and YouTube transcripts

- YouTube Data API Integration
  - Custom implementation for extracting video transcripts
  - Multiple fallback methods for transcript retrieval
  - Transcript formatting for AI analysis

## User Flows

### Brain Dump Process
1. User inputs unstructured thoughts into text area, uploads files, or adds links
2. System analyzes the content to identify key themes and patterns
3. Results are displayed in an organized format with categories
4. User can save results as a project
5. Projects can be organized into folders

### Content Organization Flow
1. User creates folders to categorize content
2. Content can be added to multiple folders
3. User can view content within folder context
4. Navigation maintains folder context when viewing detailed content
5. Search allows finding content across all folders

### Creator Workflow
1. User selects content type template
2. AI assists in generating structured content
3. User can edit and refine the generated content
4. Content can be saved, exported, or integrated with existing projects

## Design System
- Custom color palette with ink and accent colors
- Typography system with serif and display fonts
- Standardized modal designs across application
- Consistent component styling for:
  - Buttons (primary, secondary, tertiary)
  - Forms and inputs
  - Cards and containers
  - Navigation elements
  - Loading states and progress indicators

## Performance Considerations
- Optimized API calls to prevent excessive requests
- Local caching for offline functionality
- Proper cleanup of event listeners and subscriptions
- Memoization of expensive operations
- Error handling with user-friendly feedback
- Connection status monitoring with automatic reconnection
- Timeout handling for API requests

## Future Enhancements
- Mobile application
- Enhanced AI analysis capabilities
- Collaboration features
- Additional export formats
- Premium templates and layouts
- Advanced analytics and content performance metrics
- Multi-language support

## Technical Constraints
- Internet connectivity required for full functionality
- Browser storage limitations for offline caching
- API rate limits for external services
- Security considerations for content storage
- OpenRouter API quotas and limits
- YouTube API restrictions for transcript extraction