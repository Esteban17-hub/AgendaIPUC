import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testAll() {
  const congId = 'cong-zuluaga';
  
  const tables = [
    { name: 'congregations', data: { id: `test-${Date.now()}`, name: 'Test', city: 'Test' } },
    { name: 'users', data: { id: `test-${Date.now()}`, congregationId: congId, name: 'T', role: 'VISITA', pin: '123', createdAt: Date.now() } },
    { name: 'committees', data: { id: `test-${Date.now()}`, congregationId: congId, name: 'T', treasurer: 'T', balance: 0, isOfferingOnly: false, updatedAt: Date.now() } },
    { name: 'movements', data: { id: `test-${Date.now()}`, congregationId: congId, committeeId: 'com-zuluaga-0', type: 'INGRESO', amount: 1, description: 'T', date: '2024', annulled: false, annulReason: '', createdAt: Date.now() } },
    { name: 'tithes', data: { id: `test-${Date.now()}`, congregationId: congId, date: '2024', month: '01', year: 2024, grossIncome: 0, nationalPercentage: 0, nationalShare: 0, localShare: 0, pastorTithe: 0, pastorTithePercentage: 0, netIncome: 0, pastorAllocation: 0, pastorAllocationPercentage: 0, balanceGroup: 'T', archived: false, createdAt: Date.now() } },
    { name: 'offerings', data: { id: `test-${Date.now()}`, congregationId: congId, destinationCommitteeId: 'com-zuluaga-0', type: 'OFRENDA', amount: 1, description: 'T', date: '2024', createdAt: Date.now() } },
    { name: 'projects', data: { id: `test-${Date.now()}`, congregationId: congId, name: 'T', description: 'T', targetAmount: 0, totalRaised: 0, status: 'ACTIVO', createdAt: Date.now() } },
    { name: 'votes', data: { id: `test-${Date.now()}`, projectId: 'proj-test', voterName: 'T', amount: 1, date: '2024', createdAt: Date.now() } }
  ];

  for (const t of tables) {
    const { error } = await supabase.from(t.name).upsert(t.data);
    if (error) {
      console.error(`[FAIL] ${t.name}:`, error.message);
    } else {
      console.log(`[OK] ${t.name}`);
      await supabase.from(t.name).delete().match({ id: t.data.id });
    }
  }
}
testAll();
