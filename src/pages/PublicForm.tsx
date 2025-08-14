// ARQUIVO: src/pages/PublicForm.tsx (VERSÃO FINAL COM CAPTURA DE UTM)

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Database } from '@/types/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

// Tipos (sem alteração)
type AnswerOption = Database['public']['Tables']['answer_options']['Row'];
type QuestionWithAnswers = Database['public']['Tables']['questions']['Row'] & {
  answer_options: AnswerOption[];
};
type FormWithQuestions = Database['public']['Tables']['forms']['Row'] & {
  questions: QuestionWithAnswers[];
};

const PublicForm = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  
  // Estados para controlar a lógica do formulário
  const [form, setForm] = useState<FormWithQuestions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para controlar as respostas, a pergunta atual e os UTMs
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [utmData, setUtmData] = useState<Record<string, string>>({}); // << NOVO ESTADO PARA UTMs

  useEffect(() => {
    // Esta função agora busca os dados do formulário E captura os parâmetros UTM
    const fetchFormAndUtms = async () => {
      setIsLoading(true);

      // --- Início da Captura de UTMs ---
      try {
        const params = new URLSearchParams(window.location.search);
        const utms: Record<string, string> = {};
        params.forEach((value, key) => {
          if (key.startsWith('utm_')) {
            utms[key] = value;
          }
        });
        setUtmData(utms);
      } catch (e) {
        console.error("Erro ao capturar parâmetros UTM:", e);
      }
      // --- Fim da Captura de UTMs ---

      const { data, error } = await supabase
        .from('forms')
        .select('*, questions(*, answer_options(*))')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setError('Formulário não encontrado ou inativo.');
      } else {
        data.questions.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        setForm(data as FormWithQuestions);
      }
      setIsLoading(false);
    };
    
    fetchFormAndUtms();
  }, [subdomain]);

  const handleAnswerSelect = (questionId: string, answerOptionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerOptionId }));
  };

  const handleNextQuestion = () => {
    if (form && currentQuestionIndex < form.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!form) return;
    setIsLoading(true);

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
    
    // ATUALIZAÇÃO: Inserimos os dados UTM na tabela 'submissions'
    await supabase.from('submissions').insert({
      form_id: form.id,
      calculated_score,
      submitted_data,
      utm_params: utmData, // << DADOS UTM INCLUÍDOS AQUI
    });

    if (calculated_score >= form.score_threshold) {
      window.location.href = form.redirect_good_url;
    } else {
      window.location.href = form.redirect_bad_url;
    }
  };
  
  if (isLoading && !form) return <div className="text-center p-10">Carregando formulário...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!form || !form.questions || form.questions.length === 0) {
    return <div className="text-center p-10 text-yellow-600">Este formulário ainda não tem perguntas configuradas.</div>;
  }

  const currentQuestion = form.questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / form.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">
        {/* Barra de Progresso */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
          <motion.div 
            className="bg-blue-600 h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-xl shadow-lg relative overflow-hidden min-h-[350px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute top-8 left-8 right-8 sm:top-12 sm:left-12 sm:right-12"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
                {currentQuestion.question_text}
              </h2>

              <RadioGroup 
                onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                className="space-y-4"
              >
                {currentQuestion.answer_options.map(opt => (
                  <Label 
                    key={opt.id}
                    htmlFor={opt.id}
                    className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:border-blue-500 hover:bg-blue-50 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
                  >
                    <RadioGroupItem value={opt.id} id={opt.id} className="h-5 w-5" />
                    <span className="ml-4 text-lg text-gray-700">{opt.option_text}</span>
                  </Label>
                ))}
              </RadioGroup>
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute bottom-8 left-8 sm:bottom-12 sm:left-12">
            <Button
              onClick={handleNextQuestion}
              disabled={!answers[currentQuestion.id] || isLoading}
              className="flex items-center gap-2 text-lg px-6 py-6"
            >
              {isLoading 
                ? "Enviando..."
                : currentQuestionIndex === form.questions.length - 1
                  ? "Enviar"
                  : "OK"}
              {!isLoading && <Check className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by LeadScorer Pro
        </p>
      </div>
    </div>
  );
};

export default PublicForm;