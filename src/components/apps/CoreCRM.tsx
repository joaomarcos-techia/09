import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  Building,
  Tag,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Send,
  Bot,
  Settings,
  Filter,
  MoreVertical,
  Home,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Star,
  TrendingUp,
  Target,
  Workflow,
  Database,
  Palette,
  Type,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Globe,
  User,
  MapPin,
  FileText,
  Image,
  Paperclip,
  Mic,
  Video,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Activity
} from 'lucide-react'
import { useLeads } from '../../hooks/useLeads'
import { useIntegrations } from '../../hooks/useIntegrations'

interface CoreCRMProps {
  onBack: () => void
}

interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  company?: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  source: string
  value?: number
  notes?: string
  last_contact?: string
  next_follow_up?: string
  created_at: string
  updated_at: string
  custom_fields?: Record<string, any>
  tags?: string[]
}

interface KanbanStage {
  id: string
  name: string
  color: string
  leads: Lead[]
}

interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'email' | 'phone' | 'select' | 'textarea' | 'date' | 'checkbox'
  options?: string[]
  required: boolean
}

interface Integration {
  id: string
  name: string
  type: 'whatsapp' | 'email' | 'ai'
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, any>
}

interface Message {
  id: string
  leadId: string
  content: string
  type: 'whatsapp' | 'email' | 'sms'
  direction: 'inbound' | 'outbound'
  timestamp: string
  isAutomated: boolean
  status: 'sent' | 'delivered' | 'read' | 'failed'
}

export function CoreCRM({ onBack }: CoreCRMProps) {
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'messages' | 'settings' | 'integrations' | 'automation'>('kanban')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [showCustomFields, setShowCustomFields] = useState(false)
  const [showIntegrationSetup, setShowIntegrationSetup] = useState(false)
  const [showAutomationSetup, setShowAutomationSetup] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')

  // Mock data - replace with actual API calls
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      whatsapp: '11999999999',
      company: 'Tech Solutions',
      status: 'new',
      source: 'whatsapp',
      value: 5000,
      notes: 'Interessado em nossos serviços',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: ['quente', 'premium']
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@empresa.com',
      phone: '11888888888',
      company: 'Inovação Corp',
      status: 'contacted',
      source: 'email',
      value: 8000,
      notes: 'Reunião agendada para próxima semana',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: ['reunião']
    }
  ])

  const [kanbanStages, setKanbanStages] = useState<KanbanStage[]>([
    { id: 'new', name: 'Novos Leads', color: '#3B82F6', leads: [] },
    { id: 'contacted', name: 'Contatados', color: '#F59E0B', leads: [] },
    { id: 'qualified', name: 'Qualificados', color: '#8B5CF6', leads: [] },
    { id: 'proposal', name: 'Proposta', color: '#06B6D4', leads: [] },
    { id: 'negotiation', name: 'Negociação', color: '#F97316', leads: [] },
    { id: 'won', name: 'Ganhos', color: '#10B981', leads: [] },
    { id: 'lost', name: 'Perdidos', color: '#EF4444', leads: [] }
  ])

  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: '1', name: 'Orçamento', type: 'number', required: false },
    { id: '2', name: 'Urgência', type: 'select', options: ['Baixa', 'Média', 'Alta'], required: false },
    { id: '3', name: 'Observações', type: 'textarea', required: false }
  ])

  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: '1', name: 'WhatsApp Business', type: 'whatsapp', status: 'disconnected', config: {} },
    { id: '2', name: 'Gmail/Outlook', type: 'email', status: 'disconnected', config: {} },
    { id: '3', name: 'OpenAI Assistant', type: 'ai', status: 'disconnected', config: {} }
  ])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      leadId: '1',
      content: 'Olá! Gostaria de saber mais sobre seus serviços.',
      type: 'whatsapp',
      direction: 'inbound',
      timestamp: new Date().toISOString(),
      isAutomated: false,
      status: 'read'
    },
    {
      id: '2',
      leadId: '1',
      content: 'Olá João! Obrigado pelo interesse. Vou te enviar mais informações.',
      type: 'whatsapp',
      direction: 'outbound',
      timestamp: new Date().toISOString(),
      isAutomated: true,
      status: 'delivered'
    }
  ])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    company: '',
    status: 'new' as const,
    source: 'manual',
    value: '',
    notes: '',
    custom_fields: {} as Record<string, any>
  })

  const [newCustomField, setNewCustomField] = useState({
    name: '',
    type: 'text' as const,
    options: [] as string[],
    required: false
  })

  const [automationConfig, setAutomationConfig] = useState({
    enabled: false,
    welcomeMessage: 'Olá! Obrigado pelo contato. Em breve retornaremos.',
    followUpInterval: 24,
    aiPrompt: 'Você é um assistente de vendas. Responda de forma profissional e útil.',
    autoQualification: false
  })

  // Organize leads by status for kanban
  useEffect(() => {
    const updatedStages = kanbanStages.map(stage => ({
      ...stage,
      leads: leads.filter(lead => lead.status === stage.id)
    }))
    setKanbanStages(updatedStages)
  }, [leads])

  const handleBackToLanding = () => {
    window.location.href = '/'
  }

  const handleCreateLead = () => {
    const newLead: Lead = {
      id: Date.now().toString(),
      ...formData,
      value: formData.value ? parseFloat(formData.value) : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: []
    }
    
    setLeads([...leads, newLead])
    setFormData({
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      company: '',
      status: 'new',
      source: 'manual',
      value: '',
      notes: '',
      custom_fields: {}
    })
    setShowLeadForm(false)
  }

  const handleUpdateLeadStatus = (leadId: string, newStatus: string) => {
    setLeads(leads.map(lead => 
      lead.id === leadId 
        ? { ...lead, status: newStatus as any, updated_at: new Date().toISOString() }
        : lead
    ))
  }

  const handleDeleteLead = (leadId: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      setLeads(leads.filter(lead => lead.id !== leadId))
    }
  }

  const handleSendMessage = (leadId: string, content: string, type: 'whatsapp' | 'email') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      leadId,
      content,
      type,
      direction: 'outbound',
      timestamp: new Date().toISOString(),
      isAutomated: false,
      status: 'sent'
    }
    setMessages([...messages, newMessage])
  }

  const handleAddCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      ...newCustomField
    }
    setCustomFields([...customFields, newField])
    setNewCustomField({
      name: '',
      type: 'text',
      options: [],
      required: false
    })
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus
    const matchesSource = filterSource === 'all' || lead.source === filterSource
    return matchesSearch && matchesStatus && matchesSource
  })

  const renderKanbanView = () => (
    <div className="flex-1 overflow-x-auto">
      <div className="flex space-x-6 p-6 min-w-max">
        {kanbanStages.map(stage => (
          <div key={stage.id} className="w-80 bg-white rounded-xl shadow-neumorphism">
            <div 
              className="p-4 rounded-t-xl text-white font-semibold flex items-center justify-between"
              style={{ backgroundColor: stage.color }}
            >
              <span>{stage.name}</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                {stage.leads.length}
              </span>
            </div>
            
            <div className="p-4 space-y-3 min-h-[500px]">
              {stage.leads.map(lead => (
                <div 
                  key={lead.id}
                  className="bg-gray-50 rounded-lg p-4 shadow-neumorphism-inset hover:shadow-neumorphism transition-all cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                    <div className="flex space-x-1">
                      {lead.whatsapp && (
                        <MessageCircle size={14} className="text-green-600" />
                      )}
                      {lead.email && (
                        <Mail size={14} className="text-blue-600" />
                      )}
                    </div>
                  </div>
                  
                  {lead.company && (
                    <p className="text-sm text-gray-600 mb-2">{lead.company}</p>
                  )}
                  
                  {lead.value && (
                    <p className="text-sm font-medium text-green-600 mb-2">
                      R$ {lead.value.toLocaleString('pt-BR')}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{lead.source}</span>
                    <span>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  {lead.tags && lead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <button
                onClick={() => setShowLeadForm(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Lead
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderListView = () => (
    <div className="flex-1 bg-white rounded-xl shadow-neumorphism overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Origem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    {lead.company && (
                      <div className="text-sm text-gray-500">{lead.company}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {lead.whatsapp && (
                      <button className="text-green-600 hover:text-green-800">
                        <MessageCircle size={16} />
                      </button>
                    )}
                    {lead.email && (
                      <button className="text-blue-600 hover:text-blue-800">
                        <Mail size={16} />
                      </button>
                    )}
                    {lead.phone && (
                      <button className="text-gray-600 hover:text-gray-800">
                        <Phone size={16} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={lead.status}
                    onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">Novo</option>
                    <option value="contacted">Contatado</option>
                    <option value="qualified">Qualificado</option>
                    <option value="proposal">Proposta</option>
                    <option value="negotiation">Negociação</option>
                    <option value="won">Ganho</option>
                    <option value="lost">Perdido</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.value ? `R$ ${lead.value.toLocaleString('pt-BR')}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.source}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteLead(lead.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderMessagesView = () => (
    <div className="flex-1 flex">
      {/* Lista de conversas */}
      <div className="w-1/3 bg-white rounded-l-xl shadow-neumorphism border-r">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Conversas</h3>
        </div>
        <div className="overflow-y-auto h-96">
          {leads.map(lead => {
            const leadMessages = messages.filter(m => m.leadId === lead.id)
            const lastMessage = leadMessages[leadMessages.length - 1]
            
            return (
              <div
                key={lead.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedLead?.id === lead.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{lead.name}</h4>
                  <span className="text-xs text-gray-500">
                    {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : ''}
                  </span>
                </div>
                {lastMessage && (
                  <p className="text-sm text-gray-600 truncate">
                    {lastMessage.content}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  {lead.whatsapp && <MessageCircle size={12} className="text-green-600 mr-1" />}
                  {lead.email && <Mail size={12} className="text-blue-600 mr-1" />}
                  {leadMessages.filter(m => !m.isAutomated && m.direction === 'inbound').length > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 bg-white rounded-r-xl shadow-neumorphism flex flex-col">
        {selectedLead ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedLead.name}</h3>
                <p className="text-sm text-gray-600">{selectedLead.company}</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                  <MessageCircle size={20} />
                </button>
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Mail size={20} />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Phone size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages
                .filter(m => m.leadId === selectedLead.id)
                .map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.direction === 'outbound'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.isAutomated && (
                          <Bot size={12} className="opacity-75" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement
                      if (input.value.trim()) {
                        handleSendMessage(selectedLead.id, input.value, 'whatsapp')
                        input.value = ''
                      }
                    }
                  }}
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderIntegrationsView = () => (
    <div className="flex-1 space-y-6">
      <div className="bg-white rounded-xl shadow-neumorphism p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrações Disponíveis</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {integrations.map(integration => (
            <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{integration.name}</h4>
                <div className={`w-3 h-3 rounded-full ${
                  integration.status === 'connected' ? 'bg-green-500' :
                  integration.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {integration.type === 'whatsapp' && 'Conecte sua conta do WhatsApp Business para enviar e receber mensagens'}
                {integration.type === 'email' && 'Integre com Gmail ou Outlook para gerenciar emails'}
                {integration.type === 'ai' && 'Configure assistente de IA para respostas automáticas'}
              </p>
              
              <button
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                  integration.status === 'connected'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={() => setShowIntegrationSetup(true)}
              >
                {integration.status === 'connected' ? 'Desconectar' : 'Conectar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-neumorphism p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Automação de Respostas</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Respostas Automáticas</h4>
              <p className="text-sm text-gray-600">Ative respostas automáticas para novos contatos</p>
            </div>
            <button
              onClick={() => setAutomationConfig({
                ...automationConfig,
                enabled: !automationConfig.enabled
              })}
              className={`p-2 rounded-lg ${
                automationConfig.enabled ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {automationConfig.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
          </div>

          {automationConfig.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de Boas-vindas
                </label>
                <textarea
                  value={automationConfig.welcomeMessage}
                  onChange={(e) => setAutomationConfig({
                    ...automationConfig,
                    welcomeMessage: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervalo de Follow-up (horas)
                </label>
                <input
                  type="number"
                  value={automationConfig.followUpInterval}
                  onChange={(e) => setAutomationConfig({
                    ...automationConfig,
                    followUpInterval: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt da IA
                </label>
                <textarea
                  value={automationConfig.aiPrompt}
                  onChange={(e) => setAutomationConfig({
                    ...automationConfig,
                    aiPrompt: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Salvar Configurações
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderCustomFieldsView = () => (
    <div className="flex-1 space-y-6">
      <div className="bg-white rounded-xl shadow-neumorphism p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campos Personalizados</h3>
        
        <div className="space-y-4 mb-6">
          {customFields.map(field => (
            <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{field.name}</h4>
                <p className="text-sm text-gray-600">
                  Tipo: {field.type} {field.required && '(Obrigatório)'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit size={16} />
                </button>
                <button className="text-red-600 hover:text-red-800">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Adicionar Novo Campo</h4>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Campo
              </label>
              <input
                type="text"
                value={newCustomField.name}
                onChange={(e) => setNewCustomField({
                  ...newCustomField,
                  name: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={newCustomField.type}
                onChange={(e) => setNewCustomField({
                  ...newCustomField,
                  type: e.target.value as any
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="email">Email</option>
                <option value="phone">Telefone</option>
                <option value="select">Lista de Opções</option>
                <option value="textarea">Texto Longo</option>
                <option value="date">Data</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </div>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={newCustomField.required}
              onChange={(e) => setNewCustomField({
                ...newCustomField,
                required: e.target.checked
              })}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Campo obrigatório</label>
          </div>

          <button
            onClick={handleAddCustomField}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Adicionar Campo
          </button>
        </div>
      </div>
    </div>
  )

  if (showLeadForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-black">Novo Lead</h1>
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

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-neumorphism p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Estimado (R$)
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">Novo</option>
                  <option value="contacted">Contatado</option>
                  <option value="qualified">Qualificado</option>
                  <option value="proposal">Proposta</option>
                  <option value="negotiation">Negociação</option>
                  <option value="won">Ganho</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origem
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manual</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="website">Website</option>
                  <option value="referral">Indicação</option>
                  <option value="social">Redes Sociais</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Campos personalizados */}
            {customFields.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Campos Personalizados</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {customFields.map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.name} {field.required && '*'}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required={field.required}
                        >
                          <option value="">Selecione...</option>
                          {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          required={field.required}
                        />
                      ) : field.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type={field.type}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLeadForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLead}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Criar Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-neumorphism border-b">
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
                <div className="bg-blue-600 text-white p-2 rounded-lg mr-3 shadow-neumorphism">
                  <Users size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">CoreCRM</h1>
                  <p className="text-sm text-gray-600">Sistema de Gestão de Relacionamento</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLeadForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center shadow-neumorphism"
              >
                <Plus size={16} className="mr-2" />
                Novo Lead
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
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-neumorphism mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {[
                { id: 'kanban', label: 'Kanban', icon: Target },
                { id: 'list', label: 'Lista', icon: Database },
                { id: 'messages', label: 'Mensagens', icon: MessageCircle },
                { id: 'integrations', label: 'Integrações', icon: Zap },
                { id: 'settings', label: 'Campos', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as any)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-all ${
                    activeView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters */}
        {(activeView === 'kanban' || activeView === 'list') && (
          <div className="bg-white rounded-xl shadow-neumorphism p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="new">Novos</option>
                  <option value="contacted">Contatados</option>
                  <option value="qualified">Qualificados</option>
                  <option value="proposal">Proposta</option>
                  <option value="negotiation">Negociação</option>
                  <option value="won">Ganhos</option>
                  <option value="lost">Perdidos</option>
                </select>

                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as Origens</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="website">Website</option>
                  <option value="referral">Indicação</option>
                  <option value="social">Redes Sociais</option>
                </select>
              </div>

              <div className="text-sm text-gray-600">
                {filteredLeads.length} lead(s) encontrado(s)
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col h-[calc(100vh-300px)]">
          {activeView === 'kanban' && renderKanbanView()}
          {activeView === 'list' && renderListView()}
          {activeView === 'messages' && renderMessagesView()}
          {activeView === 'integrations' && renderIntegrationsView()}
          {activeView === 'settings' && renderCustomFieldsView()}
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && activeView !== 'messages' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalhes do Lead
                </h3>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <p className="text-gray-900">{selectedLead.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <p className="text-gray-900">{selectedLead.company || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{selectedLead.email || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <p className="text-gray-900">{selectedLead.whatsapp || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => {
                      handleUpdateLeadStatus(selectedLead.id, e.target.value)
                      setSelectedLead({
                        ...selectedLead,
                        status: e.target.value as any
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">Novo</option>
                    <option value="contacted">Contatado</option>
                    <option value="qualified">Qualificado</option>
                    <option value="proposal">Proposta</option>
                    <option value="negotiation">Negociação</option>
                    <option value="won">Ganho</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Estimado
                  </label>
                  <p className="text-gray-900">
                    {selectedLead.value ? `R$ ${selectedLead.value.toLocaleString('pt-BR')}` : '-'}
                  </p>
                </div>
              </div>

              {selectedLead.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedLead.notes}
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                {selectedLead.whatsapp && (
                  <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center">
                    <MessageCircle size={16} className="mr-2" />
                    WhatsApp
                  </button>
                )}
                {selectedLead.email && (
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                    <Mail size={16} className="mr-2" />
                    Email
                  </button>
                )}
                {selectedLead.phone && (
                  <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center justify-center">
                    <Phone size={16} className="mr-2" />
                    Ligar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}