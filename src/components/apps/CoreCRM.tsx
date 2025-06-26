import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  Search, 
  MessageCircle, 
  Mail, 
  Bot, 
  Settings, 
  Send,
  MoreVertical,
  Filter,
  SortAsc,
  Home,
  Phone,
  Building,
  DollarSign,
  Calendar,
  Tag,
  Edit,
  Trash2,
  ExternalLink,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useLeads } from '../../hooks/useLeads'
import { useIntegrations } from '../../hooks/useIntegrations'
import { IntegrationSetup } from './IntegrationSetup'

interface CoreCRMProps {
  onBack: () => void
}

interface Message {
  id: string
  leadId: string
  content: string
  timestamp: Date
  isFromLead: boolean
  channel: 'whatsapp' | 'email'
  status: 'sent' | 'delivered' | 'read' | 'failed'
}

export function CoreCRM({ onBack }: CoreCRMProps) {
  const { leads, loading, createLead, updateLead, deleteLead } = useLeads()
  const { integrations, getIntegrationByService } = useIntegrations()
  
  const [activeView, setActiveView] = useState<'contacts' | 'messages' | 'integrations'>('contacts')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showIntegrationSetup, setShowIntegrationSetup] = useState(false)
  const [integrationType, setIntegrationType] = useState<'whatsapp' | 'email' | 'ai'>('whatsapp')
  const [draggedLead, setDraggedLead] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    company: '',
    value: '',
    notes: '',
    status: 'new' as const,
    source: 'manual'
  })

  // Simulação de mensagens em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular recebimento de mensagens
      if (Math.random() > 0.95 && leads.length > 0) {
        const randomLead = leads[Math.floor(Math.random() * leads.length)]
        const newMessage: Message = {
          id: Date.now().toString(),
          leadId: randomLead.id,
          content: 'Olá! Gostaria de mais informações sobre seus produtos.',
          timestamp: new Date(),
          isFromLead: true,
          channel: Math.random() > 0.5 ? 'whatsapp' : 'email',
          status: 'delivered'
        }
        setMessages(prev => [...prev, newMessage])
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [leads])

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const leadData = {
      ...formData,
      value: formData.value ? parseFloat(formData.value) : null
    }

    if (selectedLead) {
      await updateLead(selectedLead.id, leadData)
    } else {
      await createLead(leadData)
    }

    setFormData({
      name: '',
      email: '',
      whatsapp: '',
      company: '',
      value: '',
      notes: '',
      status: 'new',
      source: 'manual'
    })
    setShowCreateForm(false)
    setSelectedLead(null)
  }

  const handleEdit = (lead: any) => {
    setSelectedLead(lead)
    setFormData({
      name: lead.name,
      email: lead.email || '',
      whatsapp: lead.whatsapp || '',
      company: lead.company || '',
      value: lead.value?.toString() || '',
      notes: lead.notes || '',
      status: lead.status,
      source: lead.source || 'manual'
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      await deleteLead(id)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    setSendingMessage(true)
    
    // Simular envio de mensagem
    const message: Message = {
      id: Date.now().toString(),
      leadId: selectedChat,
      content: newMessage,
      timestamp: new Date(),
      isFromLead: false,
      channel: 'whatsapp',
      status: 'sent'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    
    // Simular resposta automática se IA estiver configurada
    const aiIntegration = getIntegrationByService('ai')
    if (aiIntegration?.is_active) {
      setTimeout(() => {
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          leadId: selectedChat,
          content: 'Obrigado pela sua mensagem! Nossa equipe entrará em contato em breve.',
          timestamp: new Date(),
          isFromLead: true,
          channel: 'whatsapp',
          status: 'delivered'
        }
        setMessages(prev => [...prev, autoReply])
      }, 2000)
    }

    setSendingMessage(false)
  }

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, '_blank')
  }

  const handleWhatsAppClick = (whatsapp: string) => {
    const cleanNumber = whatsapp.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanNumber}`, '_blank')
  }

  const handleDragStart = (e: React.DragEvent, lead: any) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedLead) return

    // Aqui você implementaria a lógica de reordenação
    console.log('Reordenando lead:', draggedLead.name, 'para posição:', targetIndex)
    setDraggedLead(null)
  }

  const handleBackToLanding = () => {
    window.location.href = '/'
  }

  const getLeadMessages = (leadId: string) => {
    return messages.filter(msg => msg.leadId === leadId).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }

  const getUnreadCount = (leadId: string) => {
    return messages.filter(msg => 
      msg.leadId === leadId && 
      msg.isFromLead && 
      msg.status !== 'read'
    ).length
  }

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-green-100 text-green-800',
    proposal: 'bg-purple-100 text-purple-800',
    negotiation: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  }

  const statusLabels = {
    new: 'Novo',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    proposal: 'Proposta',
    negotiation: 'Negociação',
    won: 'Ganho',
    lost: 'Perdido'
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setSelectedLead(null)
                    setFormData({
                      name: '',
                      email: '',
                      whatsapp: '',
                      company: '',
                      value: '',
                      notes: '',
                      status: 'new',
                      source: 'manual'
                    })
                  }}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-black">
                  {selectedLead ? 'Editar Lead' : 'Novo Lead'}
                </h1>
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
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5511999999999"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Potencial (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedLead ? 'Atualizar' : 'Criar'} Lead
              </button>
            </div>
          </form>
        </div>
      </div>
    )
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
                <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                  <Users size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">CoreCRM</h1>
                  <p className="text-sm text-gray-600">Gestão Inteligente de Relacionamento</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {activeView === 'contacts' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Novo Lead
                </button>
              )}
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveView('contacts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                Contatos ({filteredLeads.length})
              </div>
            </button>
            <button
              onClick={() => setActiveView('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <MessageCircle size={16} className="mr-2" />
                Mensagens ({messages.filter(m => m.isFromLead && m.status !== 'read').length})
              </div>
            </button>
            <button
              onClick={() => setActiveView('integrations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'integrations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Settings size={16} className="mr-2" />
                Integrações
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contacts View */}
        {activeView === 'contacts' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar contatos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos os Status</option>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-gray-600">
                  {filteredLeads.length} contato(s) encontrado(s)
                </div>
              </div>
            </div>

            {/* Contacts List */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando contatos...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Users className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contato encontrado</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece adicionando seu primeiro lead'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Adicionar Primeiro Lead
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead, index) => {
                  const unreadCount = getUnreadCount(lead.id)
                  
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-move border-l-4 border-blue-500"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status as keyof typeof statusColors]}`}>
                              {statusLabels[lead.status as keyof typeof statusLabels]}
                            </span>
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                {unreadCount} nova(s)
                              </span>
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {lead.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <button
                                  onClick={() => handleEmailClick(lead.email)}
                                  className="flex items-center hover:text-blue-600 transition-colors"
                                >
                                  <Mail size={14} className="mr-2" />
                                  {lead.email}
                                </button>
                              </div>
                            )}
                            
                            {lead.whatsapp && (
                              <div className="flex items-center text-sm text-gray-600">
                                <button
                                  onClick={() => handleWhatsAppClick(lead.whatsapp)}
                                  className="flex items-center hover:text-green-600 transition-colors"
                                >
                                  <MessageCircle size={14} className="mr-2" />
                                  {lead.whatsapp}
                                </button>
                              </div>
                            )}
                            
                            {lead.company && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Building size={14} className="mr-2" />
                                {lead.company}
                              </div>
                            )}
                            
                            {lead.value && (
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign size={14} className="mr-2" />
                                R$ {lead.value.toLocaleString('pt-BR')}
                              </div>
                            )}
                          </div>

                          {lead.notes && (
                            <p className="text-sm text-gray-600 mb-3">{lead.notes}</p>
                          )}

                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar size={12} className="mr-1" />
                            Criado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                            <span className="mx-2">•</span>
                            <Tag size={12} className="mr-1" />
                            Origem: {lead.source}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => setSelectedChat(lead.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Abrir chat"
                          >
                            <MessageCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(lead)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Messages View */}
        {activeView === 'messages' && (
          <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Chat List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Conversas</h3>
              </div>
              <div className="overflow-y-auto h-full">
                {leads.map(lead => {
                  const leadMessages = getLeadMessages(lead.id)
                  const lastMessage = leadMessages[leadMessages.length - 1]
                  const unreadCount = getUnreadCount(lead.id)
                  
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedChat(lead.id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedChat === lead.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{lead.name}</h4>
                        {unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {lastMessage.content}
                        </p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        {lastMessage?.channel === 'whatsapp' ? (
                          <MessageCircle size={12} className="mr-1 text-green-500" />
                        ) : (
                          <Mail size={12} className="mr-1 text-blue-500" />
                        )}
                        {lastMessage && new Date(lastMessage.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm flex flex-col">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {leads.find(l => l.id === selectedChat)?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {leads.find(l => l.id === selectedChat)?.whatsapp}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-sm text-gray-600">Online</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {getLeadMessages(selectedChat).map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.isFromLead ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isFromLead
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {!message.isFromLead && (
                              <div className="ml-2">
                                {message.status === 'sent' && <Clock size={12} className="opacity-70" />}
                                {message.status === 'delivered' && <CheckCircle size={12} className="opacity-70" />}
                                {message.status === 'read' && <CheckCircle size={12} className="text-blue-200" />}
                                {message.status === 'failed' && <AlertCircle size={12} className="text-red-200" />}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Send size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Selecione uma conversa
                    </h3>
                    <p className="text-gray-600">
                      Escolha um contato para começar a conversar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Integrations View */}
        {activeView === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Configurar Integrações
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* WhatsApp Integration */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <MessageCircle className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">WhatsApp Business</h4>
                        <p className="text-sm text-gray-600">API oficial do WhatsApp</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      getIntegrationByService('whatsapp')?.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Conecte sua conta do WhatsApp Business para enviar e receber mensagens automaticamente.
                  </p>
                  
                  <button
                    onClick={() => {
                      setIntegrationType('whatsapp')
                      setShowIntegrationSetup(true)
                    }}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {getIntegrationByService('whatsapp')?.is_active ? 'Reconfigurar' : 'Configurar'}
                  </button>
                </div>

                {/* Email Integration */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Mail className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Email / Outlook</h4>
                        <p className="text-sm text-gray-600">SMTP para envio de emails</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      getIntegrationByService('email')?.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Configure sua conta de email para envio automático de mensagens e follow-ups.
                  </p>
                  
                  <button
                    onClick={() => {
                      setIntegrationType('email')
                      setShowIntegrationSetup(true)
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {getIntegrationByService('email')?.is_active ? 'Reconfigurar' : 'Configurar'}
                  </button>
                </div>

                {/* AI Integration */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <Bot className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Assistente de IA</h4>
                        <p className="text-sm text-gray-600">ChatGPT, Claude, etc.</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      getIntegrationByService('ai')?.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Configure IA para respostas automáticas inteligentes e qualificação de leads.
                  </p>
                  
                  <button
                    onClick={() => {
                      setIntegrationType('ai')
                      setShowIntegrationSetup(true)
                    }}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {getIntegrationByService('ai')?.is_active ? 'Reconfigurar' : 'Configurar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Status das Integrações
              </h3>
              
              <div className="space-y-4">
                {['whatsapp', 'email', 'ai'].map(service => {
                  const integration = getIntegrationByService(service)
                  const serviceNames = {
                    whatsapp: 'WhatsApp Business',
                    email: 'Email/SMTP',
                    ai: 'Assistente de IA'
                  }
                  
                  return (
                    <div key={service} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          integration?.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <span className="font-medium text-gray-900">
                          {serviceNames[service as keyof typeof serviceNames]}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${
                          integration?.is_active ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {integration?.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        {integration?.last_sync && (
                          <span className="text-xs text-gray-500">
                            Última sincronização: {new Date(integration.last_sync).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integration Setup Modal */}
      <IntegrationSetup
        isOpen={showIntegrationSetup}
        onClose={() => setShowIntegrationSetup(false)}
        integrationType={integrationType}
      />
    </div>
  )
}