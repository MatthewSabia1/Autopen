# User Settings Page

The User Settings page allows users to manage their profile information, including:

- Uploading a profile picture
- Updating their username
- Editing their bio

## Implementation Details

### Supabase Integration

The settings page is fully integrated with Supabase:

1. **Authentication**: Uses the `useAuth` hook from `supabase/auth.tsx`
2. **Profile Management**: Uses functions from `supabase/profile.ts`
3. **Image Storage**: Uses Supabase Storage through `supabase/storage.ts`

### Profile Image Display

Profile images are displayed in multiple locations:

1. **Settings Page**: Main profile image with upload functionality
2. **Header Navigation**: User dropdown in the top-right corner
3. **Sidebar**: User information at the bottom of the sidebar

All image displays include proper error handling and fallbacks to user initials when images are unavailable or fail to load.

### Database Structure

The system uses a `profiles` table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Storage Configuration

Profile images are stored in a Supabase Storage bucket named `profile-images`. This bucket:

- Is publicly accessible for reading (so profile images can be displayed)
- Has row-level security (RLS) to ensure users can only modify their own images
- Organizes files by user ID (e.g., `{user_id}/profile-{timestamp}`)
- Has file size limits (2MB) and allowed MIME types

## User Flow

1. When a user first accesses the settings page, their profile is loaded from Supabase or created if it doesn't exist
2. Users can:
   - Edit their username and bio
   - Upload a profile picture (limited to 2MB, image files only)
3. All changes are persisted to Supabase in real-time
4. User feedback is provided via toast notifications and status messages
5. Profile images are immediately reflected in the header navigation and sidebar after upload

## Offline Handling

The settings page includes offline detection:

- When offline, editing is disabled
- Image upload is prevented when offline
- Visual indicators show the offline state

## Error Handling

All operations include comprehensive error handling:

- Failed image uploads provide clear error messages
- Database operation failures are caught and displayed
- Form validation prevents invalid submissions
- Image loading errors show a placeholder with appropriate messaging
- Avatar fallbacks display user initials when images fail to load

## Troubleshooting

### Profile Image Upload Issues

If profile images upload successfully but don't display correctly:

1. **Check CORS Settings**: Make sure the Supabase project has CORS configured to allow requests from your application domain
   - Go to Supabase Dashboard > Project Settings > API > CORS
   - Add your application domain to the allowed origins
   - Enable "Allow credentials" and "Expose content disposition header"

2. **Image Handling**: The application uses ArrayBuffer for reliable image uploads, which helps prevent common issues with broken images

3. **Cache Busting**: A timestamp parameter is added to image URLs to prevent browser caching issues

4. **Content Type**: Make sure the correct content type is being sent with the upload

5. **Header Display Issues**: If images appear in settings but not in the header, ensure the `UserNavDropdown` component is receiving the profile data correctly from the Auth context

## Related Files

- `src/components/pages/settings.tsx`: Main settings page component
- `src/components/layout/UserNavDropdown.tsx`: Navigation dropdown with profile image
- `src/components/layout/DashboardLayout.tsx`: Layout with sidebar profile display
- `supabase/profile.ts`: Profile management functions
- `supabase/storage.ts`: Image upload and management functions
- `supabase/auth.tsx`: Auth context with profile information
- `supabase/migrations/20240325_profiles_and_storage.sql`: Database setup
- `supabase/setup_storage.sql`: Manual storage setup instructions
- `src/types/database.types.ts`: TypeScript types for database schema 