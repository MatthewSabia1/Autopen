# Integrated eBook Creation Workflow - Project Plan

## Overview
This project integrates the Creator and Brain Dump tools into a single robust workflow focused on eBook creation. The workflow will guide users through a step-by-step process of creating a high-quality eBook using Google Gemini Flash AI assistance.

## Database Schema Changes

### New Tables:
1. `projects` - Store project information
   - id: uuid (PK)
   - user_id: uuid (FK to auth.users)
   - title: text
   - description: text
   - type: text ('ebook', 'online-course', etc.)
   - status: text ('draft', 'in_progress', 'completed')
   - created_at: timestamp
   - updated_at: timestamp

2. `brain_dumps` - Store brain dump data
   - id: uuid (PK)
   - project_id: uuid (FK to projects)
   - raw_content: text
   - analyzed_content: jsonb
   - status: text ('pending', 'analyzing', 'analyzed')
   - created_at: timestamp
   - updated_at: timestamp

3. `brain_dump_files` - Store uploaded files
   - id: uuid (PK)
   - brain_dump_id: uuid (FK to brain_dumps)
   - file_name: text
   - file_type: text
   - file_path: text
   - file_size: int
   - created_at: timestamp

4. `brain_dump_links` - Store links
   - id: uuid (PK)
   - brain_dump_id: uuid (FK to brain_dumps)
   - url: text
   - title: text
   - link_type: text ('youtube', 'webpage')
   - transcript: text
   - created_at: timestamp

5. `ebook_ideas` - Store generated ebook ideas
   - id: uuid (PK)
   - brain_dump_id: uuid (FK to brain_dumps)
   - title: text
   - description: text
   - source_data: text
   - created_at: timestamp

6. `ebooks` - Store generated ebooks
   - id: uuid (PK)
   - project_id: uuid (FK to projects)
   - title: text
   - description: text
   - cover_image_url: text
   - status: text ('generating', 'generated', 'finalized')
   - created_at: timestamp
   - updated_at: timestamp

7. `ebook_chapters` - Store ebook chapters
   - id: uuid (PK)
   - ebook_id: uuid (FK to ebooks)
   - title: text
   - content: text
   - order_index: int
   - status: text ('pending', 'generating', 'generated')
   - created_at: timestamp
   - updated_at: timestamp

## Implementation Steps

### 1. Database Setup ✅
- [x] Review existing database structure
- [x] Create missing database tables in Supabase
- [x] Implement appropriate RLS policies

### 2. Core Component Creation ✅
- [x] Review existing workflow components
- [x] Update workflow context provider
- [x] Implement step management logic

### 3. Creator Tool Enhancement ✅
- [x] Update Creator component UI
- [x] Add project creation with proper database storage
- [x] Implement navigation to Brain Dump step

### 4. Brain Dump Integration ✅
- [x] Enhance Brain Dump to work within workflow
- [x] Add file upload and link processing capabilities
- [x] Implement content analysis with Google Gemini API
- [x] Create idea generation and display functionality

### 5. Idea Selection UI ✅
- [x] Create UI for displaying generated ideas
- [x] Implement idea selection functionality
- [x] Add custom idea creation option

### 6. eBook Generation Process ✅
- [x] Create eBook workflow steps UI
- [x] Implement title and TOC generation
- [x] Create chapter generation system
- [x] Add progress tracking and database persistence

### 7. Google Gemini Integration ✅
- [x] Create API integration service
- [x] Implement strategic prompting system
- [x] Add error handling and retry logic

### 8. Output Formats ✅
- [x] Create PDF generation and preview
- [x] Implement Markdown export functionality
- [x] Add ePub export capabilities

### 9. UI Enhancement ✅
- [x] Create animated workflow transitions
- [x] Add loading indicators for each step
- [x] Make UI responsive and user-friendly
- [x] Implement progress visualization
- [x] Update color scheme to use grayish blue (#738996) and dull yellow (#ccb595)
- [x] Increase overall UI scale for better readability
- [x] Enhance component spacing and visual hierarchy

### 10. Testing & Refinement ✅
- [x] Test end-to-end workflow
- [x] Fix any bugs or issues
- [x] Optimize performance
- [x] Add error handling throughout 
- [x] Verify mobile responsiveness with scaled UI
- [x] Ensure color accessibility standards are met
- [x] Document design system and styling guidelines