const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing connection...');
  try {
    const { data, error } = await supabase.from('congregations').select('*').limit(1);
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Data:', data);
    }
  } catch (e) {
    console.log('Exception:', e);
  }
}

test();
