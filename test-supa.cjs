const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sbzwjddntsrbnwirrtzi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8');

async function check() {
  console.log("Checking movements...");
  const { data, error } = await supabase.from('movements').select('*').order('createdAt', { ascending: false }).limit(3);
  console.log('Movements:', error || data);
}
check();
