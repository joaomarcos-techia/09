import React, { useState, useRef } from 'react'
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
  Plus,
  Send,
  Loader2,
  Trash2,
  MessageSquare
} from 'lucide-react'
import { useInsights } from '../../hooks/useInsights'
import { useAutomations } from '../../hooks/useAutomations'
import { useIntegrations } from '../../hooks/useIntegrations'

interface CorePulseProps {
  onBack: () => void
}

export function CorePulse({ onBack }: CorePulseProps) {
  const { insights, loading: insightsLoading, markAsRead, markAsApplied, createInsight, deleteInsight } = useInsights()
  const { automations, loading: automationsLoading } = useAutomations()
  const { getIntegrationByService } = useIntegrations()
  const [selectedTab, setSelectedTab] = useState<'insights' | 'automations' | 'assistant'>('insights')
  const [assistantMessage, setAssistantMessage] = useState('')
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

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

  const handleMarkAsRead = async (insightId: string) => {
    await markAsRead(insightId)
  }

  const handleMarkAsApplied = async (insightId: string) => {
    await markAsApplied(insightId)
  }

  const handleDeleteInsight = async (insightId: string) => {
    if (confirm('Tem certeza que deseja excluir este insight?')) {
      await deleteInsight(insightId)
    }
  }

  const handleBackToLanding = () => {
    window.location.href = '/'
  }

  const handleSendToAssistant = async () => {
    if (!assistantMessage.trim()) return
    
    const aiIntegration = getIntegrationByService('ai')
    if (!aiIntegration?.is_active) {
      setAssistantResponse('Você precisa configurar a integração com IA primeiro. Vá para a aba "Integrações" no CoreCRM.')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Simular resposta da IA (em produção, isso seria uma chamada real à API)
      setTimeout(() => {
        // Criar um insight com a pergunta e resposta
        createInsight({
          type: 'assistant_query',
          title: assistantMessage.length > 50 ? assistantMessage.substring(0, 50) + '...' : assistantMessage,
          description: 'Baseado na análise dos seus dados, recomendo focar em aumentar a conversão de leads e otimizar seus gastos com marketing. Seus leads do WhatsApp têm uma taxa de conversão 23% maior que os de email.',
          priority: 2,
          data: {
            query: assistantMessage,
            timestamp: new Date().toISOString()
          }
        })
        
        setAssistantResponse('Baseado na análise dos seus dados, recomendo focar em aumentar a conversão de leads e otimizar seus gastos com marketing. Seus leads do WhatsApp têm uma taxa de conversão 23% maior que os de email.')
        setIsProcessing(false)
      }, 2000)
    } catch (error) {
      console.error('Error querying assistant:', error)
      setAssistantResponse('Erro ao processar sua solicitação. Tente novamente mais tarde.')
      setIsProcessing(false)
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

        {selectedTab === 'insights' ? (
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
              </div>
            ) : (
              <div className="space-y-6">
                {insights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                      insight.is_read ? 'border-gray-300' : 'border-purple-500'
                    }`}
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

                        <p className="text-gray-600 mb-4">{insight.description}</p>

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
                            onClick={() => handleMarkAsRead(insight.id)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Marcar como lido"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {!insight.is_applied && (
                          <button
                            onClick={() => handleMarkAsApplied(insight.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Marcar como aplicado"
                          >
                            <ThumbsUp size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInsight(insight.id)}
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
          </div>
        ) : selectedTab === 'automations' ? (
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
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                  Criar Primeira Automação
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {automations.map((automation) => (
                  <div key={automation.id} className="bg-white rounded-xl shadow-sm p-6">
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
                            <p className="font-medium">{automation.trigger_type}</p>
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
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                          Editar
                        </button>
                        <button 
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
        ) : (
          <div>
            {/* AI Assistant */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-purple-50">
                <div className="flex items-center">
                  <Brain className="text-purple-600 mr-3" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Assistente IA</h3>
                    <p className="text-sm text-purple-600">
                      Faça perguntas sobre seus dados e obtenha insights personalizados
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Response Area */}
                {assistantResponse && (
                  <div className="mb-6 bg-purple-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-start">
                      <Brain className="text-purple-600 mr-3 mt-1" size={20} />
                      <div>
                        <h4 className="font-medium text-purple-900 mb-2">Resposta do Assistente</h4>
                        <p className="text-gray-700">{assistantResponse}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Input Area */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    O que você gostaria de saber sobre seu negócio?
                  </label>
                  <textarea
                    ref={messageInputRef}
                    value={assistantMessage}
                    onChange={(e) => setAssistantMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Quais são meus leads mais promissores? Como posso melhorar minha taxa de conversão? Qual é a tendência dos meus gastos?"
                  />
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleSendToAssistant}
                      disabled={isProcessing || !assistantMessage.trim()}
                      className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2" size={16} />
                          Enviar Pergunta
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Example Questions */}
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Perguntas Sugeridas:
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      "Como posso melhorar minha taxa de conversão de leads?",
                      "Quais são meus principais gastos este mês?",
                      "Quais tarefas estão atrasadas e precisam de atenção?",
                      "Qual canal de vendas está performando melhor?"
                    ].map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setAssistantMessage(question)
                          if (messageInputRef.current) {
                            messageInputRef.current.focus()
                          }
                        }}
                        className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 flex items-start"
                      >
                        <MessageSquare size={14} className="mr-2 mt-0.5 text-purple-500" />
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* AI Integration Notice */}
                {!getIntegrationByService('ai')?.is_active && (
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="text-yellow-600 mr-3 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Integração com IA não configurada</h4>
                        <p className="text-yellow-700 text-sm">
                          Para usar o assistente com todo o potencial, configure a integração com OpenAI na aba "Integrações" do CoreCRM.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}