import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Fetching valid IDs...');
  const { data: congs } = await supabase.from('congregations').select('id').limit(1);
  const { data: comms } = await supabase.from('committees').select('id').limit(1);
  
  if (!congs.length || !comms.length) {
    return console.error('No congs/comms available for test.');
  }
  
  const congId = congs[0].id;
  const commId = comms[0].id;
  
  console.log(`Using Cong: ${congId}, Comm: ${commId}`);
  
  const testId = `mov-${Date.now()}`;
  const testData = {
    id: testId,
    congregationId: congId,
    committeeId: commId,
    type: 'INGRESO',
    amount: 500,
    description: 'Sync test',
    date: '2024-01-01',
    annulled: false,
    annulReason: '',
    createdAt: Date.now()
  };
  
  console.log('Upserting data:', testData);
  const { error } = await supabase.from('movements').upsert(testData);
  if (error) {
    console.error('UPSERT FAILED:', error);
  } else {
    console.log('UPSERT SUCCESSFUL!');
    await supabase.from('movements').delete().match({ id: testId });
  }
}
testInsert();
