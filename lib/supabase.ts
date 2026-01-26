import { createClient } from '@supabase/supabase-js';

// Função segura para buscar variáveis de ambiente
const getEnv = (key: string, viteKey: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey];
    }
  } catch (e) {
    // Ignora erro se import.meta não existir
  }

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    // Ignora erro se process não existir
  }
  
  return '';
};

const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('REACT_APP_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

// Se não houver URL, usamos um placeholder válido sintaticamente para não crashar o app na inicialização.
// O App.tsx vai detectar que a conexão falhou depois.
const validUrl = supabaseUrl && supabaseUrl.startsWith('http') 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co';

const validKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(validUrl, validKey);