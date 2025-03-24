/*
  # Create test user

  1. Creates a test user in the auth.users table (email: test@example.com, password: password123)
  2. This will allow us to test login without needing to go through the signup process
*/

-- This function will insert a test user into the auth.users table
DO $$
DECLARE
  test_user_exists boolean;
BEGIN
  -- Check if the test user already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'test@example.com'
  ) INTO test_user_exists;

  -- Only insert the test user if it doesn't already exist
  IF NOT test_user_exists THEN
    -- Insert a test user with email 'test@example.com' and password 'password123'
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_sent_at,
      last_sign_in_at
    ) 
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'test@example.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      '',
      now(),
      now(),
      now(),
      now()
    );
  END IF;
END $$;