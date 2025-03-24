# eBook Feature - Technical Implementation

## Overview

This document provides technical details of the eBook creator feature implementation, including database schema, frontend components, backend integration, and security considerations.

## Database Schema

### Tables and Columns

**creator_contents table**
- `id`: UUID (primary key)
- `created_at`: timestamp with time zone (default: now())
- `title`: text
- `description`: text
- `type`: text (e.g., 'ebook', 'course', 'blog', etc.)
- `content`: JSONB (stores the complete content structure)
- `status`: text (e.g., 'draft', 'published')
- `user_id`: UUID (foreign key to auth.users)
- `metadata`: JSONB (stores additional metadata)
- `workflow_step`: text (tracks current step in the workflow)
- `workflow_progress`: JSONB (stores detailed progress information)
- `versions`: JSONB (array of content versions with timestamps)

### JSONB Content Structure for eBooks

```json
{
  "tableOfContents": [
    {
      "id": "chapter-1",
      "title": "Chapter 1: Introduction",
      "order": 1
    },
    {
      "id": "chapter-2",
      "title": "Chapter 2: Main Concepts",
      "order": 2
    }
  ],
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Chapter 1: Introduction",
      "content": "Chapter content goes here...",
      "order": 1
    },
    {
      "id": "chapter-2",
      "title": "Chapter 2: Main Concepts",
      "content": "Chapter content goes here...",
      "order": 2
    }
  ],
  "introduction": "Introduction content for the eBook...",
  "conclusion": "Conclusion content for the eBook..."
}
```

### Workflow Progress Structure

```json
{
  "currentStep": "generate-title",
  "completedSteps": ["input-handling"],
  "generatedTitle": "Sample eBook Title",
  "rawData": "Original user input or data...",
  "lastUpdated": "2023-06-01T12:00:00Z"
}
```

## Row Level Security Policies

The following RLS policies are implemented for the `creator_contents` table:

### Select Policy
```sql
CREATE POLICY "creator_contents_select_policy"
ON public.creator_contents
FOR SELECT
TO authenticated, anon, service_role
USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
);
```

### Insert Policy
```sql
CREATE POLICY "creator_contents_insert_policy"
ON public.creator_contents
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (true);
```

### Update Policy
```sql
CREATE POLICY "creator_contents_update_policy"
ON public.creator_contents
FOR UPDATE
TO authenticated, service_role
USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
);
```

### Delete Policy
```sql
CREATE POLICY "creator_contents_delete_policy"
ON public.creator_contents
FOR DELETE
TO authenticated, service_role
USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
);
```

## Security Considerations

### Bypass Function for RLS Issues

A Postgres function `insert_creator_content` is implemented to bypass RLS issues when creating content:

```sql
CREATE OR REPLACE FUNCTION public.insert_creator_content(content_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
    result JSONB;
    auth_id UUID;
    debug_info JSONB;
BEGIN
    -- Get the authenticated user's ID
    auth_id := auth.uid();
    
    IF auth_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Ensure user_id is set in the content data
    content_data := content_data || jsonb_build_object('user_id', auth_id);
    
    -- Insert the content
    INSERT INTO public.creator_contents (
        title, description, type, content, status, user_id, 
        metadata, workflow_step, workflow_progress, versions
    )
    VALUES (
        content_data->>'title',
        content_data->>'description',
        content_data->>'type',
        COALESCE(content_data->'content', '{}'::jsonb),
        COALESCE(content_data->>'status', 'draft'),
        auth_id,
        COALESCE(content_data->'metadata', '{}'::jsonb),
        content_data->>'workflow_step',
        content_data->'workflow_progress',
        COALESCE(content_data->'versions', '[]'::jsonb)
    )
    RETURNING id INTO new_id;
    
    -- Get the complete record to return
    SELECT to_jsonb(c) INTO result
    FROM public.creator_contents c
    WHERE c.id = new_id;
    
    RETURN result;
END;
$$;
```

### Debug Auth Function

A debug function is provided to help troubleshoot authentication issues:

```sql
CREATE OR REPLACE FUNCTION public.debug_auth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'uid', auth.uid(),
    'role', auth.role(),
    'email', current_setting('request.jwt.claims', true)::jsonb->'email',
    'app_metadata', current_setting('request.jwt.claims', true)::jsonb->'app_metadata',
    'user_metadata', current_setting('request.jwt.claims', true)::jsonb->'user_metadata',
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;
```

## Frontend Implementation

### Key React Hooks

1. **useEbookCreator**: The main hook for eBook creation functionality
   - Manages eBook state, content loading, and saving
   - Handles AI integration for content generation
   - Tracks workflow progression

2. **useCreator**: Base hook for all creator features
   - Handles content fetching, creation, and updates
   - Manages offline/online state
   - Implements caching for better performance

### Core Components

1. **EbookWorkflow.tsx**: The main workflow component that orchestrates the eBook creation process
2. **WorkflowProgress.tsx**: Visual representation of workflow steps and progress
3. **Step Components**:
   - InputStep.tsx: Handles raw data input
   - TitleStep.tsx: Title generation and editing
   - TOCStep.tsx: Table of contents management
   - ChapterStep.tsx: Chapter content generation
   - IntroductionStep.tsx & ConclusionStep.tsx: Generate intro and conclusion
   - DraftStep.tsx: Assembles the complete eBook draft
   - ReviewStep.tsx: AI-driven review and revision
   - PDFStep.tsx: Final PDF generation

## AI Integration

### OpenRouter Integration

The eBook workflow integrates with OpenRouter to access various AI models for different generation tasks:

1. **Title Generation**: Uses google/gemma-3-12b-it:free
2. **Table of Contents**: Uses deepseek/deepseek-r1-zero:free
3. **Chapter Content**: Uses deepseek/deepseek-r1-zero:free
4. **Introduction and Conclusion**: Uses google/gemma-3-12b-it:free
5. **AI Review**: Uses deepseek/deepseek-r1-zero:free

### Prompt Templates

Each generation step uses specifically crafted prompts as outlined in the workflow documentation. These prompts ensure high-quality, relevant content tailored to each section's requirements.

## Error Handling and Robustness

### Database Error Handling

1. **RLS Fallback**: If standard inserts fail due to RLS issues, the system falls back to using the `insert_creator_content` stored procedure
2. **Connectivity Checks**: The Supabase client includes advanced connectivity checking and session management
3. **Automatic Token Refresh**: Authentication tokens are automatically refreshed when 401 errors are encountered

### UI Error Handling

1. Each component includes proper loading states and error handling
2. Failed AI generations can be retried
3. Manual editing is always available as a fallback option

## Known Issues and Mitigations

### Permission Errors During Content Creation

**Issue**: Users may encounter "Permission error" with 401 status code when creating content.

**Root Cause**: Row Level Security (RLS) policy for INSERT operations on creator_contents table is restrictive.

**Mitigations**:
1. Permissive INSERT policy has been implemented (`WITH CHECK (true)`)
2. Fallback stored procedure (`insert_creator_content`) bypasses RLS as a SECURITY DEFINER function
3. Enhanced error handling in CreateContentModal with specific messaging for RLS errors
4. Improved Supabase client with automatic session refresh

## Future Enhancements

1. **Collaborative Editing**: Add real-time collaboration features using Supabase Realtime
2. **Version Control**: Implement a more robust version control system for eBook drafts
3. **Image Management**: Add support for image uploads and embedding in eBooks
4. **Enhanced Templates**: Provide pre-built templates for different eBook genres
5. **Export Formats**: Support additional export formats beyond PDF (EPUB, MOBI, etc.) 