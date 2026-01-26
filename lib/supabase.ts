import { createClient } from '@supabase/supabase-js';

// Tenta obter variável de ambiente (suporta Vite e Create React App)
const getEnv = (key: string, viteKey: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[viteKey];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

// URL do Supabase
const SUPABASE_URL = getEnv('REACT_APP_SUPABASE_URL', 'VITE_SUPABASE_URL') || 
                     'https://plurxwwsgxoddqpllesb.supabase.co';

// Chave Anônima (Anon Key)
const SUPABASE_ANON_KEY = getEnv('REACT_APP_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY') || 
                          'sb_publishable_IYBrIjctzuYTSV-1KeAc5Q_RGDbo2dI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);