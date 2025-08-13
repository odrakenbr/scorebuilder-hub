import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save, 
  Settings, 
  HelpCircle,
  GripVertical,
  X
} from "lucide-react";

interface AnswerOption {
  id: string;
  text: string;
  points: number;
}

interface Question {
  id: string;
  text: string;
  type: "radio" | "select";
  options: AnswerOption[];
}

interface FormData {
  clientName: string;
  subdomain: string;
  scoreThreshold: number;
  redirectGoodUrl: string;
  redirectBadUrl: string;
  isActive: boolean;
  questions: Question[];
}

const FormEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    subdomain: "",
    scoreThreshold: 60,
    redirectGoodUrl: "",
    redirectBadUrl: "",
    isActive: true,
    questions: []
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      type: "radio",
      options: []
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const addOption = (questionId: string) => {
    const newOption: AnswerOption = {
      id: Date.now().toString(),
      text: "",
      points: 0
    };
    
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: [...q.options, newOption] }
          : q
      )
    }));
  };

  const updateOption = (questionId: string, optionId: string, field: keyof AnswerOption, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? {
              ...q,
              options: q.options.map(opt => 
                opt.id === optionId ? { ...opt, [field]: value } : opt
              )
            }
          : q
      )
    }));
  };

  const deleteOption = (questionId: string, optionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: q.options.filter(opt => opt.id !== optionId) }
          : q
      )
    }));
  };

  const handleSave = () => {
    // TODO: Implement Supabase save logic
    console.log("Saving form:", formData);
    // Navigate back to dashboard after save
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-white border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditing ? "Editar Formulário" : "Novo Formulário"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure o formulário de lead scoring para seu cliente
                </p>
              </div>
            </div>
            
            <Button variant="hero" size="lg" onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Salvar Formulário
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Configuration */}
        <Card className="border-0 shadow-medium mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>Configurações do Formulário</CardTitle>
            </div>
            <CardDescription>
              Configure as informações básicas e URLs de redirecionamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  placeholder="Ex: Guilherme Planos de Saúde"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomínio</Label>
                <div className="flex">
                  <Input
                    id="subdomain"
                    placeholder="guilherme"
                    value={formData.subdomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))}
                    className="rounded-r-none"
                  />
                  <div className="bg-muted border border-l-0 rounded-r-md px-3 flex items-center text-sm text-muted-foreground">
                    .leadscorer.com
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scoreThreshold">Score Mínimo (Threshold)</Label>
              <Input
                id="scoreThreshold"
                type="number"
                min="0"
                max="100"
                value={formData.scoreThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, scoreThreshold: Number(e.target.value) }))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Leads com score igual ou maior serão direcionados para a URL de "leads qualificados"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="redirectGoodUrl">URL para Leads Qualificados</Label>
                <Input
                  id="redirectGoodUrl"
                  type="url"
                  placeholder="https://example.com/obrigado-qualificado"
                  value={formData.redirectGoodUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, redirectGoodUrl: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="redirectBadUrl">URL para Leads Não Qualificados</Label>
                <Input
                  id="redirectBadUrl"
                  type="url"
                  placeholder="https://example.com/obrigado"
                  value={formData.redirectBadUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, redirectBadUrl: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="isActive">Status do Formulário</Label>
                <p className="text-xs text-muted-foreground">
                  Formulários inativos não podem receber submissões
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions Builder */}
        <Card className="border-0 shadow-medium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <CardTitle>Construtor de Perguntas</CardTitle>
              </div>
              <Button variant="accent" onClick={addQuestion} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Pergunta
              </Button>
            </div>
            <CardDescription>
              Crie perguntas e configure a pontuação para cada resposta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {formData.questions.map((question, index) => (
                <Card key={question.id} className="border border-border bg-muted/30">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Pergunta {index + 1}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteQuestion(question.id)}
                        className="ml-auto gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Texto da Pergunta</Label>
                        <Input
                          placeholder="Ex: Qual sua profissão?"
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo da Pergunta</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) => updateQuestion(question.id, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="radio">Múltipla escolha</SelectItem>
                            <SelectItem value="select">Lista suspensa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Opções de Resposta</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(question.id)}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar Opção
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <Input
                              placeholder="Texto da opção"
                              value={option.text}
                              onChange={(e) => updateOption(question.id, option.id, "text", e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="Pontos"
                              value={option.points}
                              onChange={(e) => updateOption(question.id, option.id, "points", Number(e.target.value))}
                              className="w-20"
                              min="0"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteOption(question.id, option.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        
                        {question.options.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            Nenhuma opção adicionada ainda. Clique em "Adicionar Opção" para começar.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {formData.questions.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhuma pergunta criada ainda
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Comece adicionando sua primeira pergunta para o formulário
                  </p>
                  <Button variant="accent" onClick={addQuestion} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Primeira Pergunta
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

export default FormEditor;