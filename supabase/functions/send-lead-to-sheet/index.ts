// ARQUIVO: supabase/functions/send-lead-to-sheet/index.ts (VERSÃO INTELIGENTE)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { google } from 'https://googleapis.deno.dev/v1/sheets:v4.ts'

const SERVICE_ACCOUNT_CREDENTIALS = JSON.parse(Deno.env.get('GOOGLE_CREDENTIALS')!)

serve(async (req) => {
  try {
    // O Supabase agora precisa de um cliente para fazer buscas internas
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { record: submissionRecord } = await req.json()

    // 1. A função busca os detalhes do formulário pai usando o form_id da submissão
    const { data: formRecord, error: formError } = await supabaseAdminClient
      .from('forms')
      .select('google_sheet_url')
      .eq('id', submissionRecord.form_id)
      .single()

    if (formError) throw new Error(`Formulário não encontrado: ${formError.message}`)

    const sheetUrl = formRecord.google_sheet_url
    if (!sheetUrl) {
      console.log(`Formulário ${submissionRecord.form_id} não possui planilha configurada. Ignorando.`);
      return new Response(JSON.stringify({ message: "Nenhuma planilha configurada para este formulário." }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extrai o ID da Planilha da URL completa
    const spreadsheetId = sheetUrl.split('/d/')[1].split('/')[0]

    // 2. A função continua, mas agora usando o SPREADSHEET_ID dinâmico
    const sheets = google.sheets({ version: 'v4' })
    const auth = new google.auth.JWT(
      SERVICE_ACCOUNT_CREDENTIALS.client_email,
      undefined,
      SERVICE_ACCOUNT_CREDENTIALS.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    )

    const newRow = [
      new Date(submissionRecord.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      submissionRecord.form_id,
      submissionRecord.calculated_score,
      JSON.stringify(submissionRecord.submitted_data, null, 2),
      JSON.stringify(submissionRecord.utm_params, null, 2)
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Página1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    }, { auth })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  
    } catch (error) {
        console.error(error)

        // 1. Criamos uma variável de mensagem com um valor padrão.
        let errorMessage = "Ocorreu um erro desconhecido ao processar a requisição."

        // 2. Verificamos se o 'error' é uma instância da classe Error.
        if (error instanceof Error) {
            // Se for, podemos acessar .message com segurança.
            errorMessage = error.message
        }

        // 3. Usamos a variável segura para construir nossa resposta.
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})