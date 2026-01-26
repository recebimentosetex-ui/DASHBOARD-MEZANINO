import { createClient } from '@supabase/supabase-js';

// Função auxiliar para acessar variáveis de ambiente de forma segura
const getEnv = (key: string) => {
  try {
    // Tenta acessar process.env (Node/CRA/Next.js)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignora erros se process não estiver definido
  }
  return undefined;
};

// Configuração do cliente Supabase
// Fallback para uma URL válida (https://...) para evitar o erro "Invalid URL" no construtor
const SUPABASE_URL = getEnv('REACT_APP_SUPABASE_URL') || 
                     getEnv('NEXT_PUBLIC_SUPABASE_URL') || 
                     'https://placeholder.supabase.co';

const SUPABASE_ANON_KEY = getEnv('REACT_APP_SUPABASE_ANON_KEY') || 
                          getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
                          'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);