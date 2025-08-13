import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3,
  ExternalLink,
  LogOut
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  
  // Mock data - will be replaced with Supabase data
  const [forms] = useState([
    {
      id: "1",
      client_name: "Guilherme Planos de Saúde",
      subdomain: "guilherme",
      score_threshold: 60,
      is_active: true,
      submissions_count: 124,
      created_at: "2024-01-15"
    },
    {
      id: "2", 
      client_name: "Maria Consultoria Financeira",
      subdomain: "maria-consultoria",
      score_threshold: 70,
      is_active: true,
      submissions_count: 89,
      created_at: "2024-01-20"
    },
    {
      id: "3",
      client_name: "Pedro Imóveis Premium", 
      subdomain: "pedro-imoveis",
      score_threshold: 80,
      is_active: false,
      submissions_count: 45,
      created_at: "2024-01-25"
    }
  ]);

  const handleViewForm = (subdomain: string) => {
    window.open(`https://${subdomain}.leadscorer.com`, '_blank');
  };

  const handleEditForm = (id: string) => {
    navigate(`/forms/edit/${id}`);
  };

  const handleCreateForm = () => {
    navigate("/forms/new");
  };

  const handleDeleteForm = (id: string) => {
    // TODO: Implement delete with confirmation
    console.log("Delete form:", id);
  };

  const totalSubmissions = forms.reduce((acc, form) => acc + form.submissions_count, 0);
  const activeForms = forms.filter(form => form.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-medium bg-gradient-primary text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total de Formulários</p>
                  <p className="text-3xl font-bold">{forms.length}</p>
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
                  <p className="text-3xl font-bold">{activeForms}</p>
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
                  <p className="text-3xl font-bold">{totalSubmissions}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms Table */}
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
                        {form.submissions_count} submissões
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewForm(form.subdomain)}
                      className="gap-2"
                    >
                      <Eye className="w-3 h-3" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditForm(form.id)}
                      className="gap-2"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteForm(form.id)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
              
              {forms.length === 0 && (
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