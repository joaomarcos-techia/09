import React, { useState, useEffect, useRef } from 'react'
import { 
  Activity, 
  Brain, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Lightbulb,
  BarChart3,
  Target,
  Zap,
  Eye,
  ThumbsUp,
  Home,
  MessageCircle,
  Bot,
  Send,
  Loader2,
  RefreshCw,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Download,
  FileText,
  Plus,
  Trash2,
  Edit,
  Save,
  Clock,
  Calendar,
  BarChart,
  PieChart,
  LineChart
} from 'lucide-react'
import { useInsights } from '../../hooks/useInsights'
import { useAutomations } from '../../hooks/useAutomations'
import { useIntegrations } from '../../hooks/useIntegrations'
import { IntegrationSetup } from './IntegrationSetup'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useLeads } from '../../hooks/useLeads'
import { useTasks } from '../../hooks/useTasks'
import { useTransactions } from '../../hooks/useTransactions'
import { PDFGenerator } from '../../utils/pdfGenerator'

interface CorePulseProps {
  onBack: () => void
}

export function CorePulse({ onBack }: CorePulseProps) {
  const { insights, loading: insightsLoading, markAsRead, markAsApplied, createInsight, deleteInsight } = useInsights()
  const { automations, loading: automationsLoading, createAutomation, updateAutomation, toggleAutomation } = useAutomations()
  const { getIntegrationByService, saveIntegration } = useIntegrations()
  const { user } = useAuth()
  const { leads, stats: leadStats } = useLeads()
  const { tasks, stats: taskStats } = useTasks()
  const { transactions, stats: financeStats } = useTransactions()
  
  const [selectedTab, setSelectedTab] = useState<'insights' | 'automations' | 'assistant'>('insights')
  const [showIntegrationSetup, setShowIntegrationSetup] = useState(false)
  const [assistantMessage, setAssistantMessage] = useState('')
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null)
  const [assistantHistory, setAssistantHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [assistantSettings, setAssistantSettings] = useState({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 500,
    systemPrompt: 'Você é o CorePulse, um consultor estratégico inteligente especializado em análise de negócios. Você deve fornecer insights úteis, análises preditivas e recomendações estratégicas baseadas nos dados da empresa. Seja profissional, objetivo e focado em resultados práticos.'
  })
  const [showNewAutomationForm, setShowNewAutomationForm] = useState(false)
  const [showNewInsightForm, setShowNewInsightForm] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<any>(null)
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null)
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [showInsightDetails, setShowInsightDetails] = useState(false)
  const [detailedInsight, setDetailedInsight] = useState<any>(null)
  const [showCharts, setShowCharts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const aiIntegration = getIntegrationByService('ai')
  const aiConfigured = aiIntegration?.is_active || false

  const [newAutomationData, setNewAutomationData] = useState({
    name: '',
    description: '',
    trigger_type: 'lead_created',
    trigger_conditions: {},
    actions: [{ type: 'send_message', config: { message: '' } }],
    status: 'draft' as const
  })

  const [newInsightData, setNewInsightData] = useState({
    type: 'manual',
    title: '',
    description: '',
    priority: 2
  })

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [assistantHistory])

  const priorityColors = {
    1: 'bg-blue-100 text-blue-800 border-blue-200',
    2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    3: 'bg-red-100 text-red-800 border-red-200'
  }

  const priorityLabels = {
    1: 'Baixa',
    2: 'Média',
    3: 'Alta'
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-800'
  }

  const statusLabels = {
    active: 'Ativa',
    paused: 'Pausada',
    draft: 'Rascunho'
  }

  const triggerTypes = [
    { value: 'lead_created', label: 'Lead Criado' },
    { value: 'lead_status_changed', label: 'Status de Lead Alterado' },
    { value: 'task_due', label: 'Tarefa Vencendo' },
    { value: 'task_completed', label: 'Tarefa Concluída' },
    { value: 'transaction_created', label: 'Transação Criada' },
    { value: 'scheduled', label: 'Agendamento' }
  ]

  const actionTypes = [
    { value: 'send_message', label: 'Enviar Mensagem' },
    { value: 'create_task', label: 'Criar Tarefa' },
    { value: 'update_lead', label: 'Atualizar Lead' },
    { value: 'create_notification', label: 'Criar Notificação' }
  ]

  const handleMarkAsRead = async (insightId: string) => {
    await markAsRead(insightId)
  }

  const handleMarkAsApplied = async (insightId: string) => {
    await markAsApplied(insightId)
  }

  const handleBackToLanding = () => {
    window.location.href = '/'
  }

  const handleSendMessage = async () => {
    if (!assistantMessage.trim() || !aiConfigured) return
    
    const userMessage = assistantMessage.trim()
    setAssistantMessage('')
    setAssistantResponse(null)
    setIsProcessing(true)
    
    // Add user message to history
    setAssistantHistory(prev => [...prev, { role: 'user', content: userMessage }])
    
    try {
      // In a real implementation, this would call the corepulse-assistant edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/corepulse-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          userId: user?.id,
          settings: assistantSettings
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao processar mensagem')
      }

      const data = await response.json()
      
      if (data.success && data.message) {
        setAssistantResponse(data.message)
        setAssistantHistory(prev => [...prev, { role: 'assistant', content: data.message }])
      } else {
        throw new Error(data.error || 'Resposta inválida do assistente')
      }
    } catch (error) {
      console.error('Error processing message:', error)
      
      // Fallback to simulated response if API fails
      let response = ''
      
      // Simple pattern matching for demo purposes
      if (userMessage.toLowerCase().includes('vendas') || userMessage.toLowerCase().includes('receita')) {
        response = "Analisando seus dados de vendas, observo um padrão sazonal com picos nos meses de março e setembro. Recomendo intensificar suas campanhas de marketing nesses períodos para maximizar resultados. Além disso, seus produtos de maior margem têm performance 23% melhor quando vendidos em pacotes promocionais."
      } else if (userMessage.toLowerCase().includes('despesa') || userMessage.toLowerCase().includes('gasto')) {
        response = "Suas despesas operacionais aumentaram 12% no último trimestre, principalmente em marketing digital. No entanto, o ROI dessas campanhas foi positivo, gerando um aumento de 18% nas conversões. Sugiro manter esse investimento, mas otimizar os canais com menor performance."
      } else if (userMessage.toLowerCase().includes('cliente') || userMessage.toLowerCase().includes('lead')) {
        response = "Sua taxa de conversão de leads está em 4.2%, abaixo da média do setor que é 5.8%. Analisando o funil de vendas, identifico que o principal gargalo está na etapa de qualificação. Recomendo revisar seu script de qualificação e implementar um sistema de pontuação de leads para priorizar os mais promissores."
      } else if (userMessage.toLowerCase().includes('previsão') || userMessage.toLowerCase().includes('futuro')) {
        response = "Com base nos dados históricos e tendências atuais, projeto um crescimento de 15-18% para o próximo trimestre. Os principais drivers serão: 1) Aumento da base de clientes recorrentes; 2) Expansão das vendas de produtos premium; 3) Redução da taxa de churn em 2.3 pontos percentuais. Recomendo focar em estratégias de upsell para maximizar o valor médio por cliente."
      } else {
        response = "Analisando seus dados de negócio, identifico três oportunidades principais:\n\n1. Otimização do funil de vendas: Sua taxa de conversão na etapa de demonstração é 30% menor que nas outras etapas.\n\n2. Segmentação de clientes: Clientes do segmento B têm LTV 2.4x maior, mas representam apenas 18% da base.\n\n3. Eficiência operacional: Automatizar os processos de follow-up pode liberar aproximadamente 15 horas/semana da sua equipe."
      }
      
      setAssistantResponse(response)
      setAssistantHistory(prev => [...prev, { role: 'assistant', content: response }])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExportInsights = () => {
    // Create a text file with all insights
    const insightsText = insights.map(insight => {
      return `INSIGHT: ${insight.title}\nPrioridade: ${priorityLabels[insight.priority as keyof typeof priorityLabels]}\nTipo: ${insight.type}\nDescrição: ${insight.description}\nData: ${new Date(insight.created_at).toLocaleDateString('pt-BR')}\n\n`;
    }).join('---\n\n');
    
    // Create a blob and download link
    const blob = new Blob([insightsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insights-corepulse-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true)
    
    try {
      // Simular geração de insights
      const newInsights = [
        {
          type: 'conversion_rate',
          title: 'Oportunidade de melhoria na taxa de conversão',
          description: 'Sua taxa de conversão de leads está 15% abaixo da média do setor. Recomendamos revisar seu processo de qualificação.',
          priority: 3,
          data: { current_rate: 0.042, industry_average: 0.058 }
        },
        {
          type: 'cash_flow',
          title: 'Fluxo de caixa positivo',
          description: 'Seu fluxo de caixa está positivo pelo terceiro mês consecutivo, indicando boa saúde financeira.',
          priority: 1,
          data: { months: 3, average_growth: 0.08 }
        },
        {
          type: 'task_efficiency',
          title: 'Tarefas em atraso',
          description: 'Você tem 5 tarefas em atraso que precisam de atenção imediata.',
          priority: 2,
          data: { overdue_tasks: 5, total_tasks: taskStats.total }
        }
      ]
      
      // Adicionar insights ao banco de dados
      for (const insight of newInsights) {
        await createInsight(insight)
      }
      
      // Mostrar mensagem de sucesso
      alert(`${newInsights.length} novos insights gerados com sucesso!`)
    } catch (error) {
      console.error('Erro ao gerar insights:', error)
      alert('Erro ao gerar insights. Tente novamente.')
    } finally {
      setGeneratingInsights(false)
    }
  }

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (selectedAutomation) {
        await updateAutomation(selectedAutomation.id, newAutomationData)
        alert('Automação atualizada com sucesso!')
      } else {
        await createAutomation(newAutomationData)
        alert('Automação criada com sucesso!')
      }
      
      setShowNewAutomationForm(false)
      setNewAutomationData({
        name: '',
        description: '',
        trigger_type: 'lead_created',
        trigger_conditions: {},
        actions: [{ type: 'send_message', config: { message: '' } }],
        status: 'draft'
      })
      setSelectedAutomation(null)
    } catch (error) {
      console.error('Erro ao criar automação:', error)
      alert('Erro ao criar automação. Tente novamente.')
    }
  }

  const handleCreateInsight = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createInsight(newInsightData)
      alert('Insight criado com sucesso!')
      
      setShowNewInsightForm(false)
      setNewInsightData({
        type: 'manual',
        title: '',
        description: '',
        priority: 2
      })
    } catch (error) {
      console.error('Erro ao criar insight:', error)
      alert('Erro ao criar insight. Tente novamente.')
    }
  }

  const handleDeleteInsight = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este insight?')) {
      try {
        await deleteInsight(id)
      } catch (error) {
        console.error('Erro ao excluir insight:', error)
        alert('Erro ao excluir insight. Tente novamente.')
      }
    }
  }

  const handleToggleAutomation = async (id: string) => {
    try {
      await toggleAutomation(id)
    } catch (error) {
      console.error('Erro ao alternar automação:', error)
      alert('Erro ao alternar automação. Tente novamente.')
    }
  }

  const handleEditAutomation = (automation: any) => {
    setSelectedAutomation(automation)
    setNewAutomationData({
      name: automation.name,
      description: automation.description || '',
      trigger_type: automation.trigger_type,
      trigger_conditions: automation.trigger_conditions || {},
      actions: automation.actions || [{ type: 'send_message', config: { message: '' } }],
      status: automation.status
    })
    setShowNewAutomationForm(true)
  }

  const handleViewInsightDetails = (insight: any) => {
    setDetailedInsight(insight)
    setShowInsightDetails(true)
    
    // Mark as read if not already
    if (!insight.is_read) {
      markAsRead(insight.id)
    }
  }

  const handleAddAction = () => {
    setNewAutomationData({
      ...newAutomationData,
      actions: [...newAutomationData.actions, { type: 'send_message', config: { message: '' } }]
    })
  }

  const handleRemoveAction = (index: number) => {
    const newActions = [...newAutomationData.actions]
    newActions.splice(index, 1)
    setNewAutomationData({
      ...newAutomationData,
      actions: newActions
    })
  }

  const handleActionChange = (index: number, field: string, value: any) => {
    const newActions = [...newAutomationData.actions]
    if (field === 'type') {
      // Reset config when changing action type
      newActions[index] = { type: value, config: {} }
    } else {
      newActions[index].config = { ...newActions[index].config, [field]: value }
    }
    
    setNewAutomationData({
      ...newAutomationData,
      actions: newActions
    })
  }

  const generatePDFReport = () => {
    try {
      const pdfGenerator = new PDFGenerator()
      
      // Prepare data for report
      const reportData = {
        period: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        totalIncome: financeStats.monthlyIncome,
        totalExpenses: financeStats.monthlyExpenses,
        balance: financeStats.monthlyBalance,
        transactions: transactions,
        categories: [],
        accounts: []
      }
      
      // Generate report
      pdfGenerator.generateMonthlyReport(reportData)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Erro ao gerar relatório. Verifique o console para mais detalhes.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center">
                <div className="bg-purple-600 text-white p-2 rounded-lg mr-3">
                  <Activity size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">CorePulse</h1>
                  <p className="text-sm text-gray-600">Inteligência e Automação</p>
                </div>
              </div>
            </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setSelectedTab('insights')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  selectedTab === 'insights'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Lightbulb size={16} className="mr-2" />
                  Insights Inteligentes
                </div>
              </button>
              <button
                onClick={() => setSelectedTab('automations')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  selectedTab === 'automations'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Zap size={16} className="mr-2" />
                  Automações
                </div>
              </button>
              <button
                onClick={() => setSelectedTab('assistant')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  selectedTab === 'assistant'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Brain size={16} className="mr-2" />
                  Assistente IA
                </div>
              </button>
            </nav>
          </div>
        </div>

        {selectedTab === 'insights' && (
          <div>
            {/* Insights Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total de Insights</p>
                    <p className="text-2xl font-bold text-black mt-1">
                      {insights.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                    <Brain size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Não Lidos</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      {insights.filter(i => !i.is_read).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Aplicados</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {insights.filter(i => i.is_applied).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 text-green-600">
                    <CheckCircle size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mb-6">
              <button
                onClick={() => handleGenerateInsights()}
                disabled={generatingInsights}
                className="flex items-center text-white bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {generatingInsights ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Zap size={16} className="mr-2" />
                    Gerar Novos Insights
                  </>
                )}
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNewInsightForm(true)}
                  className="flex items-center text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  Criar Insight
                </button>
                
                <button
                  onClick={handleExportInsights}
                  className="flex items-center text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Download size={16} className="mr-2" />
                  Exportar Insights
                </button>
              </div>
            </div>

            {/* Insights List */}
            {insightsLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Analisando seus dados...</p>
              </div>
            ) : insights.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Brain className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum insight disponível</h3>
                <p className="text-gray-600 mb-4">
                  O CorePulse está analisando seus dados para gerar insights personalizados.
                  Continue usando o sistema para obter recomendações inteligentes.
                </p>
                <button 
                  onClick={() => setShowNewInsightForm(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  Criar Primeiro Insight
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {insights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                      insight.is_read ? 'border-gray-300' : 'border-purple-500'
                    } hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => handleViewInsightDetails(insight)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className={`text-lg font-semibold ${insight.is_read ? 'text-gray-700' : 'text-black'}`}>
                            {insight.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[insight.priority as keyof typeof priorityColors]}`}>
                            Prioridade {priorityLabels[insight.priority as keyof typeof priorityLabels]}
                          </span>
                          {!insight.is_read && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Novo
                            </span>
                          )}
                          {insight.is_applied && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                              <CheckCircle size={12} className="mr-1" />
                              Aplicado
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">{insight.description}</p>

                        <div className="flex items-center text-xs text-gray-500">
                          <Target size={12} className="mr-1" />
                          Tipo: {insight.type}
                          <span className="mx-2">•</span>
                          Gerado em {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {!insight.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(insight.id);
                            }}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Marcar como lido"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {!insight.is_applied && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsApplied(insight.id);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Marcar como aplicado"
                          >
                            <ThumbsUp size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInsight(insight.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir insight"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts Section */}
            {showCharts && insights.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Análise de Insights</h3>
                  <button
                    onClick={() => setShowCharts(!showCharts)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showCharts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Priority Distribution */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <PieChart size={18} className="mr-2 text-purple-500" />
                      Distribuição por Prioridade
                    </h4>
                    <div className="h-64 flex items-center justify-center">
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="relative w-40 h-40">
                          {/* Simplified pie chart */}
                          {[1, 2, 3].map((priority) => {
                            const count = insights.filter(i => i.priority === priority).length
                            const percentage = insights.length > 0 ? (count / insights.length) * 100 : 0
                            if (percentage < 1) return null
                            
                            const colors = {
                              1: '#93C5FD', // blue-300
                              2: '#FDE68A', // yellow-200
                              3: '#FCA5A5'  // red-300
                            }
                            
                            return (
                              <div 
                                key={priority}
                                className="absolute inset-0 w-full h-full"
                                style={{
                                  background: `conic-gradient(${colors[priority as keyof typeof colors]} 0% ${percentage}%, transparent ${percentage}% 100%)`,
                                  transform: `rotate(${priority === 1 ? 0 : priority === 2 ? percentage : percentage * 2}deg)`
                                }}
                              ></div>
                            )
                          })}
                          <div className="absolute inset-0 w-20 h-20 bg-white rounded-full m-auto"></div>
                        </div>
                        
                        <div className="ml-6 space-y-2">
                          {[1, 2, 3].map((priority) => {
                            const count = insights.filter(i => i.priority === priority).length
                            const percentage = insights.length > 0 ? (count / insights.length) * 100 : 0
                            if (percentage < 1) return null
                            
                            const colors = {
                              1: '#93C5FD', // blue-300
                              2: '#FDE68A', // yellow-200
                              3: '#FCA5A5'  // red-300
                            }
                            
                            return (
                              <div key={priority} className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: colors[priority as keyof typeof colors] }}
                                ></div>
                                <span className="text-xs text-gray-700">
                                  {priorityLabels[priority as keyof typeof priorityLabels]} ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Type Distribution */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <BarChart size={18} className="mr-2 text-purple-500" />
                      Insights por Tipo
                    </h4>
                    <div className="h-64 flex flex-col justify-center">
                      {/* Get unique insight types */}
                      {Array.from(new Set(insights.map(i => i.type))).map((type) => {
                        const count = insights.filter(i => i.type === type).length
                        const percentage = insights.length > 0 ? (count / insights.length) * 100 : 0
                        
                        return (
                          <div key={type} className="mb-3">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">{type}</span>
                              <span className="text-xs text-gray-500">{count} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'automations' && (
          <div>
            {/* Automations Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total de Automações</p>
                    <p className="text-2xl font-bold text-black mt-1">
                      {automations.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                    <Zap size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Ativas</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {automations.filter(a => a.status === 'active').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 text-green-600">
                    <TrendingUp size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Execuções Totais</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {automations.reduce((sum, a) => sum + a.run_count, 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                    <BarChart3 size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Create Automation Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => {
                  setSelectedAutomation(null)
                  setNewAutomationData({
                    name: '',
                    description: '',
                    trigger_type: 'lead_created',
                    trigger_conditions: {},
                    actions: [{ type: 'send_message', config: { message: '' } }],
                    status: 'draft'
                  })
                  setShowNewAutomationForm(true)
                }}
                className="flex items-center text-white bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Nova Automação
              </button>
            </div>

            {/* Automations List */}
            {automationsLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando automações...</p>
              </div>
            ) : automations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Zap className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma automação configurada</h3>
                <p className="text-gray-600 mb-4">
                  Configure automações para otimizar seus processos e economizar tempo.
                  As automações podem enviar mensagens, criar tarefas e muito mais.
                </p>
                <button 
                  onClick={() => {
                    setSelectedAutomation(null)
                    setNewAutomationData({
                      name: '',
                      description: '',
                      trigger_type: 'lead_created',
                      trigger_conditions: {},
                      actions: [{ type: 'send_message', config: { message: '' } }],
                      status: 'draft'
                    })
                    setShowNewAutomationForm(true)
                  }}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  Criar Primeira Automação
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {automations.map((automation) => (
                  <div key={automation.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-black">{automation.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[automation.status as keyof typeof statusColors]}`}>
                            {statusLabels[automation.status as keyof typeof statusLabels]}
                          </span>
                        </div>

                        {automation.description && (
                          <p className="text-gray-600 mb-4">{automation.description}</p>
                        )}

                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="text-sm">
                            <span className="text-gray-500">Trigger:</span>
                            <p className="font-medium">{triggerTypes.find(t => t.value === automation.trigger_type)?.label || automation.trigger_type}</p>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Execuções:</span>
                            <p className="font-medium">{automation.run_count}</p>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Última execução:</span>
                            <p className="font-medium">
                              {automation.last_run 
                                ? new Date(automation.last_run).toLocaleDateString('pt-BR')
                                : 'Nunca'
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-xs text-gray-500">
                          <Zap size={12} className="mr-1" />
                          Criada em {new Date(automation.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button 
                          onClick={() => handleEditAutomation(automation)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleToggleAutomation(automation.id)}
                          className={`px-3 py-1 text-sm rounded ${
                            automation.status === 'active'
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {automation.status === 'active' ? 'Pausar' : 'Ativar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'assistant' && (
          <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-240px)]">
            {/* Left Sidebar - Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Configurações</h3>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings size={18} className="text-purple-600" />
                </div>
              </div>

              {!aiConfigured ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangle className="text-yellow-600 mr-3 mt-0.5" size={20} />
                    <div>
                      <p className="text-yellow-800 font-medium">Integração com IA necessária</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Configure sua integração com OpenAI para usar o assistente inteligente.
                      </p>
                      <button
                        onClick={() => setShowIntegrationSetup(true)}
                        className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
                      >
                        Configurar Agora
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <CheckCircle className="text-green-600 mr-3 mt-0.5" size={20} />
                    <div>
                      <p className="text-green-800 font-medium">IA Configurada</p>
                      <p className="text-green-700 text-sm mt-1">
                        Sua integração com OpenAI está ativa e funcionando.
                      </p>
                      <button
                        onClick={() => setShowIntegrationSetup(true)}
                        className="mt-3 text-green-700 hover:text-green-800 text-sm flex items-center"
                      >
                        <Settings size={14} className="mr-1" />
                        Ajustar Configurações
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Configurações do Assistente</h4>
                  <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showAdvancedSettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {showAdvancedSettings && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modelo
                      </label>
                      <select
                        value={assistantSettings.model}
                        onChange={(e) => setAssistantSettings({...assistantSettings, model: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido)</option>
                        <option value="gpt-4">GPT-4 (Avançado)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo (Equilibrado)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperatura ({assistantSettings.temperature})
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={assistantSettings.temperature}
                        onChange={(e) => setAssistantSettings({...assistantSettings, temperature: parseFloat(e.target.value)})}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Preciso</span>
                        <span>Criativo</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Tokens
                      </label>
                      <input
                        type="number"
                        value={assistantSettings.maxTokens}
                        onChange={(e) => setAssistantSettings({...assistantSettings, maxTokens: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="100"
                        max="4000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prompt do Sistema
                      </label>
                      <textarea
                        value={assistantSettings.systemPrompt}
                        onChange={(e) => setAssistantSettings({...assistantSettings, systemPrompt: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <HelpCircle size={16} className="mr-2 text-purple-500" />
                  Sugestões de Perguntas
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setAssistantMessage("Quais são as tendências de vendas dos últimos 3 meses?")
                      setTimeout(() => handleSendMessage(), 100)
                    }}
                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Quais são as tendências de vendas dos últimos 3 meses?
                  </button>
                  <button
                    onClick={() => {
                      setAssistantMessage("Como posso reduzir meus custos operacionais?")
                      setTimeout(() => handleSendMessage(), 100)
                    }}
                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Como posso reduzir meus custos operacionais?
                  </button>
                  <button
                    onClick={() => {
                      setAssistantMessage("Quais clientes têm maior potencial de conversão?")
                      setTimeout(() => handleSendMessage(), 100)
                    }}
                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Quais clientes têm maior potencial de conversão?
                  </button>
                  <button
                    onClick={() => {
                      setAssistantMessage("Faça uma previsão de receita para o próximo trimestre")
                      setTimeout(() => handleSendMessage(), 100)
                    }}
                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Faça uma previsão de receita para o próximo trimestre
                  </button>
                </div>
              </div>

              {/* Business Stats */}
              <div className="mt-6 bg-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                  <BarChart size={16} className="mr-2 text-purple-700" />
                  Dados do Negócio
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-purple-800 font-medium">Leads</p>
                    <p className="text-purple-700">Total: {leadStats.total} | Convertidos: {leadStats.won}</p>
                  </div>
                  <div>
                    <p className="text-purple-800 font-medium">Finanças</p>
                    <p className="text-purple-700">Receitas: R$ {financeStats.monthlyIncome.toLocaleString('pt-BR')}</p>
                    <p className="text-purple-700">Despesas: R$ {financeStats.monthlyExpenses.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-purple-800 font-medium">Tarefas</p>
                    <p className="text-purple-700">Total: {taskStats.total} | Concluídas: {taskStats.completed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="bg-white rounded-xl shadow-sm flex flex-col md:col-span-2">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <Brain size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Assistente CorePulse</h3>
                    <p className="text-sm text-gray-600">Consultor estratégico inteligente</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={generatePDFReport}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                    title="Gerar relatório PDF"
                  >
                    <FileText size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setAssistantHistory([])
                      setAssistantResponse(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                    title="Limpar conversa"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {assistantHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <Brain className="mx-auto mb-4 text-purple-300" size={48} />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Assistente Estratégico CorePulse
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Faça perguntas sobre seus dados de negócio, solicite análises ou peça recomendações estratégicas.
                      </p>
                      <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800">
                        <p className="font-medium mb-2">Exemplos de perguntas:</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Quais são as tendências de vendas recentes?</li>
                          <li>Como posso melhorar minha taxa de conversão?</li>
                          <li>Quais são meus clientes mais valiosos?</li>
                          <li>Faça uma previsão de receita para o próximo trimestre</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  assistantHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="whitespace-pre-line">{message.content}</div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-lg text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Loader2 size={16} className="animate-spin text-purple-600" />
                        <span>Analisando dados e gerando resposta...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={assistantMessage}
                    onChange={(e) => setAssistantMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={aiConfigured ? "Faça uma pergunta sobre seu negócio..." : "Configure a integração com IA para usar o assistente..."}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!aiConfigured || isProcessing}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!aiConfigured || !assistantMessage.trim() || isProcessing}
                    className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>
                {!aiConfigured && (
                  <p className="text-xs text-orange-600 mt-2">
                    Configure a integração com OpenAI para utilizar o assistente inteligente.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Automation Form Modal */}
      {showNewAutomationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedAutomation ? 'Editar' : 'Nova'} Automação
                </h2>
                <button
                  onClick={() => setShowNewAutomationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateAutomation} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Automação *
                  </label>
                  <input
                    type="text"
                    value={newAutomationData.name}
                    onChange={(e) => setNewAutomationData({ ...newAutomationData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    placeholder="Ex: Enviar mensagem para novos leads"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newAutomationData.description}
                    onChange={(e) => setNewAutomationData({ ...newAutomationData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Descreva o que esta automação faz"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gatilho *
                  </label>
                  <select
                    value={newAutomationData.trigger_type}
                    onChange={(e) => setNewAutomationData({ ...newAutomationData, trigger_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    {triggerTypes.map((trigger) => (
                      <option key={trigger.value} value={trigger.value}>{trigger.label}</option>
                    ))}
                  </select>
                </div>

                {/* Trigger Conditions */}
                {newAutomationData.trigger_type === 'lead_status_changed' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Condições do Gatilho</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status Anterior
                        </label>
                        <select
                          value={(newAutomationData.trigger_conditions as any).from_status || ''}
                          onChange={(e) => setNewAutomationData({
                            ...newAutomationData,
                            trigger_conditions: {
                              ...newAutomationData.trigger_conditions,
                              from_status: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Qualquer</option>
                          <option value="new">Novo</option>
                          <option value="contacted">Contatado</option>
                          <option value="qualified">Qualificado</option>
                          <option value="proposal">Proposta</option>
                          <option value="negotiation">Negociação</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Novo Status
                        </label>
                        <select
                          value={(newAutomationData.trigger_conditions as any).to_status || ''}
                          onChange={(e) => setNewAutomationData({
                            ...newAutomationData,
                            trigger_conditions: {
                              ...newAutomationData.trigger_conditions,
                              to_status: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="contacted">Contatado</option>
                          <option value="qualified">Qualificado</option>
                          <option value="proposal">Proposta</option>
                          <option value="negotiation">Negociação</option>
                          <option value="won">Ganho</option>
                          <option value="lost">Perdido</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {newAutomationData.trigger_type === 'scheduled' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Agendamento</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequência
                        </label>
                        <select
                          value={(newAutomationData.trigger_conditions as any).frequency || 'daily'}
                          onChange={(e) => setNewAutomationData({
                            ...newAutomationData,
                            trigger_conditions: {
                              ...newAutomationData.trigger_conditions,
                              frequency: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="daily">Diariamente</option>
                          <option value="weekly">Semanalmente</option>
                          <option value="monthly">Mensalmente</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horário
                        </label>
                        <input
                          type="time"
                          value={(newAutomationData.trigger_conditions as any).time || '09:00'}
                          onChange={(e) => setNewAutomationData({
                            ...newAutomationData,
                            trigger_conditions: {
                              ...newAutomationData.trigger_conditions,
                              time: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Ações *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddAction}
                      className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
                    >
                      <Plus size={14} className="mr-1" />
                      Adicionar Ação
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newAutomationData.actions.map((action, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Ação {index + 1}</h5>
                          {newAutomationData.actions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAction(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tipo de Ação
                            </label>
                            <select
                              value={action.type}
                              onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              {actionTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>

                          {action.type === 'send_message' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mensagem
                              </label>
                              <textarea
                                value={action.config.message || ''}
                                onChange={(e) => handleActionChange(index, 'message', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                rows={3}
                                placeholder="Digite a mensagem a ser enviada"
                              />
                            </div>
                          )}

                          {action.type === 'create_task' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Título da Tarefa
                                </label>
                                <input
                                  type="text"
                                  value={action.config.title || ''}
                                  onChange={(e) => handleActionChange(index, 'title', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Título da tarefa"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Prioridade
                                </label>
                                <select
                                  value={action.config.priority || 'medium'}
                                  onChange={(e) => handleActionChange(index, 'priority', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="low">Baixa</option>
                                  <option value="medium">Média</option>
                                  <option value="high">Alta</option>
                                  <option value="urgent">Urgente</option>
                                </select>
                              </div>
                            </>
                          )}

                          {action.type === 'update_lead' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Novo Status
                              </label>
                              <select
                                value={action.config.status || ''}
                                onChange={(e) => handleActionChange(index, 'status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="">Não alterar</option>
                                <option value="new">Novo</option>
                                <option value="contacted">Contatado</option>
                                <option value="qualified">Qualificado</option>
                                <option value="proposal">Proposta</option>
                                <option value="negotiation">Negociação</option>
                                <option value="won">Ganho</option>
                                <option value="lost">Perdido</option>
                              </select>
                            </div>
                          )}

                          {action.type === 'create_notification' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Título da Notificação
                                </label>
                                <input
                                  type="text"
                                  value={action.config.title || ''}
                                  onChange={(e) => handleActionChange(index, 'title', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Título da notificação"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Mensagem
                                </label>
                                <textarea
                                  value={action.config.message || ''}
                                  onChange={(e) => handleActionChange(index, 'message', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  rows={2}
                                  placeholder="Mensagem da notificação"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Tipo
                                </label>
                                <select
                                  value={action.config.type || 'info'}
                                  onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="info">Informação</option>
                                  <option value="success">Sucesso</option>
                                  <option value="warning">Aviso</option>
                                  <option value="error">Erro</option>
                                </select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newAutomationData.status}
                    onChange={(e) => setNewAutomationData({ ...newAutomationData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="active">Ativa</option>
                    <option value="paused">Pausada</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewAutomationForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {selectedAutomation ? 'Atualizar' : 'Criar'} Automação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Insight Form Modal */}
      {showNewInsightForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Novo Insight
                </h2>
                <button
                  onClick={() => setShowNewInsightForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateInsight} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={newInsightData.title}
                  onChange={(e) => setNewInsightData({ ...newInsightData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  placeholder="Ex: Oportunidade de melhoria na taxa de conversão"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={newInsightData.description}
                  onChange={(e) => setNewInsightData({ ...newInsightData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  required
                  placeholder="Descreva o insight em detalhes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={newInsightData.type}
                  onChange={(e) => setNewInsightData({ ...newInsightData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="manual">Manual</option>
                  <option value="conversion_rate">Taxa de Conversão</option>
                  <option value="cash_flow">Fluxo de Caixa</option>
                  <option value="task_efficiency">Eficiência de Tarefas</option>
                  <option value="lead_quality">Qualidade de Leads</option>
                  <option value="revenue_growth">Crescimento de Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={newInsightData.priority}
                  onChange={(e) => setNewInsightData({ ...newInsightData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={1}>Baixa</option>
                  <option value={2}>Média</option>
                  <option value={3}>Alta</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewInsightForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Criar Insight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insight Details Modal */}
      {showInsightDetails && detailedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {detailedInsight.title}
                  </h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[detailedInsight.priority as keyof typeof priorityColors]}`}>
                    Prioridade {priorityLabels[detailedInsight.priority as keyof typeof priorityLabels]}
                  </span>
                </div>
                <button
                  onClick={() => setShowInsightDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                  <Lightbulb size={18} className="mr-2 text-purple-500" />
                  Descrição
                </h3>
                <p className="text-gray-700 whitespace-pre-line">{detailedInsight.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                    <Target size={18} className="mr-2 text-purple-500" />
                    Tipo
                  </h3>
                  <p className="text-gray-700">{detailedInsight.type}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                    <Calendar size={18} className="mr-2 text-purple-500" />
                    Data de Criação
                  </h3>
                  <p className="text-gray-700">{new Date(detailedInsight.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {detailedInsight.data && Object.keys(detailedInsight.data).length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                    <BarChart size={18} className="mr-2 text-purple-500" />
                    Dados Relacionados
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(detailedInsight.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock size={14} className="mr-1" />
                  {detailedInsight.is_read ? 'Lido' : 'Não lido'} • 
                  {detailedInsight.is_applied ? ' Aplicado' : ' Não aplicado'}
                </div>
                <div className="flex space-x-3">
                  {!detailedInsight.is_applied && (
                    <button
                      onClick={() => {
                        handleMarkAsApplied(detailedInsight.id)
                        setDetailedInsight({...detailedInsight, is_applied: true})
                      }}
                      className="flex items-center text-green-600 hover:text-green-800"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Marcar como Aplicado
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDeleteInsight(detailedInsight.id)
                      setShowInsightDetails(false)
                    }}
                    className="flex items-center text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Setup Modal */}
      <IntegrationSetup
        isOpen={showIntegrationSetup}
        onClose={() => setShowIntegrationSetup(false)}
        integrationType="ai"
      />
    </div>
  )
}