// ARQUIVO: src/pages/Dashboard.tsx (VERSÃO CORRIGIDA)

import { useState, useEffect } from "react"; // Adicionado useEffect
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client"; // Importa o cliente Supabase
import { useToast } from "@/hooks/use-toast"; // Importa o hook de notificação

import { 
  Plus, Eye, Edit, Trash2, TrendingUp, Users, Target, BarChart3,
  ExternalLink, LogOut
} from "lucide-react";

// Criamos uma interface para definir o formato dos dados que virão do Supabase
interface FormWithSubmissions {
  id: string;
  client_name: string;
  subdomain: string;
  score_threshold: number;
  is_active: boolean;
  submission_count: number;
}

interface KpiData {
  total_forms: number;
  active_forms: number;
  total_submissions: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  // Substituímos o mock data por estados que receberão os dados reais do Supabase
  const [forms, setForms] = useState<FormWithSubmissions[]>([]);
  const [kpis, setKpis] = useState<KpiData>({ total_forms: 0, active_forms: 0, total_submissions: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // useEffect é usado para buscar os dados assim que a página carrega
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Chamamos as duas funções RPC que criamos no Supabase
      const kpisPromise = supabase.rpc('get_dashboard_kpis').single();
      const formsPromise = supabase.rpc('get_forms_with_submission_counts');

      // Executamos as duas chamadas em paralelo para mais performance
      const [kpisResult, formsResult] = await Promise.all([kpisPromise, formsPromise]);

      if (kpisResult.error) {
        console.error("Erro ao buscar KPIs:", kpisResult.error);
        toast({ title: "Erro de Rede", description: "Não foi possível carregar os dados do dashboard.", variant: "destructive" });
      } else {
        setKpis(kpisResult.data as KpiData);
      }

      if (formsResult.error) {
        console.error("Erro ao buscar formulários:", formsResult.error);
      } else {
        setForms(formsResult.data as FormWithSubmissions[]);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [toast]); // Adicionado toast como dependência

  const handleViewForm = (subdomain: string) => {
    // Esta nova lógica constrói a URL correta para o ambiente atual.
    // window.location.origin pega a base da URL atual
    // (ex: "http://localhost:5173" ou "https://seu-projeto.vercel.app")
    const url = `${window.location.origin}/form/${subdomain}`;
    
    // Abre a URL em uma nova aba
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEditForm = (id: string) => {
    navigate(`/forms/edit/${id}`);
  };

  const handleCreateForm = () => {
    navigate("/forms/new");
  };

  // Lógica de exclusão IMPLEMENTADA
  const handleDeleteForm = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este formulário? Todos os dados e submissões serão perdidos permanentemente.')) {
      return;
    }
    const { error } = await supabase.from('forms').delete().match({ id });

    if (error) {
      console.error("Erro ao excluir formulário:", error.message);
      toast({ title: "Erro!", description: error.message, variant: "destructive" });
    } else {
      // Remove o formulário da tela instantaneamente e atualiza os KPIs
      setForms(prevForms => prevForms.filter(form => form.id !== id));
      setKpis(prevKpis => ({ ...prevKpis, total_forms: prevKpis.total_forms - 1 }));
      toast({ title: "Sucesso!", description: "Formulário excluído." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header (sem alterações no JSX) */}
      <div className="bg-white border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">LeadScorer Pro</h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="hero" size="lg" onClick={handleCreateForm} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Novo Formulário
              </Button>
              <Button variant="outline" size="lg" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - AGORA COM DADOS REAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-medium bg-gradient-primary text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total de Formulários</p>
                  <p className="text-3xl font-bold">{kpis.total_forms}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medium bg-gradient-accent text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Formulários Ativos</p>
                  <p className="text-3xl font-bold">{kpis.active_forms}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medium bg-gradient-success text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total de Submissões</p>
                  <p className="text-3xl font-bold">{kpis.total_submissions}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms Table - AGORA COM DADOS REAIS */}
        <Card className="border-0 shadow-medium">
          <CardHeader>
            <CardTitle className="text-xl">Seus Formulários</CardTitle>
            <CardDescription>
              Gerencie todos os formulários de lead scoring dos seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forms.map((form) => (
                <div 
                  key={form.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{form.client_name}</h3>
                      <Badge variant={form.is_active ? "default" : "secondary"}>
                        {form.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {form.subdomain}.leadscorer.com
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Score mínimo: {form.score_threshold}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {form.submission_count} submissões
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewForm(form.subdomain)} className="gap-2">
                      <Eye className="w-3 h-3" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditForm(form.id)} className="gap-2">
                      <Edit className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteForm(form.id)} className="gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
              
              {forms.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhum formulário criado ainda
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Comece criando seu primeiro formulário de lead scoring
                  </p>
                  <Button variant="hero" onClick={handleCreateForm} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Primeiro Formulário
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;