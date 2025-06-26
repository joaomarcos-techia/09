import React, { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Calendar,
  User,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Target,
  Edit,
  Trash2,
  Home,
  Filter,
  MoreVertical,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  Users,
  CalendarDays,
  List,
  Columns,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'

interface CoreTaskProps {
  onBack: () => void
}

interface TaskCard {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  completed_at?: string
  lead_id?: string
  created_at: string
  updated_at: string
  user_id: string
}

export function CoreTask({ onBack }: CoreTaskProps) {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks()
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'calendar'>('kanban')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskCard | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [draggedTask, setDraggedTask] = useState<TaskCard | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    due_date: '',
    status: 'todo' as const
  })

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800 border-gray-300',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
    review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    done: 'bg-green-100 text-green-800 border-green-300'
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    urgent: 'bg-red-100 text-red-800 border-red-300'
  }

  const statusLabels = {
    todo: 'A Fazer',
    in_progress: 'Em Progresso',
    review: 'Em Revisão',
    done: 'Concluído'
  }

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente'
  }

  const kanbanColumns = [
    { 
      status: 'todo', 
      label: 'A Fazer', 
      color: 'border-gray-400',
      bgColor: 'bg-gray-50',
      icon: List
    },
    { 
      status: 'in_progress', 
      label: 'Em Progresso', 
      color: 'border-blue-400',
      bgColor: 'bg-blue-50',
      icon: Clock
    },
    { 
      status: 'review', 
      label: 'Em Revisão', 
      color: 'border-yellow-400',
      bgColor: 'bg-yellow-50',
      icon: Eye
    },
    { 
      status: 'done', 
      label: 'Concluído', 
      color: 'border-green-400',
      bgColor: 'bg-green-50',
      icon: CheckSquare
    }
  ]

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const taskData = {
      ...formData,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
    }

    if (selectedTask) {
      await updateTask(selectedTask.id, taskData)
    } else {
      await createTask(taskData)
    }

    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      status: 'todo'
    })
    setShowCreateForm(false)
    setSelectedTask(null)
  }

  const handleEdit = (task: TaskCard) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      status: task.status
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await deleteTask(id)
    }
  }

  const handleDragStart = (e: React.DragEvent, task: TaskCard) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    const updates: any = { status: newStatus }
    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString()
    }

    await updateTask(draggedTask.id, updates)
    setDraggedTask(null)
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status)
  }

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      if (!task.due_date) return false
      const taskDate = new Date(task.due_date)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const handleBackToLanding = () => {
    window.location.href = '/'
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Flag className="text-red-500" size={14} />
      case 'high': return <Flag className="text-orange-500" size={14} />
      case 'medium': return <Flag className="text-yellow-500" size={14} />
      case 'low': return <Flag className="text-green-500" size={14} />
      default: return null
    }
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
                    setSelectedTask(null)
                    setFormData({
                      title: '',
                      description: '',
                      priority: 'medium',
                      due_date: '',
                      status: 'todo'
                    })
                  }}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-black">
                  {selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                placeholder="Digite o título da tarefa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Descreva os detalhes da tarefa"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setSelectedTask(null)
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {selectedTask ? 'Atualizar' : 'Criar'} Tarefa
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
                <div className="bg-green-600 text-white p-2 rounded-lg mr-3">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">CoreTask</h1>
                  <p className="text-sm text-gray-600">Gestão de Tarefas e Projetos</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Nova Tarefa
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveView('kanban')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'kanban'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Columns size={16} className="mr-2" />
                KanBan ({filteredTasks.length})
              </div>
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'list'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <List size={16} className="mr-2" />
                Lista ({filteredTasks.length})
              </div>
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'calendar'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <CalendarDays size={16} className="mr-2" />
                Calendário
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters - Mostrar apenas para kanban e list */}
        {(activeView === 'kanban' || activeView === 'list') && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar tarefas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Todos os Status</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Todas as Prioridades</option>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-gray-600">
                {filteredTasks.length} tarefa(s) encontrada(s)
              </div>
            </div>
          </div>
        )}

        {/* KanBan View */}
        {activeView === 'kanban' && (
          <div className="overflow-x-auto">
            <div className="flex space-x-6 min-w-max pb-6">
              {kanbanColumns.map((column) => {
                const columnTasks = getTasksByStatus(column.status)
                const IconComponent = column.icon
                
                return (
                  <div
                    key={column.status}
                    className={`bg-white rounded-xl shadow-sm border-t-4 ${column.color} min-w-80 max-w-80`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.status)}
                  >
                    {/* Column Header */}
                    <div className={`p-4 border-b ${column.bgColor}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <IconComponent size={20} className="mr-2 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">{column.label}</h3>
                        </div>
                        <span className="bg-white text-gray-600 text-xs px-2 py-1 rounded-full shadow-sm">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Content */}
                    <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                      {columnTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CheckSquare size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma tarefa nesta fase</p>
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task)}
                            className="bg-gray-50 rounded-lg p-4 cursor-move hover:shadow-md transition-all duration-200 border border-gray-200 group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium text-gray-900 text-sm flex-1 pr-2">{task.title}</h4>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(task)}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                  title="Editar"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  title="Excluir"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getPriorityIcon(task.priority)}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                                  {priorityLabels[task.priority as keyof typeof priorityLabels]}
                                </span>
                              </div>

                              {task.due_date && (
                                <div className={`flex items-center text-xs ${
                                  isOverdue(task.due_date) && task.status !== 'done' 
                                    ? 'text-red-600' 
                                    : 'text-gray-500'
                                }`}>
                                  <Calendar size={12} className="mr-1" />
                                  {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>

                            {task.due_date && isOverdue(task.due_date) && task.status !== 'done' && (
                              <div className="mt-2 flex items-center text-xs text-red-600">
                                <AlertTriangle size={12} className="mr-1" />
                                Atrasada
                              </div>
                            )}

                            <div className="mt-2 text-xs text-gray-500">
                              {new Date(task.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {activeView === 'list' && (
          <>
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando tarefas...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <CheckSquare className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa encontrada</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando sua primeira tarefa'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Criar Primeira Tarefa
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status as keyof typeof statusColors]}`}>
                            {statusLabels[task.status as keyof typeof statusLabels]}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            {priorityLabels[task.priority as keyof typeof priorityLabels]}
                          </span>
                          {task.due_date && isOverdue(task.due_date) && task.status !== 'done' && (
                            <span className="flex items-center text-red-600 text-xs font-medium">
                              <AlertTriangle size={12} className="mr-1" />
                              Atrasada
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                        )}

                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Calendar size={12} className="mr-1" />
                            Criada em {new Date(task.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          {task.due_date && (
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              Vence em {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {task.completed_at && (
                            <div className="flex items-center text-green-600">
                              <Target size={12} className="mr-1" />
                              Concluída em {new Date(task.completed_at).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b bg-green-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-lg"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="p-2 h-24"></div>
                  }

                  const dayTasks = getTasksForDate(date)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isSelected = selectedDate?.toDateString() === date.toDateString()

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 h-24 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        isToday ? 'bg-green-100 border-green-300' : ''
                      } ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate ${
                              task.status === 'done' 
                                ? 'bg-green-100 text-green-800' 
                                : isOverdue(task.due_date!) 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayTasks.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Selected Date Tasks */}
            {selectedDate && (
              <div className="border-t bg-gray-50 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Tarefas para {selectedDate.toLocaleDateString('pt-BR')}
                </h4>
                
                {getTasksForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhuma tarefa para este dia</p>
                ) : (
                  <div className="space-y-3">
                    {getTasksForDate(selectedDate).map((task) => (
                      <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <h5 className="font-medium text-gray-900">{task.title}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status as keyof typeof statusColors]}`}>
                              {statusLabels[task.status as keyof typeof statusLabels]}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                              {priorityLabels[task.priority as keyof typeof priorityLabels]}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(task)}
                              className="p-1 text-gray-400 hover:text-green-600 rounded"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}