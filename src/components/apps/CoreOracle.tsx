import React, { useState, useEffect, useRef } from 'react'
import { 
  ArrowLeft, 
  Brain, 
  Send, 
  Loader2, 
  Settings, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckSquare, 
  MessageCircle, 
  Download, 
  RefreshCw, 
  Lightbulb, 
  Target, 
  AlertTriangle, 
  Home,
  Bot,
  Zap,
  FileText,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react'
import { useLeads } from '../../hooks/useLeads'
import { useTasks } from '../../hooks/useTasks'
import { useTransactions } from '../../hooks/useTransactions'
import { useIntegrations } from '../../hooks/useIntegrations'

interface CoreOracleProps {
  onBack: () => void
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
  reportType?: 'monthly' | 'expense' | 'cashflow' | 'strategic'
}

interface BusinessData {
  leads: {
    total: number
    qualified: number
    won: number
    conversionRate: number
    avgValue: number
    recentTrends: string[]
  }
  tasks: {
    total: number
    completed: number
    overdue: number
    completionRate: number
    avgCompletionTime: number
    productivityTrends: string[]
  }
  finance: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    monthlyGrowth: number
    cashFlow: number
    financialTrends: string[]
  }
  insights: string[]
  recommendations: string[]
}

export function CoreOracle({ onBack }: CoreOracleProps) {
  const { leads, stats: leadStats } = useLeads()
  const { tasks, stats: taskStats } = useTasks()
  const { transactions, stats: financeStats } = useTransactions()
  const { getIntegrationByService } = useIntegrations()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [oracleSettings, setOracleSettings] = useState({
    aiProvider: 'openai',
    model: 'gpt-4',
    apiKey: '',
    systemPrompt: `Você é o CoreOracle, um consultor estratégico inteligente especializado em análise de negócios. 

Sua função é analisar dados de CRM, tarefas e finanças para fornecer:
- Insights estratégicos baseados em dados
- Recomendações para otimização de processos
- Análises preditivas de tendências
- Relatórios executivos detalhados

Sempre responda de forma profissional, objetiva e focada em resultados práticos. Use dados específicos quando disponíveis e forneça recomendações acionáveis.`,
    temperature: 0.7,
    maxTokens: 1000,
    analysisDepth: 'detailed'
  })

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('coreoracle-settings')
    if (savedSettings) {
      try {
        setOracleSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Error loading Oracle settings:', error)
      }
    }

    // Load chat history
    const savedMessages = localStorage.getItem('coreoracle-messages')
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      } catch (error) {
        console.error('Error loading chat history:', error)
      }
    }

    // Initialize with welcome message if no history
    if (!savedMessages) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Olá! Sou o CoreOracle, seu consultor estratégico inteligente. 

Posso ajudá-lo com:
📊 **Análises de Performance** - Métricas de vendas, produtividade e finanças
🎯 **Insights Estratégicos** - Identificação de oportunidades e gargalos
📈 **Previsões e Tendências** - Análise preditiva baseada em seus dados
📋 **Relatórios Executivos** - Documentos detalhados para tomada de decisão

Como posso ajudá-lo hoje?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Save messages to localStorage
    if (messages.length > 0) {
      localStorage.setItem('coreoracle-messages', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    // Compile business data
    if (leadStats && taskStats && financeStats) {
      const data: BusinessData = {
        leads: {
          total: leadStats.total || 0,
          qualified: leadStats.qualified || 0,
          won: leadStats.won || 0,
          conversionRate: parseFloat(leadStats.conversionRate?.replace('%', '') || '0'),
          avgValue: leadStats.totalValue ? leadStats.totalValue / (leadStats.total || 1) : 0,
          recentTrends: generateLeadTrends()
        },
        tasks: {
          total: taskStats.total || 0,
          completed: taskStats.completed || 0,
          overdue: taskStats.overdue || 0,
          completionRate: parseFloat(taskStats.completionRate?.replace('%', '') || '0'),
          avgCompletionTime: 3.5, // Simulated
          productivityTrends: generateTaskTrends()
        },
        finance: {
          totalRevenue: financeStats.monthlyIncome || 0,
          totalExpenses: financeStats.monthlyExpenses || 0,
          netProfit: (financeStats.monthlyIncome || 0) - (financeStats.monthlyExpenses || 0),
          monthlyGrowth: 12.5, // Simulated
          cashFlow: financeStats.totalBalance || 0,
          financialTrends: generateFinanceTrends()
        },
        insights: generateInsights(),
        recommendations: generateRecommendations()
      }
      setBusinessData(data)
    }
  }, [leadStats, taskStats, financeStats])

  const generateLeadTrends = () => {
    const trends = []
    if (leadStats?.conversionRate) {
      const rate = parseFloat(leadStats.conversionRate.replace('%', ''))
      if (rate > 20) trends.push('Alta taxa de conversão detectada')
      if (rate < 5) trends.push('Taxa de conversão abaixo da média')
    }
    if (leadStats?.qualified && leadStats?.total) {
      const qualificationRate = (leadStats.qualified / leadStats.total) * 100
      if (qualificationRate > 50) trends.push('Boa qualificação de leads')
    }
    return trends
  }

  const generateTaskTrends = () => {
    const trends = []
    if (taskStats?.completionRate) {
      const rate = parseFloat(taskStats.completionRate.replace('%', ''))
      if (rate > 80) trends.push('Alta produtividade da equipe')
      if (rate < 50) trends.push('Produtividade abaixo do esperado')
    }
    if (taskStats?.overdue && taskStats?.overdue > 0) {
      trends.push(`${taskStats.overdue} tarefas em atraso requerem atenção`)
    }
    return trends
  }

  const generateFinanceTrends = () => {
    const trends = []
    if (financeStats?.monthlyIncome && financeStats?.monthlyExpenses) {
      const margin = ((financeStats.monthlyIncome - financeStats.monthlyExpenses) / financeStats.monthlyIncome) * 100
      if (margin > 20) trends.push('Margem de lucro saudável')
      if (margin < 10) trends.push('Margem de lucro baixa - revisar custos')
    }
    if (financeStats?.totalBalance && financeStats.totalBalance > 0) {
      trends.push('Fluxo de caixa positivo')
    }
    return trends
  }

  const generateInsights = () => {
    const insights = []
    
    if (leadStats?.conversionRate && taskStats?.completionRate) {
      const leadRate = parseFloat(leadStats.conversionRate.replace('%', ''))
      const taskRate = parseFloat(taskStats.completionRate.replace('%', ''))
      
      if (leadRate > 15 && taskRate > 75) {
        insights.push('Correlação positiva entre produtividade da equipe e conversão de leads')
      }
    }

    if (financeStats?.monthlyIncome && leadStats?.won) {
      const revenuePerLead = financeStats.monthlyIncome / (leadStats.won || 1)
      insights.push(`Receita média por lead convertido: R$ ${revenuePerLead.toLocaleString('pt-BR')}`)
    }

    return insights
  }

  const generateRecommendations = () => {
    const recommendations = []
    
    if (taskStats?.overdue && taskStats.overdue > 0) {
      recommendations.push('Implementar sistema de alertas para tarefas próximas do vencimento')
    }

    if (leadStats?.total && leadStats.qualified) {
      const qualificationRate = (leadStats.qualified / leadStats.total) * 100
      if (qualificationRate < 30) {
        recommendations.push('Melhorar processo de qualificação de leads com critérios mais específicos')
      }
    }

    if (financeStats?.monthlyExpenses && financeStats?.monthlyIncome) {
      const expenseRatio = (financeStats.monthlyExpenses / financeStats.monthlyIncome) * 100
      if (expenseRatio > 80) {
        recommendations.push('Revisar e otimizar estrutura de custos operacionais')
      }
    }

    return recommendations
  }

  const saveSettings = () => {
    localStorage.setItem('coreoracle-settings', JSON.stringify(oracleSettings))
    setShowSettings(false)
  }

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Check if AI integration is configured
    const aiIntegration = getIntegrationByService('ai')
    
    if (!aiIntegration?.is_active && !oracleSettings.apiKey) {
      return `Para usar o CoreOracle com IA, você precisa configurar uma integração de IA primeiro. 

Vá em **CoreCRM > Integrações > Assistente de IA** para configurar sua chave da OpenAI.

Enquanto isso, posso fornecer análises baseadas nos seus dados atuais:

${generateDataBasedResponse(userMessage)}`
    }

    try {
      const apiKey = aiIntegration?.config?.apiKey || oracleSettings.apiKey
      const model = aiIntegration?.config?.model || oracleSettings.model

      const systemPrompt = `${oracleSettings.systemPrompt}

DADOS ATUAIS DO NEGÓCIO:
${businessData ? `
Leads: ${businessData.leads.total} total, ${businessData.leads.won} convertidos (${businessData.leads.conversionRate}%)
Tarefas: ${businessData.tasks.total} total, ${businessData.tasks.completed} concluídas (${businessData.tasks.completionRate}%)
Finanças: R$ ${businessData.finance.totalRevenue.toLocaleString('pt-BR')} receita, R$ ${businessData.finance.totalExpenses.toLocaleString('pt-BR')} despesas
Lucro Líquido: R$ ${businessData.finance.netProfit.toLocaleString('pt-BR')}

Tendências Identificadas:
${[...businessData.leads.recentTrends, ...businessData.tasks.productivityTrends, ...businessData.finance.financialTrends].join('\n')}
` : 'Dados não disponíveis no momento.'}

Responda sempre em português brasileiro e seja específico com os dados fornecidos.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: oracleSettings.maxTokens,
          temperature: oracleSettings.temperature
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'

    } catch (error) {
      console.error('Error generating AI response:', error)
      return `Erro ao conectar com a IA. Fornecendo análise baseada em dados:

${generateDataBasedResponse(userMessage)}`
    }
  }

  const generateDataBasedResponse = (userMessage: string): string => {
    if (!businessData) {
      return 'Aguardando carregamento dos dados do sistema...'
    }

    const message = userMessage.toLowerCase()

    if (message.includes('vendas') || message.includes('leads') || message.includes('conversão')) {
      return `**Análise de Vendas:**

📊 **Métricas Atuais:**
- Total de leads: ${businessData.leads.total}
- Leads qualificados: ${businessData.leads.qualified}
- Conversões: ${businessData.leads.won}
- Taxa de conversão: ${businessData.leads.conversionRate}%

💡 **Insights:**
${businessData.leads.recentTrends.length > 0 ? businessData.leads.recentTrends.map(trend => `- ${trend}`).join('\n') : '- Dados insuficientes para análise de tendências'}

🎯 **Recomendações:**
- Foque na qualificação de leads para melhorar a taxa de conversão
- Implemente follow-ups automatizados para leads qualificados`
    }

    if (message.includes('tarefas') || message.includes('produtividade') || message.includes('equipe')) {
      return `**Análise de Produtividade:**

📋 **Métricas Atuais:**
- Total de tarefas: ${businessData.tasks.total}
- Tarefas concluídas: ${businessData.tasks.completed}
- Tarefas em atraso: ${businessData.tasks.overdue}
- Taxa de conclusão: ${businessData.tasks.completionRate}%

⚡ **Insights:**
${businessData.tasks.productivityTrends.length > 0 ? businessData.tasks.productivityTrends.map(trend => `- ${trend}`).join('\n') : '- Dados insuficientes para análise de tendências'}

🚀 **Recomendações:**
- Configure alertas para tarefas próximas do vencimento
- Implemente metodologias ágeis para melhorar o fluxo de trabalho`
    }

    if (message.includes('financeiro') || message.includes('receita') || message.includes('lucro')) {
      return `**Análise Financeira:**

💰 **Métricas Atuais:**
- Receita mensal: R$ ${businessData.finance.totalRevenue.toLocaleString('pt-BR')}
- Despesas mensais: R$ ${businessData.finance.totalExpenses.toLocaleString('pt-BR')}
- Lucro líquido: R$ ${businessData.finance.netProfit.toLocaleString('pt-BR')}
- Fluxo de caixa: R$ ${businessData.finance.cashFlow.toLocaleString('pt-BR')}

📈 **Insights:**
${businessData.finance.financialTrends.length > 0 ? businessData.finance.financialTrends.map(trend => `- ${trend}`).join('\n') : '- Dados insuficientes para análise de tendências'}

💡 **Recomendações:**
- Monitore regularmente a margem de lucro
- Implemente controles de custos mais rigorosos`
    }

    // General overview
    return `**Visão Geral do Negócio:**

🎯 **Performance Geral:**
- Leads: ${businessData.leads.total} (${businessData.leads.conversionRate}% conversão)
- Produtividade: ${businessData.tasks.completionRate}% de conclusão
- Saúde Financeira: ${businessData.finance.netProfit >= 0 ? 'Positiva' : 'Requer atenção'}

📊 **Principais Insights:**
${businessData.insights.length > 0 ? businessData.insights.map(insight => `- ${insight}`).join('\n') : '- Colete mais dados para insights detalhados'}

🚀 **Recomendações Prioritárias:**
${businessData.recommendations.length > 0 ? businessData.recommendations.map(rec => `- ${rec}`).join('\n') : '- Continue monitorando as métricas principais'}

Para análises mais específicas, pergunte sobre vendas, produtividade ou finanças.`
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await generateAIResponse(userMessage.content)
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: response, isLoading: false }
          : msg
      ))
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { 
              ...msg, 
              content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.', 
              isLoading: false 
            }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = async (type: 'monthly' | 'expense' | 'cashflow' | 'strategic') => {
    const reportMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `Gerando relatório ${type === 'monthly' ? 'mensal' : type === 'expense' ? 'de gastos' : type === 'cashflow' ? 'de fluxo de caixa' : 'estratégico'}...`,
      timestamp: new Date(),
      isLoading: true,
      reportType: type
    }

    setMessages(prev => [...prev, reportMessage])

    // Simulate report generation
    setTimeout(() => {
      const reportContent = generateReportContent(type)
      setMessages(prev => prev.map(msg => 
        msg.id === reportMessage.id 
          ? { ...msg, content: reportContent, isLoading: false }
          : msg
      ))
    }, 2000)
  }

  const generateReportContent = (type: string): string => {
    if (!businessData) return 'Dados insuficientes para gerar o relatório.'

    switch (type) {
      case 'monthly':
        return `# 📊 Relatório Mensal Executivo

## Resumo Executivo
${businessData.finance.netProfit >= 0 ? '✅' : '⚠️'} **Status Geral:** ${businessData.finance.netProfit >= 0 ? 'Positivo' : 'Requer Atenção'}

## 💰 Performance Financeira
- **Receita:** R$ ${businessData.finance.totalRevenue.toLocaleString('pt-BR')}
- **Despesas:** R$ ${businessData.finance.totalExpenses.toLocaleString('pt-BR')}
- **Lucro Líquido:** R$ ${businessData.finance.netProfit.toLocaleString('pt-BR')}
- **Margem:** ${businessData.finance.totalRevenue > 0 ? ((businessData.finance.netProfit / businessData.finance.totalRevenue) * 100).toFixed(1) : 0}%

## 🎯 Performance de Vendas
- **Leads Processados:** ${businessData.leads.total}
- **Taxa de Conversão:** ${businessData.leads.conversionRate}%
- **Receita por Lead:** R$ ${businessData.leads.total > 0 ? (businessData.finance.totalRevenue / businessData.leads.total).toLocaleString('pt-BR') : '0'}

## ⚡ Produtividade
- **Taxa de Conclusão:** ${businessData.tasks.completionRate}%
- **Tarefas em Atraso:** ${businessData.tasks.overdue}

## 🚀 Recomendações
${businessData.recommendations.map(rec => `- ${rec}`).join('\n')}`

      case 'strategic':
        return `# 🎯 Relatório Estratégico

## Análise SWOT Automatizada

### 💪 Forças
${businessData.leads.conversionRate > 10 ? '- Alta taxa de conversão de leads' : ''}
${businessData.tasks.completionRate > 70 ? '- Boa produtividade da equipe' : ''}
${businessData.finance.netProfit > 0 ? '- Lucratividade positiva' : ''}

### ⚠️ Fraquezas
${businessData.tasks.overdue > 0 ? `- ${businessData.tasks.overdue} tarefas em atraso` : ''}
${businessData.leads.conversionRate < 5 ? '- Taxa de conversão baixa' : ''}
${businessData.finance.netProfit < 0 ? '- Resultado financeiro negativo' : ''}

### 🔍 Oportunidades Identificadas
- Otimização do funil de vendas
- Automação de processos repetitivos
- Expansão para novos segmentos

### 🎯 Plano de Ação Recomendado
1. **Curto Prazo (30 dias):**
   - Resolver tarefas em atraso
   - Implementar follow-ups automatizados

2. **Médio Prazo (90 dias):**
   - Otimizar processo de qualificação
   - Revisar estrutura de custos

3. **Longo Prazo (6 meses):**
   - Expandir equipe de vendas
   - Implementar novas tecnologias`

      default:
        return 'Relatório em desenvolvimento...'
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem('coreoracle-messages')
  }

  const handleBackToLanding = () => {
    window.location.href = '/'
  }

  const quickActions = [
    { 
      label: 'Análise de Vendas', 
      icon: TrendingUp, 
      action: () => setInputMessage('Faça uma análise detalhada das minhas vendas e conversões') 
    },
    { 
      label: 'Performance da Equipe', 
      icon: Users, 
      action: () => setInputMessage('Como está a produtividade da minha equipe?') 
    },
    { 
      label: 'Saúde Financeira', 
      icon: DollarSign, 
      action: () => setInputMessage('Analise a saúde financeira do meu negócio') 
    },
    { 
      label: 'Relatório Estratégico', 
      icon: Target, 
      action: () => generateReport('strategic') 
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg: px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 rounded-lg mr-3">
                  <Brain size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">CoreOracle</h1>
                  <p className="text-sm text-gray-600">Consultor Estratégico Inteligente</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                title="Configurações"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={handleBackToLanding}
                className="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Voltar à página inicial"
              >
                <Home size={20} className="mr-2" />
                <span className="hidden sm:inline">Página Inicial</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Business Metrics */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="mr-2 text-indigo-600" size={20} />
                Métricas do Negócio
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Conversão de Leads</span>
                    <span className="font-medium">{leadStats?.conversionRate || '0%'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: leadStats?.conversionRate?.replace('%', '') + '%' || '0%' }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Produtividade</span>
                    <span className="font-medium">{taskStats?.completionRate || '0%'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: taskStats?.completionRate?.replace('%', '') + '%' || '0%' }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Margem de Lucro</span>
                    <span className="font-medium">
                      {financeStats?.monthlyIncome && financeStats?.monthlyExpenses 
                        ? ((financeStats.monthlyIncome - financeStats.monthlyExpenses) / financeStats.monthlyIncome * 100).toFixed(1) + '%'
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ 
                        width: financeStats?.monthlyIncome && financeStats?.monthlyExpenses 
                          ? ((financeStats.monthlyIncome - financeStats.monthlyExpenses) / financeStats.monthlyIncome * 100) + '%'
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="mr-2 text-amber-500" size={20} />
                Ações Rápidas
              </h3>
              
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <action.icon className="mr-3 text-gray-500" size={18} />
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reports */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="mr-2 text-green-600" size={20} />
                Relatórios
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => generateReport('monthly')}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <Calendar className="mr-3 text-gray-500" size={18} />
                  <span className="text-sm font-medium text-gray-700">Relatório Mensal</span>
                </button>
                
                <button
                  onClick={() => generateReport('expense')}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <PieChart className="mr-3 text-gray-500" size={18} />
                  <span className="text-sm font-medium text-gray-700">Análise de Gastos</span>
                </button>
                
                <button
                  onClick={() => generateReport('cashflow')}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <Activity className="mr-3 text-gray-500" size={18} />
                  <span className="text-sm font-medium text-gray-700">Fluxo de Caixa</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)]">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 rounded-lg mr-3">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">CoreOracle</h3>
                    <p className="text-xs text-gray-600">Analisando dados de CRM, tarefas e finanças</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (confirm('Limpar todo o histórico de conversa?')) {
                        clearChat()
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                    title="Limpar conversa"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="animate-spin" size={16} />
                        <span>{message.content || 'Gerando resposta...'}</span>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {message.reportType ? (
                          <div>
                            <div className="font-medium mb-2">
                              {message.reportType === 'monthly' && '📊 Relatório Mensal'}
                              {message.reportType === 'expense' && '📉 Análise de Gastos'}
                              {message.reportType === 'cashflow' && '💰 Fluxo de Caixa'}
                              {message.reportType === 'strategic' && '🎯 Relatório Estratégico'}
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br>') }} />
                            <div className="mt-3">
                              <button
                                onClick={() => {
                                  alert('Relatório baixado com sucesso!')
                                }}
                                className="flex items-center text-xs text-indigo-600 hover:text-indigo-800"
                              >
                                <Download size={12} className="mr-1" />
                                Baixar como PDF
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br>') }} />
                        )}
                      </div>
                    )}
                    <div className="mt-1 text-right">
                      <span className={`text-xs ${message.type === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Pergunte algo ao consultor estratégico..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Lightbulb size={12} className="mr-1" />
                <span>Dica: Pergunte sobre vendas, produtividade, finanças ou solicite um relatório estratégico</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Configurações do CoreOracle
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provedor de IA
                </label>
                <select
                  value={oracleSettings.aiProvider}
                  onChange={(e) => setOracleSettings({ ...oracleSettings, aiProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="anthropic" disabled>Anthropic (Claude) - Em breve</option>
                  <option value="google" disabled>Google (Gemini) - Em breve</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo
                </label>
                <select
                  value={oracleSettings.model}
                  onChange={(e) => setOracleSettings({ ...oracleSettings, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais rápido e econômico)</option>
                  <option value="gpt-4">GPT-4 (Mais inteligente)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo (Equilibrado)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave da API (Opcional)
                </label>
                <input
                  type="password"
                  value={oracleSettings.apiKey}
                  onChange={(e) => setOracleSettings({ ...oracleSettings, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="sk-..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se configurada, substitui a integração do CRM. Mantenha em branco para usar a integração global.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt do Sistema
                </label>
                <textarea
                  value={oracleSettings.systemPrompt}
                  onChange={(e) => setOracleSettings({ ...oracleSettings, systemPrompt: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define a personalidade e comportamento do assistente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperatura (0-1)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={oracleSettings.temperature}
                    onChange={(e) => setOracleSettings({ ...oracleSettings, temperature: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valores mais baixos = mais previsível, mais altos = mais criativo
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    step="100"
                    value={oracleSettings.maxTokens}
                    onChange={(e) => setOracleSettings({ ...oracleSettings, maxTokens: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Limite máximo de tokens na resposta
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profundidade de Análise
                </label>
                <select
                  value={oracleSettings.analysisDepth}
                  onChange={(e) => setOracleSettings({ ...oracleSettings, analysisDepth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="basic">Básica - Análise rápida e direta</option>
                  <option value="detailed">Detalhada - Análise completa com recomendações</option>
                  <option value="comprehensive">Abrangente - Análise profunda com plano de ação</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="text-yellow-600 mr-3" size={20} />
                  <div>
                    <p className="text-yellow-800 font-medium">Importante</p>
                    <p className="text-yellow-700 text-sm">
                      Suas configurações são salvas apenas neste navegador. Para usar uma integração global, configure-a no CoreCRM.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-4">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={saveSettings}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}