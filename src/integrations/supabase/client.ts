// VERSÃO NOVA E CORRIGIDA - COM TIPOS
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Importa o "mapa" que acabamos de gerar

// Pega as variáveis de ambiente (verifique se estão corretas no seu arquivo .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Cria o cliente Supabase, passando o "mapa" de tipos para ele
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);