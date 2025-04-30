-- 1. Create the notifications table
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NULL, -- Null indicates unread
    notification_type TEXT, -- Optional: e.g., 'new_message', 'system_alert', 'mention'
    target_url TEXT, -- Optional: URL to navigate to when notification is clicked
    CONSTRAINT user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Optional: Add index for faster querying by user_id
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Add comments for clarity
COMMENT ON TABLE public.notifications IS 'Stores user notifications.';
COMMENT ON COLUMN public.notifications.read_at IS 'Timestamp when the notification was read. NULL means unread.';
COMMENT ON COLUMN public.notifications.notification_type IS 'Category or type of the notification.';
COMMENT ON COLUMN public.notifications.target_url IS 'URL associated with the notification action.';


-- 2. Enable Row Level Security (RLS) - IMPORTANT for security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Policy: Users can view their own notifications
CREATE POLICY "Allow users to view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow service_role or backend to insert notifications
-- Note: This assumes notifications are created server-side (e.g., via Edge Functions).
-- If client-side insertion is needed, adjust this policy accordingly.
CREATE POLICY "Allow service role to insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Policy: Users can update the read_at status of their own notifications
CREATE POLICY "Allow users to mark their own notifications as read"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); -- Ensures users can only update their own notifications


-- 4. Enable Realtime for the notifications table
-- This command tells Supabase's publication to include the 'notifications' table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
