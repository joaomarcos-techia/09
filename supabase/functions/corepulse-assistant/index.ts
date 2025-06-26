import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { message, userId, settings } = await req.json()

    // Get user's OpenAI integration
    const { data: openaiIntegration } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('service', 'ai')
      .eq('is_active', true)
      .single()

    if (!openaiIntegration) {
      throw new Error('OpenAI integration not configured')
    }

    // Get business data for context
    const [leadsRes, transactionsRes, tasksRes] = await Promise.all([
      supabaseClient
        .from('leads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(100),
      supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
    ])

    // Prepare business context
    const businessContext = {
      leads: {
        total: leadsRes.data?.length || 0,
        byStatus: leadsRes.data?.reduce((acc: any, lead: any) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1
          return acc
        }, {}),
        totalValue: leadsRes.data?.reduce((sum: number, lead: any) => sum + (lead.value || 0), 0)
      },
      finances: {
        income: transactionsRes.data?.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0) || 0,
        expenses: transactionsRes.data?.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0) || 0,
        transactions: transactionsRes.data?.length || 0
      },
      tasks: {
        total: tasksRes.data?.length || 0,
        completed: tasksRes.data?.filter((t: any) => t.status === 'done').length || 0,
        overdue: tasksRes.data?.filter((t: any) => 
          t.due_date && 
          new Date(t.due_date) < new Date() && 
          t.status !== 'done'
        ).length || 0
      }
    }

    // Generate AI response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiIntegration.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.model || openaiIntegration.config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `${settings.systemPrompt || openaiIntegration.config.systemPrompt}
            
            Você tem acesso aos seguintes dados da empresa:
            
            LEADS:
            - Total de leads: ${businessContext.leads.total}
            - Distribuição por status: ${JSON.stringify(businessContext.leads.byStatus)}
            - Valor total potencial: R$ ${businessContext.leads.totalValue}
            
            FINANÇAS:
            - Receitas: R$ ${businessContext.finances.income}
            - Despesas: R$ ${businessContext.finances.expenses}
            - Saldo: R$ ${businessContext.finances.income - businessContext.finances.expenses}
            - Total de transações: ${businessContext.finances.transactions}
            
            TAREFAS:
            - Total de tarefas: ${businessContext.tasks.total}
            - Tarefas concluídas: ${businessContext.tasks.completed}
            - Tarefas em atraso: ${businessContext.tasks.overdue}
            
            Responda de forma profissional, objetiva e focada em resultados práticos.
            Forneça insights acionáveis e recomendações estratégicas baseadas nos dados.`
          },
          { role: 'user', content: message }
        ],
        max_tokens: settings.maxTokens || openaiIntegration.config.maxTokens || 500,
        temperature: settings.temperature || openaiIntegration.config.temperature || 0.7
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message}`)
    }

    const aiResponse = await response.json()
    const aiMessage = aiResponse.choices[0]?.message?.content

    if (!aiMessage) {
      throw new Error('No response from AI')
    }

    // Save conversation to insights
    await supabaseClient
      .from('insights')
      .insert({
        user_id: userId,
        type: 'assistant_response',
        title: message.length > 50 ? message.substring(0, 50) + '...' : message,
        description: aiMessage,
        priority: 1,
        data: {
          query: message,
          response: aiMessage,
          timestamp: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: aiMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})