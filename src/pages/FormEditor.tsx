// ARQUIVO: src/pages/FormEditor.tsx (VERSÃO FINAL CORRIGIDA E TIPADA)

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/types/supabase"; // Importando os tipos do Supabase

import { 
  Plus, Trash2, ArrowLeft, Save, Settings, HelpCircle,
  GripVertical, X
} from "lucide-react";

// Usando os tipos gerados pelo Supabase para garantir consistência
type AnswerOption = Database['public']['Tables']['answer_options']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

// Este é o tipo para o nosso estado local, que inclui as relações aninhadas
interface QuestionWithAnswers extends Question {
  answer_options: AnswerOption[];
}

interface FormData {
  client_name: string;
  subdomain: string;
  score_threshold: number;
  redirect_good_url: string;
  redirect_bad_url: string;
  is_active: boolean;
  questions: QuestionWithAnswers[];
}

const FormEditor = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = Boolean(formId);

  // O estado agora usa nomes de propriedade consistentes com o banco de dados (snake_case)
  const [formData, setFormData] = useState<FormData>({
    client_name: "",
    subdomain: "",
    score_threshold: 60,
    redirect_good_url: "",
    redirect_bad_url: "",
    is_active: true,
    questions: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing && formId) {
      setIsLoading(true);
      const fetchFormData = async () => {
        const { data, error } = await supabase
          .from('forms')
          .select('*, questions(*, answer_options(*))') // Busca aninhada
          .eq('id', formId)
          .single();
        
        if (error) {
          toast({ title: "Erro!", description: "Não foi possível carregar os dados para edição.", variant: "destructive" });
          navigate("/dashboard");
        } else if (data) {
          // A conversão agora é mais simples porque os nomes das propriedades são os mesmos
          setFormData({
            client_name: data.client_name,
            subdomain: data.subdomain,
            score_threshold: data.score_threshold,
            redirect_good_url: data.redirect_good_url,
            redirect_bad_url: data.redirect_bad_url,
            is_active: data.is_active,
            questions: data.questions as QuestionWithAnswers[], // Afirmamos o tipo aninhado
          });
        }
        setIsLoading(false);
      };
      fetchFormData();
    }
  }, [isEditing, formId, navigate, toast]);

  // Lógica de Salvar com tipagem correta
  const handleSave = async () => {
    if (!user) {
      toast({ title: "Erro de Autenticação", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    // Separa as perguntas dos dados principais do formulário
    const { questions, ...formCoreData } = formData;

    try {
      if (isEditing && formId) {
        // --- MODO DE ATUALIZAÇÃO ---
        const { error: formError } = await supabase.from('forms').update(formCoreData).match({ id: formId });
        if (formError) throw formError;

        const { error: deleteQuestionsError } = await supabase.from('questions').delete().match({ form_id: formId });
        if (deleteQuestionsError) throw deleteQuestionsError;

        for (const question of questions) {
          const { answer_options, ...questionCoreData } = question;
          const { data: newQuestion, error: questionError } = await supabase.from('questions').insert({
            ...questionCoreData, // text, type, order_index
            form_id: formId,     // liga ao formulário pai
            id: undefined,       // remove o ID antigo para o BD gerar um novo
            created_at: undefined,
          }).select().single();
          if (questionError) throw questionError;

          if (answer_options.length > 0) {
            const optionsToInsert = answer_options.map(opt => ({
              question_id: newQuestion!.id,
              option_text: opt.option_text,
              points: opt.points
            }));
            const { error: optionsError } = await supabase.from('answer_options').insert(optionsToInsert);
            if (optionsError) throw optionsError;
          }
        }
      } else {
        // --- MODO DE CRIAÇÃO ---
        const { data: newForm, error: formError } = await supabase.from('forms').insert({
          ...formCoreData,
          owner_id: user.id
        }).select().single();
        if (formError) throw formError;

        if (questions.length > 0) {
          for (const question of questions) {
            const { answer_options, ...questionCoreData } = question;
            const { data: newQuestion, error: questionError } = await supabase.from('questions').insert({
              ...questionCoreData,
              form_id: newForm!.id,
              id: undefined,
              created_at: undefined,
            }).select().single();
            if (questionError) throw questionError;

            if (answer_options.length > 0) {
              const optionsToInsert = answer_options.map(opt => ({
                question_id: newQuestion!.id,
                option_text: opt.option_text,
                points: opt.points
              }));
              const { error: optionsError } = await supabase.from('answer_options').insert(optionsToInsert);
              if (optionsError) throw optionsError;
            }
          }
        }
      }
      toast({ title: "Sucesso!", description: "Formulário salvo com sucesso." });
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNÇÕES DE MANIPULAÇÃO DO ESTADO LOCAL COM TIPAGEM CORRETA ---
  const addQuestion = () => {
    const newQuestion: QuestionWithAnswers = { id: `temp-${Date.now()}`, form_id: '', question_text: "", question_type: "radio", order_index: formData.questions.length, created_at: '', answer_options: [] };
    setFormData(prev => ({...prev, questions: [...prev.questions, newQuestion]}));
  };
  const updateQuestion = (questionId: string, field: 'question_text' | 'question_type', value: string) => {
    setFormData(prev => ({...prev, questions: prev.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)}));
  };
  const deleteQuestion = (questionId: string) => {
    setFormData(prev => ({...prev, questions: prev.questions.filter(q => q.id !== questionId)}));
  };
  const addOption = (questionId: string) => {
    const newOption: AnswerOption = { id: `temp-${Date.now()}`, question_id: questionId, option_text: "", points: 0, created_at: '' };
    setFormData(prev => ({...prev, questions: prev.questions.map(q => q.id === questionId ? { ...q, answer_options: [...q.answer_options, newOption] } : q)}));
  };
  const updateOption = (questionId: string, optionId: string, field: 'option_text' | 'points', value: string | number) => {
    setFormData(prev => ({...prev, questions: prev.questions.map(q => q.id === questionId ? {...q, answer_options: q.answer_options.map(opt => opt.id === optionId ? { ...opt, [field]: value } : opt)} : q)}));
  };
  const deleteOption = (questionId: string, optionId: string) => {
    setFormData(prev => ({...prev, questions: prev.questions.map(q => q.id === questionId ? { ...q, answer_options: q.answer_options.filter(opt => opt.id !== optionId) } : q)}));
  };
  // -----------------------------------------------------------------

  if (isLoading && isEditing) {
    return <div className="flex justify-center items-center min-h-screen">Carregando editor...</div>;
  }
  
  // O JSX foi atualizado para usar os nomes de propriedade corretos (snake_case)
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-white border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
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
            
            <Button variant="hero" size="lg" onClick={handleSave} disabled={isLoading} className="gap-2">
              {isLoading ? "Salvando..." : <><Save className="w-4 h-4" /> Salvar Formulário</>}
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
                <Label htmlFor="client_name">Nome do Cliente</Label>
                <Input id="client_name" placeholder="Ex: Guilherme Planos de Saúde" value={formData.client_name} onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomínio</Label>
                <div className="flex">
                  <Input id="subdomain" placeholder="guilherme" value={formData.subdomain} onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/\s/g, '') }))} className="rounded-r-none"/>
                  <div className="bg-muted border border-l-0 rounded-r-md px-3 flex items-center text-sm text-muted-foreground">
                    .leadscorer.com
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score_threshold">Score Mínimo (Threshold)</Label>
              <Input id="score_threshold" type="number" min="0" max="100" value={formData.score_threshold} onChange={(e) => setFormData(prev => ({ ...prev, score_threshold: Number(e.target.value) }))} className="w-32"/>
              <p className="text-xs text-muted-foreground">
                Leads com score igual ou maior serão direcionados para a URL de "leads qualificados"
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="redirect_good_url">URL para Leads Qualificados</Label>
                <Input id="redirect_good_url" type="url" placeholder="https://example.com/obrigado-qualificado" value={formData.redirect_good_url} onChange={(e) => setFormData(prev => ({ ...prev, redirect_good_url: e.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="redirect_bad_url">URL para Leads Não Qualificados</Label>
                <Input id="redirect_bad_url" type="url" placeholder="https://example.com/obrigado" value={formData.redirect_bad_url} onChange={(e) => setFormData(prev => ({ ...prev, redirect_bad_url: e.target.value }))}/>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="is_active">Status do Formulário</Label>
                <p className="text-xs text-muted-foreground">
                  Formulários inativos não podem receber submissões
                </p>
              </div>
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}/>
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
                      <Button variant="outline" size="sm" onClick={() => deleteQuestion(question.id!)} className="ml-auto gap-1 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Texto da Pergunta</Label>
                        <Input placeholder="Ex: Qual sua profissão?" value={question.question_text} onChange={(e) => updateQuestion(question.id!, "question_text", e.target.value)}/>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo da Pergunta</Label>
                        <Select value={question.question_type} onValueChange={(value: "radio" | "select") => updateQuestion(question.id!, "question_type", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Button variant="outline" size="sm" onClick={() => addOption(question.id!)} className="gap-1">
                          <Plus className="w-3 h-3" />
                          Adicionar Opção
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {question.answer_options.map((option) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <Input placeholder="Texto da opção" value={option.option_text} onChange={(e) => updateOption(question.id!, option.id!, "option_text", e.target.value)} className="flex-1"/>
                            <Input type="number" placeholder="Pontos" value={option.points} onChange={(e) => updateOption(question.id!, option.id!, "points", Number(e.target.value))} className="w-20" min="0"/>
                            <Button variant="outline" size="sm" onClick={() => deleteOption(question.id!, option.id!)} className="text-destructive hover:text-destructive">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        {question.answer_options.length === 0 && (
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