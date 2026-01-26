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
// Utiliza as credenciais fornecidas
const SUPABASE_URL = getEnv('REACT_APP_SUPABASE_URL') || 
                     getEnv('NEXT_PUBLIC_SUPABASE_URL') || 
                     'https://plurxwwsgxoddqpllesb.supabase.co';

const SUPABASE_ANON_KEY = getEnv('REACT_APP_SUPABASE_ANON_KEY') || 
                          getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
                          'sb_publishable_IYBrIjctzuYTSV-1KeAc5Q_RGDbo2dI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);