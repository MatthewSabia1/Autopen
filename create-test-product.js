// Script to create a test product in the creator_contents table
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and key must be set in environment variables')
  process.exit(1)
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey)

// Main function to create a test product
async function createTestProduct() {
  try {
    console.log('Getting user...')
    
    // First verify we have at least one user
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1)
    
    if (usersError) {
      console.error('Error accessing users:', usersError.message)
      
      // Try a different query to access users
      const { data: usersAlt, error: usersAltError } = await supabase.auth.admin.listUsers()
      
      if (usersAltError) {
        console.error('Error accessing users with admin API:', usersAltError.message)
        console.log('Creating direct insert with admin rights...')
        
        // Create a test product with direct insert
        const { data: product, error: productError } = await supabase
          .from('creator_contents')
          .insert({
            title: 'Test Product',
            description: 'This is a test product created by script',
            type: 'ebook',
            status: 'draft',
            user_id: '00000000-0000-0000-0000-000000000000', // Placeholder user ID
            metadata: {
              test: true,
              created_by: 'script'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
        
        if (productError) {
          console.error('Error creating test product:', productError.message)
        } else {
          console.log('Test product created:', product)
        }
        
        return
      }
      
      console.log('Found users via admin API:', usersAlt)
      if (usersAlt && usersAlt.users && usersAlt.users.length > 0) {
        const userId = usersAlt.users[0].id
        console.log('Using user ID:', userId)
        
        // Create a test product
        const { data: product, error: productError } = await supabase
          .from('creator_contents')
          .insert({
            title: 'Test Product',
            description: 'This is a test product created by script',
            type: 'ebook',
            status: 'draft',
            user_id: userId,
            metadata: {
              test: true,
              created_by: 'script'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
        
        if (productError) {
          console.error('Error creating test product:', productError.message)
        } else {
          console.log('Test product created:', product)
        }
      } else {
        console.error('No users found in the database')
      }
      
      return
    }
    
    console.log('Found users:', users)
    if (users && users.length > 0) {
      const userId = users[0].id
      console.log('Using user ID:', userId)
      
      // Create a test product
      const { data: product, error: productError } = await supabase
        .from('creator_contents')
        .insert({
          title: 'Test Product',
          description: 'This is a test product created by script',
          type: 'ebook',
          status: 'draft',
          user_id: userId,
          metadata: {
            test: true,
            created_by: 'script'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (productError) {
        console.error('Error creating test product:', productError.message)
      } else {
        console.log('Test product created:', product)
      }
    } else {
      console.error('No users found in the database')
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the function
createTestProduct()
  .then(() => console.log('Script completed'))
  .catch(error => console.error('Script failed:', error))