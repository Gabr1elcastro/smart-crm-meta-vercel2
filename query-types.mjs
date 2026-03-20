import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials for direct testing
// These are the same as in src/test-supabase.js
const supabaseUrl = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNjYzMjk2MCwiZXhwIjoyMDIyMjA4OTYwfQ.Ry_xGgHVZPKGQOJOBNB4E_LWBGQkWOYxgXWNXHqXEtE';

console.log('Testing with direct Supabase client...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present (service role)' : 'Missing');

// Create a direct client with the service role key
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