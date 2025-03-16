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
- **Creator Mode**: Special tools for content creators
- **Settings**: User account and application settings

## Brain Dump Process

The brain dump feature works as follows:
1. Users input their unstructured thoughts into the text area
2. The system analyzes the content to identify key themes, topics, and patterns
3. Results are displayed in an organized format with categories and priority levels
4. Users can refine the results and save them as projects for future reference

## Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Backend Services**: Supabase
- **Form Handling**: React Hook Form
- **Icons**: Lucide React

## Project Structure

- `src/`: Contains all source code for the application
  - `components/`: Reusable UI components
    - `auth/`: Authentication-related components
    - `creator/`: Creator mode components
    - `projects/`: Project management components
    - `settings/`: User settings components
  - `contexts/`: React context providers
    - `AuthContext`: User authentication state
    - `NavigationContext`: Application navigation state
    - `AnalysisContext`: Brain dump analysis state
  - `hooks/`: Custom React hooks
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
6. Account settings allow users to manage their profile and preferences

## Database Schema

The Supabase database includes the following main tables:
- `profiles`: User profile information
- `projects`: User-created projects 
- `brain_dumps`: User thought input sessions
- `analysis_results`: Processed results from brain dumps
- `project_items`: Individual items within projects

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
3. Configure Row Level Security using the provided scripts:
   ```bash
   npm run fix-rls
   ```

## Troubleshooting

Common issues and their solutions:

- **Authentication issues**: Ensure your Supabase URL and anon key are correctly set in the `.env` file
- **RLS errors**: Run the RLS fix script with `npm run fix-rls`
- **Build failures**: Make sure all dependencies are installed with `npm install`
- **Database connection issues**: Check your Supabase project settings and ensure the database is online

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