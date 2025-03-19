# CLAUDE.md - Autopen Project Guide

## Commands
- Build: `npm run build` (Vite)
- Dev: `npm run dev` (localhost server)
- Lint: `npm run lint` (ESLint)
- Preview: `npm run preview` (preview build)
- Fix RLS: `npm run fix-rls` (Supabase)

## Code Style
- TypeScript: Use strict mode with explicit types
- Components: React functional components with hooks
- Styling: Tailwind with custom theme colors
- Imports: Group by external/internal/types
- Naming: PascalCase for components, camelCase for functions/variables
- Error handling: Try/catch with explicit error types
- State management: React Context for global state
- File structure: Feature-based organization in src/components/
- Form handling: Use react-hook-form for form state
- Authentication: Supabase Auth context patterns

## Project Architecture
- Frontend: React/TypeScript with Vite bundler
- Backend: Supabase (PostgreSQL + Auth)
- Routing: react-router-dom v7
- UI: Custom Tailwind components with Lucide icons