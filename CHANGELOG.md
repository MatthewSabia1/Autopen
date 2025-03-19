# Changelog

All notable changes to the Autopen project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Added quick action buttons to Projects table including View, Edit, and Delete buttons
- Implemented confirmation modal for project deletion with options to delete associated content
- Added ability to delete just the project or project with all associated content (Brain Dumps, Products, etc.)
- Added Projects page as a new folder and organization system for Brain Dump outputs and Products
- Created database schema for project folders including project_folders and folder_projects tables
- Implemented folder-based organization for user content
- Added ability to create and manage folders for better content organization
- Added grid and list view options for Projects page
- Search functionality across folders and projects
- Implemented real-time counting of items in folders
- Created Row Level Security policies for the new tables
- Implemented React Router for proper URL-based navigation
- Each page now shows as its own URL in the browser address bar
- Browser's forward and back buttons now work correctly with the application
- Added protected routes to redirect unauthenticated users
- Route parameter support for dynamic content pages (project detail, creator detail)
- Created migration script for creator_contents table to support AI content generation
- Implemented real-time updates for products list using Supabase subscriptions
- Added all six content types to Create AI Content modal (E-Book, Online Course, Blog Post, Video Script, Newsletter, Social Media)
- Added proper folder-to-project navigation with context preservation (navigating back to the correct folder)
- Implemented proper cleanup for useEffect hooks to prevent memory leaks
- Added debug logging for tracking project fetch operations
- Added AddToProjectModal component for adding different content types to projects
- Enhanced useFolders hook with methods to add/remove different content types
- Added comprehensive real-time subscriptions for folder and folder-project relationships

### Changed
- Enhanced project deletion to allow selective content preservation
- Updated useFolders and useProjects hooks to support content deletion options
- Improved user experience for destructive actions with clear confirmation flows
- Replaced custom NavigationContext with React Router's navigation system
- Updated Header component to use React Router's Link component
- Restructured App.tsx to use Routes and proper route definitions
- Updated all navigation buttons and links across the application
- Standardized URL paths (/dashboard, /brain-dump, /products, etc.)
- Active link highlighting in navigation based on current URL path
- Changed all routes from "/projects" to "/products" for UI consistency
- Renamed "Projects" to "Products" throughout the application
- Improved `ProjectDetail` component to work with both direct and folder navigation
- Enhanced route structure to support `/projects/folder/:folderId/view/:projectId` for viewing projects in context
- Improved error states in project detail view with user-friendly error messages
- Memoized all CRUD operations in hooks to prevent unnecessary rerenders
- Improved Projects page UI to match the styling of Products page for consistency
- Removed grid view from Projects page in favor of a consistent list view
- Removed "Recent Products" section from Projects page
- Updated FolderDetail page with clearer "Add Content" options
- Enhanced project item display with better visual hierarchy and styling
- Standardized modal styling across the application for consistent user experience
- Updated CreateProjectModal to match the styling of CreateContentModal
- Refactored AddToProjectModal with cleaner, consistent styling and improved user interface
- Implemented unified color scheme (amber accents) and component design for all modals
- Enhanced modal loading states with consistent spinners and error handling
- Improved form styling and input validation feedback in all modals

### Fixed
- Fixed projects not appearing in the Projects table until page reload by implementing comprehensive real-time subscriptions
- Added subscriptions to both project_folders and folder_projects tables to ensure consistent state updates
- Improved project creation workflow to properly reflect changes in the UI immediately
- Enhanced the useFolders hook with detailed logging and better state management
- Added multiple fallback strategies to ensure UI consistency with database state
- Fixed new projects not appearing in table until page refresh by enhancing real-time subscription handling
- Improved project creation flow with better state management and multiple refresh strategies
- Enhanced debug logging for real-time events to help diagnose subscription issues
- Added fallback refresh mechanisms when real-time updates fail
- Fixed project deletion error by correcting database table references from non-existent "folder_contents" to actual "folder_projects" table
- Corrected all database schema references to ensure consistency between code and actual database structure
- Fixed race condition in project creation flow
- Corrected folder navigation after creation
- Improved offline detection logic
- Fixed hook cleanup to prevent memory leaks during page transitions
- Resolved authentication token persistence issues
- Fixed back button navigation within creator flow
- Fixed error when adding content to projects (removed non-existent metadata field)
- Fixed folder item count function to use direct query instead of non-existent RPC call
- Improved header navigation to prevent flashing during transitions
- Enhanced SelectContentModal to provide better user feedback
- Removed intrusive alert popup when adding content to projects

Features planned for future releases.

## [0.1.1] - 2023-07-15
### Changed
- Rebranded application from "Textera" to "Autopen"
- Updated all references in the codebase including UI elements, cache keys, and API headers
- Updated documentation to reflect the new brand name

## [0.1.0] - 2023-07-01
Initial development release.

### Added
- Initial project setup with React 18, TypeScript, and Vite
- Supabase integration for authentication and database services:
  - User profiles
  - Project storage
  - Brain dump sessions
  - Analysis results
- TailwindCSS for responsive UI styling
- User authentication system with login, signup, and account management
- Brain Dump feature for capturing user thoughts with real-time processing
- Analysis system for processing user input and categorizing content
- User Dashboard showing:
  - Recent projects
  - Activity statistics
  - Quick actions
- Project management system:
  - Create new projects
  - View existing projects
  - Edit project details
  - Delete projects
- Creator mode with specialized tools for content creation
- Settings interface for:
  - Account preferences
  - Privacy settings
  - Notification controls
- Comprehensive documentation (README.md and CHANGELOG.md)
- Supabase RLS (Row Level Security) configuration scripts for data protection

### Changed
- N/A

### Fixed
- N/A

### Removed
- N/A 

## Types of changes
- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities. 