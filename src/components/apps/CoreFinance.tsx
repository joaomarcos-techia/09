import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Plus, 
  Search, 
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  CreditCard,
  PieChart,
  Home,
  Filter,
  Download,
  FileText,
  BarChart3,
  Target,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Tag,
  Building,
  Repeat,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useTransactions } from '../../hooks/useTransactions'
import { PDFGenerator } from '../../utils/pdfGenerator'

interface CoreFinanceProps {
  onBack: () => void
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  transactions: any[]
  totalIncome: number
  totalExpense: number
}

export function CoreFinance({ onBack }: CoreFinanceProps) {
  const { transactions, accounts, categories, loading, createTransaction, error } = useTransactions()
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'transactions' | 'reports'>('dashboard')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const [formData, setFormData] = useState({
    type: 'income' as const,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    account_id: '',
    category_id: '',
    is_recurring: false,
    recurring_interval: 'monthly'
  })

  // Set default account and category when they become available
  useEffect(() => {
    if (accounts.length > 0 && !formData.account_id) {
      setFormData(prev => ({ ...prev, account_id: accounts[0].id }))
    }
  }, [accounts, formData.account_id])

  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      const defaultCategory = categories.find(cat => cat.type === formData.type && cat.is_default)
      if (defaultCategory) {
        setFormData(prev => ({ ...prev, category_id: defaultCategory.id }))
      }
    }
  }, [categories, formData.type, formData.category_id])

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || transaction.category_id === categoryFilter
    
    let matchesDate = true
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.date)
      const now = new Date()
      
      switch (dateFilter) {
        case 'today':
          matchesDate = transactionDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = transactionDate >= weekAgo
          break
        case 'month':
          matchesDate = transactionDate.getMonth() === now.getMonth() && 
                       transactionDate.getFullYear() === now.getFullYear()
          break
        case 'year':
          matchesDate = transactionDate.getFullYear() === now.getFullYear()
          break
      }
    }
    
    return matchesSearch && matchesType && matchesCategory && matchesDate
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.account_id) {
      alert('Por favor, selecione uma conta')
      return
    }
    
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id || null
    }

    const result = await createTransaction(transactionData)
    
    if (result.error) {
      alert(`Erro ao criar transação: ${result.error}`)
      return
    }

    setFormData({
      type: 'income',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      account_id: accounts.length > 0 ? accounts[0].id : '',
      category_id: '',
      is_recurring: false,
      recurring_interval: 'monthly'
    })
    setShowCreateForm(false)
  }

  // Calculate stats
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const currentMonthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear
  })

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyBalance = monthlyIncome - monthlyExpenses
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  // Calendar functions
  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days: CalendarDay[] = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date)
        return tDate.toDateString() === currentDate.toDateString()
      })
      
      const totalIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const totalExpense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        transactions: dayTransactions,
        totalIncome,
        totalExpense
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarDays(currentDate)

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const generatePDFReport = async (reportType: 'monthly' | 'expenses' | 'cashflow') => {
    setGeneratingPDF(true)
    
    try {
      const reportData = {
        period: currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        totalIncome: monthlyIncome,
        totalExpenses: monthlyExpenses,
        balance: monthlyBalance,
        transactions: currentMonthTransactions,
        categories: categories,
        accounts: accounts
      }

      const pdfGenerator = new PDFGenerator()
      
      switch (reportType) {
        case 'monthly':
          pdfGenerator.generateMonthlyReport(reportData)
          break
        case 'expenses':
          pdfGenerator.generateExpenseAnalysis(reportData)
          break
        case 'cashflow':
          pdfGenerator.generateCashFlow(reportData)
          break
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar relatório PDF. Tente novamente.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleBackToLanding = () => {
    window.location.href = '/'
  }

  // Show error if there's a database connection issue
  if (error && error.includes('does not exist')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Banco de Dados Não Configurado
          </h1>
          
          <p className="text-gray-600 mb-8">
            As tabelas financeiras não foram criadas ainda. Execute a migração do banco de dados para usar o CoreFinance.
          </p>

          <div className="space-y-4">
            <button
              onClick={onBack}
              className="w-full bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium"
            >
              Voltar ao Dashboard
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="text-yellow-600 mr-2" size={20} />
              <span className="text-yellow-800 font-medium">Como resolver</span>
            </div>
            <p className="text-yellow-700 text-sm">
              Acesse o painel do Supabase e execute a migração do arquivo <code className="bg-yellow-100 px-1 rounded">supabase/migrations/20250617051145_bold_valley.sql</code>
            </p>
          </div>
        </div>
      </div>
    )
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
                    setFormData({
                      type: 'income',
                      amount: '',
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                      account_id: accounts.length > 0 ? accounts[0].id : '',
                      category_id: '',
                      is_recurring: false,
                      recurring_interval: 'monthly'
                    })
                  }}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-black">Nova Transação</h1>
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
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'income' | 'expense'
                    // Ao mudar o tipo, encontrar uma categoria padrão do novo tipo
                    const defaultCategory = categories.find(cat => cat.type === newType && cat.is_default)
                    
                    setFormData({ 
                      ...formData, 
                      type: newType,
                      category_id: defaultCategory?.id || ''
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta *
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (R$ {account.balance.toLocaleString('pt-BR')})
                    </option>
                  ))}
                </select>
                {accounts.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    Nenhuma conta disponível. Recarregue a página para criar uma conta padrão.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Selecione uma categoria</option>
                {categories
                  .filter(cat => cat.type === formData.type)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
              {categories.filter(cat => cat.type === formData.type).length === 0 && (
                <p className="text-red-500 text-sm mt-1">
                  Nenhuma categoria disponível. Recarregue a página para criar categorias padrão.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Transação recorrente</label>
              </div>

              {formData.is_recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo de recorrência
                  </label>
                  <select
                    value={formData.recurring_interval}
                    onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              )}
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
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Criar Transação
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
                <div className="bg-orange-600 text-white p-2 rounded-lg mr-3">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">CoreFinance</h1>
                  <p className="text-sm text-gray-600">Controle Financeiro Completo</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {(activeView === 'dashboard' || activeView === 'transactions') && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nova Transação
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
              onClick={() => setActiveView('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'dashboard'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 size={16} className="mr-2" />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'calendar'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                Calendário
              </div>
            </button>
            <button
              onClick={() => setActiveView('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'transactions'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <FileText size={16} className="mr-2" />
                Transações ({filteredTransactions.length})
              </div>
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'reports'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Download size={16} className="mr-2" />
                Relatórios
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            {/* Financial Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Saldo Total</p>
                    <p className="text-2xl font-bold text-black mt-1">
                      R$ {totalBalance.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                    <CreditCard size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Receitas do Mês</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      R$ {monthlyIncome.toLocaleString('pt-BR')}
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
                    <p className="text-gray-600 text-sm font-medium">Despesas do Mês</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      R$ {monthlyExpenses.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 text-red-600">
                    <TrendingDown size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Saldo do Mês</p>
                    <p className={`text-2xl font-bold mt-1 ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {monthlyBalance.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${monthlyBalance >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <PieChart size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Recent Transactions */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Transactions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Transações Recentes</h3>
                  <button
                    onClick={() => setActiveView('transactions')}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    Ver todas
                  </button>
                </div>
                
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => {
                    const account = accounts.find(acc => acc.id === transaction.account_id)
                    const category = categories.find(cat => cat.id === transaction.category_id)
                    
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${
                            transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {category?.name || 'Sem categoria'} • {account?.name || 'Conta não encontrada'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )
                  })}

                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Nenhuma transação registrada</p>
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                      >
                        Adicionar Transação
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories Breakdown */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Gastos por Categoria</h3>
                
                <div className="space-y-4">
                  {categories
                    .filter(cat => cat.type === 'expense')
                    .map(category => {
                      const categoryTransactions = currentMonthTransactions.filter(
                        t => t.category_id === category.id && t.type === 'expense'
                      )
                      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
                      const percentage = monthlyExpenses > 0 ? (total / monthlyExpenses) * 100 : 0
                      
                      if (total === 0) return null
                      
                      return (
                        <div key={category.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{category.name}</span>
                            <span className="text-sm text-gray-600">
                              R$ {total.toLocaleString('pt-BR')} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })
                    .filter(Boolean)}

                  {categories.filter(cat => cat.type === 'expense').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Tag size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Nenhuma categoria de despesa</p>
                    </div>
                  )}

                  {categories.filter(cat => cat.type === 'expense').length > 0 && 
                   !categories.filter(cat => cat.type === 'expense').some(cat => 
                     currentMonthTransactions.some(t => t.category_id === cat.id && t.type === 'expense')
                   ) && (
                    <div className="text-center py-8 text-gray-500">
                      <PieChart size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Nenhuma despesa registrada neste mês</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Hoje
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className={`p-2 min-h-24 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                  } ${
                    selectedDate?.toDateString() === day.date.toDateString() ? 'ring-2 ring-orange-500' : ''
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {day.date.getDate()}
                  </div>
                  
                  {day.transactions.length > 0 && (
                    <div className="space-y-1">
                      {day.totalIncome > 0 && (
                        <div className="text-xs bg-green-100 text-green-800 px-1 rounded">
                          +R$ {day.totalIncome.toFixed(0)}
                        </div>
                      )}
                      {day.totalExpense > 0 && (
                        <div className="text-xs bg-red-100 text-red-800 px-1 rounded">
                          -R$ {day.totalExpense.toFixed(0)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Transações de {selectedDate.toLocaleDateString('pt-BR')}
                </h3>
                
                {calendarDays
                  .find(day => day.date.toDateString() === selectedDate.toDateString())
                  ?.transactions.map(transaction => {
                    const account = accounts.find(acc => acc.id === transaction.account_id)
                    const category = categories.find(cat => cat.id === transaction.category_id)
                    
                    return (
                      <div key={transaction.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {category?.name || 'Sem categoria'} • {account?.name || 'Conta não encontrada'}
                          </p>
                        </div>
                        <p className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )
                  }) || (
                  <p className="text-gray-500">Nenhuma transação nesta data</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Transactions View */}
        {activeView === 'transactions' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar transações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="income">Receitas</option>
                    <option value="expense">Despesas</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">Todas as Categorias</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.type === 'income' ? 'Receita' : 'Despesa'})
                      </option>
                    ))}
                  </select>

                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">Todos os Períodos</option>
                    <option value="today">Hoje</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Este Mês</option>
                    <option value="year">Este Ano</option>
                  </select>
                </div>

                <div className="text-sm text-gray-600">
                  {filteredTransactions.length} transação(ões) encontrada(s)
                </div>
              </div>
            </div>

            {/* Transactions List */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando transações...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <DollarSign className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece registrando sua primeira transação'
                  }
                </p>
                {!searchTerm && typeFilter === 'all' && categoryFilter === 'all' && dateFilter === 'all' && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                  >
                    Registrar Primeira Transação
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Conta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.map((transaction) => {
                        const account = accounts.find(acc => acc.id === transaction.account_id)
                        const category = categories.find(cat => cat.id === transaction.category_id)
                        
                        return (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 flex items-center">
                                  {transaction.description}
                                  {transaction.is_recurring && (
                                    <Repeat size={14} className="ml-2 text-blue-500" title="Transação recorrente" />
                                  )}
                                </div>
                                {category && (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Tag size={12} className="mr-1" />
                                    {category.name}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.type === 'income' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type === 'income' ? (
                                  <>
                                    <TrendingUp size={12} className="mr-1" />
                                    Receita
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown size={12} className="mr-1" />
                                    Despesa
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calendar size={14} className="mr-2 text-gray-400" />
                                {new Date(transaction.date).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Building size={14} className="mr-2 text-gray-400" />
                                {account?.name || 'Conta não encontrada'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button className="text-gray-400 hover:text-orange-600">
                                  <Edit size={16} />
                                </button>
                                <button className="text-gray-400 hover:text-red-600">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reports View */}
        {activeView === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Geração de Relatórios
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Report Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período do Relatório
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                      <option>Este mês</option>
                      <option>Mês anterior</option>
                      <option>Últimos 3 meses</option>
                      <option>Este ano</option>
                      <option>Ano anterior</option>
                      <option>Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Relatório
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm">Resumo Financeiro</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm">Detalhamento por Categoria</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm">Lista de Transações</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Gráficos e Análises</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filtros Adicionais
                    </label>
                    <div className="space-y-2">
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Todas as contas</option>
                        {accounts.map(account => (
                          <option key={account.id}>{account.name}</option>
                        ))}
                      </select>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Todas as categorias</option>
                        {categories.map(category => (
                          <option key={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Preview do Relatório</h4>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span>Período:</span>
                      <span className="font-medium">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Total de Receitas:</span>
                      <span className="font-medium text-green-600">
                        R$ {monthlyIncome.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Total de Despesas:</span>
                      <span className="font-medium text-red-600">
                        R$ {monthlyExpenses.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-t pt-2">
                      <span>Saldo do Período:</span>
                      <span className={`font-medium ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {monthlyBalance.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Número de Transações:</span>
                      <span className="font-medium">{currentMonthTransactions.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Visualizar
                </button>
                <button
                  onClick={() => generatePDFReport('monthly')}
                  disabled={generatingPDF}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center disabled:opacity-50"
                >
                  {generatingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      Gerar PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Reports */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Relatório Mensal</h4>
                  <FileText className="text-orange-600" size={20} />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Resumo completo das movimentações do mês atual
                </p>
                <button
                  onClick={() => generatePDFReport('monthly')}
                  disabled={generatingPDF}
                  className="w-full bg-orange-100 text-orange-700 py-2 rounded-lg hover:bg-orange-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {generatingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    'Gerar Relatório'
                  )}
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Análise de Gastos</h4>
                  <PieChart className="text-blue-600" size={20} />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Breakdown detalhado dos gastos por categoria
                </p>
                <button 
                  onClick={() => generatePDFReport('expenses')}
                  disabled={generatingPDF}
                  className="w-full bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {generatingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    'Gerar Análise'
                  )}
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Fluxo de Caixa</h4>
                  <BarChart3 className="text-green-600" size={20} />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Projeção e histórico do fluxo de caixa
                </p>
                <button 
                  onClick={() => generatePDFReport('cashflow')}
                  disabled={generatingPDF}
                  className="w-full bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {generatingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    'Gerar Fluxo'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}