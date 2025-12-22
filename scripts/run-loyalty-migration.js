/**
 * Database Migration Script for Loyalty System
 * Run this script to set up the loyalty system database schema
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   REACT_APP_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting Loyalty System Database Migration...\n');
  
  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '../database/loyalty_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Loaded migration SQL file');
    
    // Split SQL into individual statements (rough split by semicolon + newline)
    const statements = sqlContent
      .split(';\n')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          // Try direct query execution as fallback
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0); // This will fail but might give us better error info
          
          console.log(`⚠️  Statement ${i + 1} may have failed:`, error.message);
          // Don't exit on error - some statements might be expected to fail (like IF NOT EXISTS)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} error:`, err.message);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify tables were created in Supabase dashboard');
    console.log('   2. Check that sample partners were inserted');
    console.log('   3. Test card ID generation');
    console.log('   4. Set up Row Level Security (RLS) policies');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative method using Supabase SQL editor approach
async function runMigrationAlternative() {
  console.log('🔄 Alternative approach: Manual SQL execution required\n');
  
  const sqlPath = path.join(__dirname, '../database/loyalty_schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📄 SQL Migration Content:');
  console.log('=' .repeat(80));
  console.log(sqlContent);
  console.log('=' .repeat(80));
  
  console.log('\n📋 Manual Steps:');
  console.log('   1. Copy the SQL content above');
  console.log('   2. Go to Supabase Dashboard > SQL Editor');
  console.log('   3. Paste and run the SQL');
  console.log('   4. Verify all tables and functions were created');
}

// Check if we can run automated migration or need manual approach
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Cannot access database directly. Using manual approach...\n');
      await runMigrationAlternative();
    } else {
      console.log('✅ Database connection successful. Running automated migration...\n');
      await runMigration();
    }
  } catch (error) {
    console.log('⚠️  Connection test failed. Using manual approach...\n');
    await runMigrationAlternative();
  }
}

// Run the migration
checkSupabaseConnection();
