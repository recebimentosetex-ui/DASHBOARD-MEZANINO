import { createClient } from '@supabase/supabase-js';

// Função para buscar variáveis de ambiente (compatível com Vite e Create React App)
const getEnv = (key: string, viteKey: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[viteKey];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return '';
};

// Busca as chaves. Se não encontrar, o app abre mas não conecta ao DB (fica vazio).
const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('REACT_APP_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
