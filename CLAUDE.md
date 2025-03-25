# CLAUDE.md - AutopenV3 Project Guide

## Commands
- Build: `npm run build` (TypeScript + Vite)
- Dev server: `npm run dev` (Vite dev server)
- Lint: `npm run lint` (ESLint)
- Preview: `npm run preview` (Preview built app)
- TypeCheck: `tsc` (TypeScript)
- Update Supabase Types: `npm run types:supabase`

## Design System

### Color Palette
- **Primary Accent**: Grayish blue (#738996) - Used for 80% of accent elements, including primary buttons, navigation, and interactive elements
- **Secondary Accent**: Dull yellow (#ccb595) - Used sparingly (20%) for highlights, featured content, and CTAs
- **Text Colors**:
  - Dark: #333333 - Main text color (headings, body text)
  - Light: #666666 - Secondary text (descriptions, labels)
  - Faded: #888888 - Placeholder text and disabled elements
- **Background Colors**:
  - Cream: #FAF9F5 - Main app background
  - Paper: #FFFFFF - Card backgrounds and elevated elements
  - Tertiary: #F1F0EC - Subtle backgrounds, borders, and dividers

### Typography
- Base font size: 112.5% (18px) for enhanced readability
- **Font Families**:
  - Display: "Georgia" - For headings and titles
  - Serif: "Georgia" - For body text and UI elements
  - Sans-serif: "Inter" - Reserved for technical content
  - Monospace: "Consolas" - For code blocks
- **Scale**:
  - h1: 2.25rem/3rem (36px/48px)
  - h2: 1.875rem/2.25rem (30px/36px)
  - h3: 1.5rem/1.875rem (24px/30px)
  - h4: 1.25rem/1.5rem (20px/24px)
  - h5: 1.125rem/1.25rem (18px/20px)
  - h6: 1rem/1.125rem (16px/18px)
  - Body: 1rem/1.5rem (16px/24px)

### Spacing & Layout
- Enhanced padding for all components (minimum 16px)
- Consistent spacing scale following 0.25rem increments
- Increased component sizing for better touch targets
- Button heights: 44px (standard), 36px (small), 56px (large)
- Form elements have consistent heights and padding
- Card and dialog padding: 32px (desktop), 24px (mobile)

### Components

#### Buttons
- **Primary**: Blue accent (#738996) with white text and subtle shadow
- **Secondary**: Outlined blue with hover effects
- **Yellow**: Yellow accent (#ccb595) for CTAs and featured actions
- **Ghost**: Transparent with hover effects
- Height increased to 44px with 20px horizontal padding

#### Form Elements
- Input height: 48px with 16px horizontal padding
- Textarea: Minimum height 80px with 16px padding
- Labels: Medium weight, grayish blue or yellow depending on context
- Internal shadow for text fields
- Focus rings match respective accent colors

#### Cards & Dialogs
- Rounded corners (8px default)
- Subtle shadows with hover states
- Consistent internal spacing (24px/32px)
- Modal sizing enhanced for better readability
- Blue or yellow accent colors for borders and highlights

#### Navigation
- Blue primary color for navigation structure
- Active items highlighted with accent colors
- Hover effects include subtle background changes
- Sidebar uses paper background with border separation

## Code Style
- TypeScript: Strict mode is currently off, but prefer explicit types
- React: Functional components with hooks, useCallback for handlers
- Styling: Tailwind with shadcn/ui components and custom utility classes
- Imports: Group by 1)external 2)internal 3)types, use @/* paths
- Naming: PascalCase for components/types, camelCase for variables/functions
- Error handling: Try/catch with specific error types
- State: React Context API for global state (Auth, Workflow)
- Directory structure: Feature-based (/components/feature/)
- Database: Supabase with proper RLS (Row Level Security)
- Form handling: Use react-hook-form with zod validation

## CSS Conventions
- Use the existing utility classes when possible:
  - `.textera-button-primary`, `.textera-button-secondary`, `.textera-button-yellow`
  - `.textera-input`, `.textera-textarea`, `.textera-input-yellow`
  - `.textera-card`, `.textera-tab`, `.textera-badge`
- Shadow classes: `shadow-blue-sm`, `shadow-blue-md`, `shadow-yellow-sm`
- Use transition classes for interactive elements: `transition-all duration-200`
- Apply `text-white` to all colored buttons for consistency

## Color Usage Guidelines
- Use blue primary accent (#738996) for:
  - Main navigation elements
  - Primary buttons and controls
  - Progress indicators
  - Main UI structure
  - Active state indicators
  
- Use yellow secondary accent (#ccb595) for:
  - Featured content or "special" elements
  - Call-to-action buttons
  - Content type indicators
  - Highlighting selected items
  - Accent elements that need to stand out

## Best Practices
- Keep components small and focused on a single responsibility
- Use TypeScript interfaces for props and state
- Leverage shadcn/ui components with custom style overrides
- Organize feature code in logical directories
- Implement proper error handling for async operations
- Follow React's rules of hooks
- Maintain consistent spacing with the enhanced UI scale
- Apply animation/transitions to all interactive elements
- Always use either the primary or secondary accent color, never introduce additional accent colors
- Ensure shadow effects are consistent with the component's accent color