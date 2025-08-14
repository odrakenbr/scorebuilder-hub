// ARQUIVO: src/contexts/AuthContext.tsx (VERSÃO FINAL E CORRIGIDA)

import { createContext, useContext, useEffect, useState } from 'react';
// Importamos AuthError para usar na tipagem da função signOut
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';

// Definimos o que o nosso contexto vai oferecer
interface AuthContextType {
  session: Session | null;
  user: User | null;
  // ALTERAÇÃO 1: Corrigimos a "promessa" da função signOut
  // Agora ela corresponde exatamente ao que o Supabase retorna.
  signOut: () => Promise<{ error: AuthError | null; }>;
}

// Criamos o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Criamos o nosso Provedor
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão inicial
    const getInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erro ao pegar sessão inicial:", error);
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    // Fica "ouvindo" por mudanças na autenticação (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Limpa o "ouvinte" quando o componente é desmontado
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    signOut: () => supabase.auth.signOut(),
  };

  // Enquanto estiver carregando a sessão inicial, não renderiza o resto do app
  if (isLoading) {
    return null; // Ou um spinner/loading global
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ALTERAÇÃO 2: Desabilitamos a regra do ESLint apenas para a linha abaixo.
// Isso mantém nosso código organizado sem gerar o aviso.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};