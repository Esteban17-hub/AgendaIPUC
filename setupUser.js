import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bsqyxxtmzdfqvgulbenoj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXl4dG16ZGZxdmd1bGJlbm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgwNDUsImV4cCI6MjEwMTc4NDA0NX0.61WEmE4UG90PwjPcAHNkWk4e9L-It-LZBur2WcbfRZ8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Intentando crear usuario...');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@agendaipuc.com',
    password: 'AgendaIpuc2026!',
    options: {
      data: {
        full_name: 'Administrador Agenda Ipuc'
      }
    }
  });

  if (error) {
    console.error('Error al crear usuario:', error.message);
  } else {
    console.log('Usuario creado (o ya existía).');
    if (data?.user?.identities?.length === 0) {
       console.log('Nota: El usuario ya existía previamente.');
    }
  }
}

setup();
