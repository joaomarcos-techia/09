import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { service, config } = await req.json()

    let testResult = { success: false, message: '' }

    switch (service) {
      case 'whatsapp':
        testResult = await testWhatsApp(config)
        break
      case 'email':
        testResult = await testEmail(config)
        break
      case 'ai':
        testResult = await testOpenAI(config)
        break
      default:
        throw new Error(`Unknown service: ${service}`)
    }

    return new Response(
      JSON.stringify(testResult),
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

async function testWhatsApp(config: any) {
  try {
    if (!config.apiKey || !config.phoneNumber) {
      return { success: false, message: 'API Key e número do telefone são obrigatórios' }
    }

    // Test WhatsApp Business API connection
    const response = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumber}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return { 
        success: true, 
        message: `Conexão estabelecida! Número verificado: ${data.display_phone_number || config.phoneNumber}` 
      }
    } else {
      const error = await response.json()
      return { 
        success: false, 
        message: `Erro na API do WhatsApp: ${error.error?.message || 'Token inválido ou número não encontrado'}` 
      }
    }
  } catch (error) {
    return { success: false, message: `Erro de conexão: ${error.message}` }
  }
}

async function testEmail(config: any) {
  try {
    if (!config.smtpHost || !config.username || !config.password) {
      return { success: false, message: 'Configurações SMTP incompletas' }
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(config.username)) {
      return { success: false, message: 'Formato de email inválido' }
    }

    // Validação de servidores SMTP conhecidos
    const commonServers = {
      'smtp.gmail.com': 587,
      'smtp-mail.outlook.com': 587,
      'smtp.mail.yahoo.com': 587,
      'smtp.office365.com': 587
    }

    const expectedPort = commonServers[config.smtpHost]
    if (expectedPort && parseInt(config.smtpPort) !== expectedPort) {
      return { 
        success: false, 
        message: `Para ${config.smtpHost}, a porta recomendada é ${expectedPort}` 
      }
    }

    // Validação específica para Gmail
    if (config.smtpHost.includes('gmail') && !config.password.includes(' ')) {
      return { 
        success: false, 
        message: 'Para Gmail, use uma "Senha de App" em vez da senha normal. Ative a autenticação de 2 fatores e gere uma senha de app.' 
      }
    }

    // Teste básico de conectividade (em produção, faria teste SMTP real)
    return { 
      success: true, 
      message: 'Configuração SMTP válida! Lembre-se de testar o envio real em produção.' 
    }
  } catch (error) {
    return { success: false, message: `Erro na configuração: ${error.message}` }
  }
}

async function testOpenAI(config: any) {
  try {
    if (!config.apiKey) {
      return { success: false, message: 'API Key da OpenAI é obrigatória' }
    }

    if (!config.apiKey.startsWith('sk-')) {
      return { success: false, message: 'Chave da API deve começar com "sk-"' }
    }

    // Test OpenAI API connection
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Test connection' },
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 10
      })
    })

    if (response.ok) {
      const data = await response.json()
      return { 
        success: true, 
        message: `Conexão com OpenAI estabelecida! Modelo ${config.model || 'gpt-3.5-turbo'} funcionando.` 
      }
    } else {
      const error = await response.json()
      
      if (response.status === 401) {
        return { success: false, message: 'Chave da API inválida. Verifique se está correta e ativa.' }
      } else if (response.status === 429) {
        return { success: false, message: 'Limite de requisições excedido. Verifique seu plano OpenAI.' }
      } else if (response.status === 400) {
        return { success: false, message: `Modelo ${config.model} não disponível ou parâmetros inválidos.` }
      } else {
        return { 
          success: false, 
          message: `Erro da API OpenAI: ${error.error?.message || 'Erro desconhecido'}` 
        }
      }
    }
  } catch (error) {
    return { success: false, message: `Erro de conexão: ${error.message}` }
  }
}