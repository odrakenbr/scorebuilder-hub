// ARQUIVO: src/components/ProtectedRoute.tsx (VERSÃO ATUALIZADA)

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Acessamos a 'session' que o seu AuthContext provê.
  // Se o seu contexto usa 'user' em vez de 'session', troque a variável abaixo.
  const { session } = useAuth(); 
  const location = useLocation();

  // A lógica agora é mais simples:
  // Se não há sessão, o usuário não está logado. Redireciona para o login.
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se existe uma sessão, o usuário está logado. Permite o acesso.
  return <>{children}</>;
};

export default ProtectedRoute;