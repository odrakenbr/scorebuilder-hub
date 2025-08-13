// ARQUIVO NOVO: src/pages/PublicForm.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from '@/types/supabase';
import { useParams } from 'react-router-dom';

type AnswerOption = Database['public']['Tables']['answer_options']['Row'];
type QuestionWithAnswers = Database['public']['Tables']['questions']['Row'] & {
  answer_options: AnswerOption[];
};
type FormWithQuestions = Database['public']['Tables']['forms']['Row'] & {
  questions: QuestionWithAnswers[];
};

interface PublicFormProps {
  subdomain: string;
}

const PublicForm = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [form, setForm] = useState<FormWithQuestions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchForm = async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*, questions(*, answer_options(*))')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setError('Formulário não encontrado ou inativo.');
      } else {
        setForm(data as FormWithQuestions);
      }
      setIsLoading(false);
    };
    fetchForm();
  }, [subdomain]);

  const handleInputChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    let calculated_score = 0;
    const submitted_data: Record<string, string> = {};

    for (const question of form.questions) {
      const answerOptionId = answers[question.id];
      const selectedOption = question.answer_options.find(opt => opt.id === answerOptionId);
      if (selectedOption) {
        calculated_score += selectedOption.points;
        submitted_data[question.question_text] = selectedOption.option_text;
      }
    }
    
    // Salva a submissão no banco
    await supabase.from('submissions').insert({
      form_id: form.id,
      calculated_score,
      submitted_data,
      // TODO: Capturar e salvar utm_params se existirem na URL
    });

    // Redireciona o usuário
    if (calculated_score >= form.score_threshold) {
      window.location.href = form.redirect_good_url;
    } else {
      window.location.href = form.redirect_bad_url;
    }
  };

  if (isLoading) return <div className="text-center p-10">Carregando formulário...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center">{form?.client_name}</h1>
        {form?.questions.map(q => (
          <div key={q.id} className="space-y-2">
            <Label>{q.question_text}</Label>
            {q.question_type === 'radio' && (
              <RadioGroup onValueChange={(value) => handleInputChange(q.id, value)}>
                {q.answer_options.map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} />
                    <Label htmlFor={`${q.id}-${opt.id}`}>{opt.option_text}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {q.question_type === 'select' && (
              <Select onValueChange={(value) => handleInputChange(q.id, value)}>
                <SelectTrigger><SelectValue placeholder="Selecione uma opção" /></SelectTrigger>
                <SelectContent>
                  {q.answer_options.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.option_text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
        <Button type="submit" className="w-full">Enviar Respostas</Button>
      </form>
    </div>
  );
};

export default PublicForm;