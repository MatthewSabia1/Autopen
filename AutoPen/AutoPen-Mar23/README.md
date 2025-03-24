# Autopen

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/MatthewSabia1/Autopen)

## Overview

Autopen is a web application designed to help users organize and analyze their thoughts through a "brain dump" system. The application allows users to input their ideas, which are then analyzed and organized. It features user authentication, project management, and an intuitive interface for capturing and processing thoughts.

## Features

- **User Authentication**: Secure login and signup functionality
- **Brain Dump**: A space for users to quickly capture and input their thoughts
- **Analysis**: Process and organize user input to extract insights
- **Dashboard**: User-specific dashboard to view projects and recent activity
- **Projects**: Create and manage multiple projects
- **Folder Organization**: Organize content into folders for better management
- **Products**: Create and manage various content types
- **Creator Mode**: Special tools for content creators with AI-assisted content generation
- **Settings**: User account and application settings
- **URL-Based Navigation**: Proper routing with bookmarkable URLs and back/forward button support

## Recent Improvements

### UI Standardization and Consistency
We've standardized the user interface across the application:
- Implemented a consistent design system for all modals throughout the application
- Updated CreateProjectModal and AddToProjectModal to match the styling of CreateContentModal
- Created a unified color scheme with amber accents for primary actions
- Standardized form elements, buttons, and interactive components
- Enhanced loading states with consistent spinners and progress indicators
- Improved error handling with standardized error messages and visual feedback
- Added consistent hover and focus states for better accessibility
- Standardized modal layouts with proper spacing and typography
- Enhanced mobile responsiveness across all components

### User Experience Enhancements
We've made several improvements to the user interface and experience:
- Removed intrusive alert popup when adding content to projects for a cleaner workflow
- Improved header navigation to prevent flashing during transitions
- Enhanced SelectContentModal to provide better user feedback when adding content
- Fixed errors when adding content to projects by aligning code with database schema
- Streamlined the content addition process for a smoother experience
- Improved error messaging and handling throughout the application

### Contextual Project Navigation
We've implemented a new folder-to-project navigation system:
- Projects can be viewed in the context of their parent folder
- Proper URL structure for folder-based project navigation (`/projects/folder/:folderId/view/:projectId`)
- Maintains folder context when viewing project details
- "Back" navigation returns users to the correct folder
- Different UI labeling based on navigation context
- Improved error handling with user-friendly messages for failed project loading

### Performance Optimizations
We've made several improvements to prevent performance issues:
- Fixed infinite API call loops by properly memoizing hook functions
- Added proper cleanup in useEffect hooks to prevent memory leaks
- Implemented isMounted flag pattern to prevent state updates after component unmount
- Enhanced state management to prevent unnecessary re-renders
- Improved error handling throughout the application
- Added debug logging to track API call patterns

### Projects and Folder Organization
We've implemented a comprehensive Projects page that serves as a folder organization system:
- Organize Brain Dump outputs and Products into customizable folders
- Create and manage folders with descriptions
- View folders in either grid or list view
- Search across all folders and content
- Recent products section for quick access
- Seamless integration with the existing Products system
- Enhanced error handling and validation for folder operations
- Fixed folder item counting functionality to provide accurate metrics

### Routing and Navigation
We've implemented React Router for proper URL-based navigation, providing a significant improvement to the user experience:
- Each page now has its own URL in the browser address bar
- Browser back and forward buttons work correctly with the application
- Users can bookmark specific pages and share direct links
- Protected routes redirect unauthenticated users to the login page
- Dynamic routes for content details with URL parameters

### AI Content Creation
We've restored and improved the AI content creation features:
- Create AI Content modal allows users to start new content projects
- Multiple content types supported including E-Books, Online Courses, Blog Posts, Video Scripts, Newsletters, and Social Media content
- Seamless integration with the Brain Dump tool to gather initial content
- Database schema supporting content types and metadata

### Code Quality Improvements
We've also made several improvements to the codebase:
- Fixed missing dependencies in useEffect hooks to prevent stale closures
- Resolved Promise anti-patterns to improve error handling
- Removed unused variables and imports to reduce bundle size
- Enhanced TypeScript type safety throughout the application
- Improved error handling with more detailed logging
- Added null checks and defensive programming techniques to prevent crashes
- Memoized CRUD operations in hooks to prevent unnecessary re-renders
- Added proper cleanup for useEffect hooks to prevent memory leaks
- Implemented the isMounted flag pattern to prevent state updates after component unmount

## URL Structure
The application now follows a clean URL structure:
- `/` - Home page (landing page for unauthenticated users)
- `/dashboard` - User dashboard
- `/brain-dump` - Brain dump input and analysis tool
- `/projects` - Projects folders and organization system
- `/projects/folder/:id` - Individual folder detail view with contained projects
- `/projects/folder/:folderId/view/:projectId` - Individual project view within folder context
- `/products` - Products list view
- `/products/:id` - Individual product detail view
- `/creator` - Creator mode dashboard
- `/creator/:id` - Individual creator content detail view
- `/settings` - User settings
- `/support` - Support page

## Brain Dump Process

The brain dump feature works as follows:
1. Users input their unstructured thoughts into the text area
2. The system analyzes the content to identify key themes, topics, and patterns
3. Results are displayed in an organized format with categories and priority levels
4. Users can refine the results and save them as projects for future reference
5. Projects can then be organized into folders in the Projects page

## Content Organization Flow

The content organization workflow enables efficient management of all your content:
1. Use Brain Dump to capture initial thoughts and ideas
2. Save analyzed content as Products
3. Create folders in the Projects page to categorize content by type, purpose, or status
4. Search across all folders and content to quickly find what you need
5. Switch between grid and list views based on your preference
6. Access recent products directly from the Projects page for quick editing
7. View products in the context of their folders for better organization

## Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router
- **Backend Services**: Supabase
- **Form Handling**: React Hook Form
- **Icons**: Lucide React

## Project Structure

- `src/`: Contains all source code for the application
  - `components/`: Reusable UI components
    - `auth/`: Authentication-related components
    - `creator/`: Creator mode components
    - `projects/`: Project management components
      - `ProjectsPage.tsx`: Main folder organization page
      - `ProjectsList.tsx`: List of products
      - `ProjectDetail.tsx`: Individual product details
      - `FolderDetail.tsx`: View of projects within a folder
      - `CreateProjectModal.tsx`: Modal for creating new projects
    - `settings/`: User settings components
  - `contexts/`: React context providers
    - `AuthContext`: User authentication state
    - `AnalysisContext`: Brain dump analysis state
  - `hooks/`: Custom React hooks
    - `useProjects.ts`: Hook for project CRUD operations
    - `useFolders.ts`: Hook for folder management operations
  - `lib/`: Utility functions and shared libraries
  - `types/`: TypeScript type definitions
  - `App.tsx`: Main application component that handles routing and layouts
- `supabase/`: Supabase configuration and database migrations
- `.env`: Environment configuration (not tracked in git)

## Application Flow

1. Users can sign up or log in via the authentication system
2. Authenticated users can access their dashboard with recent projects
3. The brain dump feature allows users to input their thoughts and ideas
4. The analysis system processes the input and provides organized results
5. Users can save their work as projects for future reference
6. Projects can be organized into folders in the Projects page
7. Users can click on projects within folders to view them in context
8. Account settings allow users to manage their profile and preferences
9. All navigation updates the URL, allowing users to use the browser's back and forward buttons

## Database Schema

The Supabase database includes the following main tables:
- `profiles`: User profile information
- `projects`: User-created projects 
- `brain_dumps`: User thought input sessions
- `analysis_results`: Processed results from brain dumps
- `project_items`: Individual items within projects
- `project_folders`: Folder organization system
- `folder_projects`: Many-to-many relationship between folders and projects

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn
- Supabase account for backend services

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables by creating a `.env` file with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173

### Building for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Supabase Setup

The application uses Supabase for authentication and database services. You'll need to:

1. Create a Supabase project
2. Set up the necessary tables (see the migrations directory for schema)
3. Disable Row Level Security (RLS) for the projects table:
   ```sql
   ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.project_folders DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.folder_projects DISABLE ROW LEVEL SECURITY;
   ```
   Note: RLS is deliberately disabled on these tables to avoid permission issues.
4. Set up stored procedures for item counting:
   ```sql
   CREATE OR REPLACE FUNCTION get_folder_item_count(f_id uuid)
   RETURNS integer
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path = public
   AS $$
     SELECT COUNT(*)::integer
     FROM folder_projects
     WHERE folder_id = f_id;
   $$;
   ```

## Troubleshooting

Common issues and their solutions:

- **Authentication issues**: Ensure your Supabase URL and anon key are correctly set in the `.env` file
- **Permission errors when creating projects**: This is due to Row Level Security (RLS) policy issues in Supabase. To fix:
  1. Disable RLS on the relevant tables using SQL in the Supabase dashboard:
     ```sql
     ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.project_folders DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.folder_projects DISABLE ROW LEVEL SECURITY;
     ```
  2. Log out and log back in to refresh your session token
- **Blank pages after folder creation**: Ensure the Projects page component has proper null checks in its filter logic
- **Infinite API calls**: Check that hook functions are properly memoized with useCallback and that useEffect dependencies are correct
- **State updates after unmounting**: Look for missing cleanup in useEffect hooks or implement the isMounted flag pattern
- **Navigation context issues**: Ensure proper URL parameters are being extracted and used in components
- **Build failures**: Make sure all dependencies are installed with `npm install`
- **Database connection issues**: Check your Supabase project settings and ensure the database is online
- **Routing issues**: If pages don't load correctly, check that all components are properly imported and routes are correctly defined in App.tsx
- **RPC function errors**: Check that the get_folder_item_count function is correctly defined in your Supabase database

## Roadmap

Future planned features include:
- Mobile application
- AI-powered analysis enhancements
- Collaboration features
- Export options to various formats

## Contributing

Please follow the established coding conventions and project structure when contributing to this project.

## License

MIT License

## Projects and Organization

The Projects feature allows users to organize their content into folders:

- Create projects to group related content
- Add products, brain dumps, and other content to projects
- Search and filter content within projects
- Manage project details and content
- Consistent UI between Products and Projects pages
- Easy content addition with the "Add to Project" modal
- Support for different content types within the same project