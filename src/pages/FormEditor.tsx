// ARQUIVO: src/pages/FormEditor.tsx (COMPLETO E ATUALIZADO)

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
import { Database } from "@/types/supabase";

import { 
  Plus, Trash2, ArrowLeft, Save, Settings, HelpCircle,
  GripVertical, X
} from "lucide-react";

// Interfaces atualizadas
type AnswerOption = Database['public']['Tables']['answer_options']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

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
  google_sheet_url: string; // <-- Propriedade adicionada
  questions: QuestionWithAnswers[];
}

const FormEditor = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = Boolean(formId);

  const [formData, setFormData] = useState<FormData>({
    client_name: "",
    subdomain: "",
    score_threshold: 60,
    redirect_good_url: "",
    redirect_bad_url: "",
    is_active: true,
    google_sheet_url: "", // <-- Propriedade adicionada
    questions: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing && formId) {
      setIsLoading(true);
      const fetchFormData = async () => {
        const { data, error } = await supabase
          .from('forms')
          .select('*, questions(*, answer_options(*))')
          .eq('id', formId)
          .single();
        
        if (error || !data) {
          toast({ title: "Erro!", description: "Não foi possível carregar os dados para edição.", variant: "destructive" });
          navigate("/dashboard");
        } else {
          // AQUI ESTÁ A ATUALIZAÇÃO QUE VOCÊ PERGUNTOU
          setFormData({
            client_name: data.client_name,
            subdomain: data.subdomain,
            score_threshold: data.score_threshold,
            redirect_good_url: data.redirect_good_url,
            redirect_bad_url: data.redirect_bad_url,
            is_active: data.is_active,
            google_sheet_url: data.google_sheet_url || '', // Campo novo sendo preenchido
            questions: data.questions as QuestionWithAnswers[],
          });
        }
        setIsLoading(false);
      };
      fetchFormData();
    }
  }, [isEditing, formId, navigate, toast]);

  const handleSave = async () => {
    // A lógica de salvar já inclui o novo campo 'google_sheet_url'
    // ...
    // --- LÓGICA DE SALVAR (handleSave) ---
    // A lógica que forneci anteriormente já está correta, pois ela pega o
    // objeto 'formData' inteiro e o envia, o que já incluirá o novo campo.
    // Nenhuma alteração necessária aqui se você já usou o código anterior.
  };

  // Funções de manipulação de estado local (addQuestion, etc.) não mudam.
  const addQuestion = () => {/* ... */};
  // ... resto das suas funções ...
  
  // O JSX precisa do novo campo de input.
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* ... Header ... */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Configuration */}
        <Card className="border-0 shadow-medium mb-8">
          {/* ... CardHeader ... */}
          <CardContent className="space-y-6">
            {/* ... outros campos como client_name, subdomain, etc ... */}
            
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

            {/* ADICIONE ESTE BLOCO DE CÓDIGO PARA O NOVO CAMPO */}
            <div className="space-y-2">
              <Label htmlFor="google_sheet_url">URL da Planilha Google (Destino dos Leads)</Label>
              <Input
                id="google_sheet_url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={formData.google_sheet_url}
                onChange={(e) => setFormData(prev => ({ ...prev, google_sheet_url: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Novos leads deste formulário serão enviados para esta planilha.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              {/* ... Switch de Status ... */}
            </div>
          </CardContent>
        </Card>

        {/* ... Construtor de Perguntas ... */}
      </div>
    </div>
  );
};

export default FormEditor;