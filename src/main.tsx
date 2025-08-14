// ARQUIVO: src/main.tsx (VERSÃO CORRIGIDA)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx'; // Importamos o nosso AuthProvider
import { Toaster } from "@/components/ui/toaster" // Importamos o Toaster para as notificações

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* A mágica acontece aqui. 
      Envolvemos o <App /> com o <AuthProvider />.
      Agora, toda a aplicação (incluindo todas as rotas e páginas)
      está dentro do "sinal de Wi-Fi" da autenticação.
    */}
    <AuthProvider>
      <App />
      <Toaster /> {/* O Toaster também fica aqui para estar disponível globalmente */}
    </AuthProvider>
  </React.StrictMode>,
)