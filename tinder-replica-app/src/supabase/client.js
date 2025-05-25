// src/supabase/client.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Pequeña validación para asegurarnos que las variables están cargadas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase URL or Anon Key are missing in environment variables.');
  // En un entorno de producción, podrías considerar lanzar un error o mostrar una página de error.
}

// Crea el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase client initialized.');