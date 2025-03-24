# CLAUDE.md - Autopen Project Guide

## Commands
- Build: `npm run build` (Vite)
- Dev: `npm run dev` (localhost server)
- Lint: `npm run lint` (ESLint)
- Preview: `npm run preview` (preview build)
- Fix RLS: `npm run fix-rls` (Supabase)
- Test: None configured (add Jest/Vitest if needed)

## Code Style
- TypeScript: Strict mode with explicit types, no unused vars/params
- React: Functional components with hooks, useCallback for handlers
- Styling: Tailwind with custom theme colors
- Imports: Group by 1)external libs 2)internal modules 3)types
- Naming: PascalCase components, camelCase variables/functions
- Error handling: Try/catch with specific error types, detailed logging
- State: React Context API for global state (Auth, Theme, etc.)
- File structure: Feature-based organization (/components/feature/)
- API pattern: Return {data, error} objects from async functions
- Offline support: Cache results, handle connectivity events

## Project Architecture
- Frontend: React/TypeScript/Vite with strict typechecking
- Backend: Supabase (PostgreSQL + Auth)
- Routing: react-router-dom v7
- UI: Custom Tailwind components with Lucide icons