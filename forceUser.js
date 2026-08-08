import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bsqyxxtmzdfqvgulbenoj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXl4dG16ZGZxdmd1bGJlbm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgwNDUsImV4cCI6MjEwMTc4NDA0NX0.61WEmE4UG90PwjPcAHNkWk4e9L-It-LZBur2WcbfRZ8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function attemptRegistration() {
  console.log('1. Intentando registrar usuario admin@ipuc.com con 123456...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'admin@ipuc.com',
    password: '123456',
    options: {
      data: {
        full_name: 'Admin IPUC'
      }
    }
  });

  if (signUpError) {
    console.error('❌ Error en el registro:', signUpError.message);
  } else {
    console.log('✅ Registro exitoso o el usuario ya existía.');
  }

  console.log('\n2. Intentando iniciar sesión...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@ipuc.com',
    password: '123456'
  });

  if (signInError) {
    console.error('❌ Error al iniciar sesión:', signInError.message);
  } else {
    console.log('✅ Inicio de sesión exitoso. JWT obtenido.');
  }
}

attemptRegistration();
