// ARQUIVO: src/App.tsx (VERSÃO SIMPLIFICADA PARA TESTES)

import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FormEditor from './pages/FormEditor';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute'; // Corrigido o caminho
import PublicForm from './pages/PublicForm';

const App = () => {
  // Agora o App só precisa definir as rotas. Sem lógica de hostname.
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA PÚBLICA PARA OS FORMULÁRIOS */}
        {/* O :subdomain é um parâmetro dinâmico que será capturado pelo useParams */}
        <Route path="/form/:subdomain" element={<PublicForm />} />

        {/* ROTAS PROTEGIDAS DO PAINEL ADMIN */}
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/forms/new" 
          element={<ProtectedRoute><FormEditor /></ProtectedRoute>} 
        />
        <Route 
          path="/forms/edit/:id" 
          // O FormEditor já usa useParams para pegar o :id, então isso funciona!
          element={<ProtectedRoute><FormEditor /></ProtectedRoute>} 
        />
        
        {/* Rota raiz e fallback */}
        <Route 
          path="/" 
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;