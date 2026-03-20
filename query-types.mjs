import { createClient } from '@supabase/supabase-js';

// Credentials must come from environment variables. Do NOT hardcode secrets.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials: set SUPABASE_URL and SUPABASE_KEY (or VITE_SUPABASE_* variants)');
}

console.log('Testing with direct Supabase client...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present (service role or anon)' : 'Missing');

// Create a direct client with the supabase key
const supabase = createClient(supabaseUrl, supabaseKey);

async function runQueries() {
  try {
    console.log('\n=== Checking if prompts_type table exists ===');
    const tables = await supabase.from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'prompts_type');
    
    console.log('Table check result:', tables);
    
    console.log('\n=== Querying prompts_type table ===');
    const { data, error } = await supabase
      .from('prompts_type')
      .select('*')
      .order('id');
    
    if (error) {
      console.error('Error querying prompts_type:', error);
      
      // Try to check if the table exists by a more direct method
      const { count, error: countError } = await supabase
        .from('prompts_type')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error checking prompts_type count:', countError);
      } else {
        console.log('Table exists but count query returned:', count);
      }
    } else {
      console.log('Results from prompts_type:', data);
      console.log(`Found ${data.length} records in table`);
      
      // Show each record
      data.forEach(record => {
        console.log(`ID: ${record.id}, Nome: ${record.nome}`);
      });
    }
    
    // Try another table to verify connectivity
    console.log('\n=== Testing query on a different table (clientes_info) ===');
    const { data: clientData, error: clientError } = await supabase
      .from('clientes_info')
      .select('count(*)')
      .limit(1);
    
    if (clientError) {
      console.error('Error querying clientes_info:', clientError);
    } else {
      console.log('Successfully queried clientes_info table:', clientData);
    }
  } catch (err) {
    console.error('Exception during queries:', err);
  }
}

runQueries(); 