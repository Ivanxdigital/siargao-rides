#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing required environment variables.')
  console.error('Please make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY set in your .env.local file.')
  process.exit(1)
}

// Initialize Supabase client with service key for admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Read the SQL schema file
const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql')
const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

// Function to execute the SQL schema
async function resetDatabase() {
  console.log('Starting database reset...')
  
  try {
    // Split the SQL into individual statements and execute them
    const statements = schemaSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { query: statement + ';' })
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error)
        // Continue with other statements
      }
    }
    
    console.log('Database reset completed successfully!')
  } catch (error) {
    console.error('Failed to reset database:', error)
    process.exit(1)
  }
}

// Ask for confirmation before proceeding
console.log('WARNING: This will delete all existing data in your Supabase database and recreate all tables.')
console.log('Make sure you have a backup if you need to keep any existing data.')
console.log('Press CTRL+C to cancel or Enter to continue...')

process.stdin.once('data', () => {
  resetDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Unexpected error:', err)
      process.exit(1)
    })
})

// Make sure stdin is in flowing mode
process.stdin.resume() 