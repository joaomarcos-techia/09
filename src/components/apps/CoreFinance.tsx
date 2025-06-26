import React, { useState, useRef } from 'react'
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
  Download,
  FileText,
  Filter,
  ChevronDown,
  Printer,
  BarChart3,
  Activity,
  Loader2
} from 'lucide-react'
import { useTransactions } from '../../hooks/useTransactions'
import { PDFGenerator } from '../../utils/pdfGenerator'

interface CoreFinanceProps {
  onBack: () => void
}

export function CoreFinance({ onBack }: CoreFinanceProps) {
  const { transactions, accounts, categories, loading, createTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showReportMenu, setShowReportMenu] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const reportMenuRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    type: 'income' as const,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    account_id: '',
    category_id: '',
    is_recurring: false,
    recurring_interval: ''
  })

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    
    let matchesDate = true
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      matchesDate = transaction.date === today
    } else if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(transaction.date) >= weekAgo
    } else if (dateFilter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = new Date(transaction.date) >= monthAgo
    }
    
    return matchesSearch && matchesType && matchesDate
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id || null,
      is_recurring: formData.is_recurring,
      recurring_interval: formData.is_recurring ? formData.recurring_interval : null
    }

    if (selectedTransaction) {
      await updateTransaction(selectedTransaction.id, transactionData)
    } else {
      await createTransaction(transactionData)
    }

    setFormData({
      type: 'income',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      account_id: '',
      category_id: '',
      is_recurring: false,
      recurring_interval: ''
    })
    setShowCreateForm(false)
    setSelectedTransaction(null)
  }

  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction)
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date,
      account_id: transaction.account_id,
      category_id: transaction.category_id || '',
      is_recurring: transaction.is_recurring || false,
      recurring_interval: transaction.recurring_interval || ''
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction(id)
    }
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

  const handleBackToLanding = () => {
    window.location.href = '/'
  }

  const handleGenerateReport = (reportType: 'monthly' | 'expense' | 'cashflow') => {
    setGeneratingReport(true)
    setShowReportMenu(false)
    
    setTimeout(() => {
      try {
        const pdfGenerator = new PDFGenerator()
        
        // Prepare data for report
        const reportData = {
          period: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          totalIncome: monthlyIncome,
          totalExpenses: monthlyExpenses,
          balance: monthlyBalance,
          transactions: transactions,
          categories: categories,
          accounts: accounts
        }
        
        // Generate appropriate report
        switch (reportType) {
          case 'monthly':
            pdfGenerator.generateMonthlyReport(reportData)
            break
          case 'expense':
            pdfGenerator.generateExpenseAnalysis(reportData)
            break
          case 'cashflow':
            pdfGenerator.generateCashFlow(reportData)
            break
        }
      } catch (error) {
        console.error('Error generating report:', error)
        alert('Erro ao gerar relatório. Verifique o console para mais detalhes.')
      } finally {
        setGeneratingReport(false)
      }
    }, 1000)
  }

  // Close report menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (reportMenuRef.current && !reportMenuRef.current.contains(event.target as Node)) {
        setShowReportMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
                    setSelectedTransaction(null)
                    setFormData({
                      type: 'income',
                      amount: '',
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                      account_id: '',
                      category_id: '',
                      is_recurring: false,
                      recurring_interval: ''
                    })
                  }}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-black">{selectedTransaction ? 'Editar' : 'Nova'} Transação</h1>
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
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
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
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_recurring" className="text-sm text-gray-700">
                É uma transação recorrente?
              </label>
            </div>

            {formData.is_recurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervalo de Recorrência
                </label>
                <select
                  value={formData.recurring_interval}
                  onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required={formData.is_recurring}
                >
                  <option value="">Selecione um intervalo</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setSelectedTransaction(null)
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                {selectedTransaction ? 'Atualizar' : 'Criar'} Transação
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
              <div className="relative" ref={reportMenuRef}>
                <button
                  onClick={() => setShowReportMenu(!showReportMenu)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
                  disabled={generatingReport}
                >
                  {generatingReport ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FileText size={16} className="mr-2" />
                      Relatórios
                      <ChevronDown size={16} className="ml-2" />
                    </>
                  )}
                </button>
                
                {showReportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleGenerateReport('monthly')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Calendar size={16} className="mr-2 text-orange-500" />
                        Relatório Mensal
                      </button>
                      <button
                        onClick={() => handleGenerateReport('expense')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <PieChart size={16} className="mr-2 text-blue-500" />
                        Análise de Gastos
                      </button>
                      <button
                        onClick={() => handleGenerateReport('cashflow')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Activity size={16} className="mr-2 text-green-500" />
                        Fluxo de Caixa
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          window.print()
                          setShowReportMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Printer size={16} className="mr-2 text-gray-500" />
                        Imprimir Página
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Nova Transação
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center gap-4">
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
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Todas as Datas</option>
                <option value="today">Hoje</option>
                <option value="week">Últimos 7 dias</option>
                <option value="month">Últimos 30 dias</option>
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
              {searchTerm || typeFilter !== 'all' || dateFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece registrando sua primeira transação'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && dateFilter === 'all' && (
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
                      Categoria
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
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </div>
                          {transaction.is_recurring && (
                            <div className="text-xs text-gray-500 mt-1">
                              Recorrente ({transaction.recurring_interval})
                            </div>
                          )}
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
                          {account?.name || 'Conta não encontrada'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                                  style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                              {category.name}
                            </span>
                          ) : (
                            <span className="text-gray-500">Sem categoria</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEdit(transaction)}
                              className="text-gray-400 hover:text-orange-600"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(transaction.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
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

        {/* Financial Charts */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="mr-2 text-orange-500" size={20} />
              Receitas vs Despesas
            </h3>
            <div className="h-64 flex items-end justify-center space-x-12">
              <div className="flex flex-col items-center">
                <div className="bg-green-500 w-24 rounded-t-lg" 
                     style={{ height: `${(monthlyIncome / Math.max(monthlyIncome, monthlyExpenses)) * 200}px` }}></div>
                <p className="mt-2 font-medium text-gray-700">Receitas</p>
                <p className="text-sm text-gray-500">R$ {monthlyIncome.toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-red-500 w-24 rounded-t-lg" 
                     style={{ height: `${(monthlyExpenses / Math.max(monthlyIncome, monthlyExpenses)) * 200}px` }}></div>
                <p className="mt-2 font-medium text-gray-700">Despesas</p>
                <p className="text-sm text-gray-500">R$ {monthlyExpenses.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="mr-2 text-blue-500" size={20} />
              Distribuição de Despesas
            </h3>
            <div className="h-64 flex items-center justify-center">
              {/* Simplified pie chart visualization */}
              <div className="relative w-48 h-48">
                {categories
                  .filter(cat => cat.type === 'expense')
                  .map((category, index, array) => {
                    const categoryTransactions = transactions.filter(
                      t => t.category_id === category.id && t.type === 'expense'
                    )
                    const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
                    const percentage = monthlyExpenses > 0 ? (total / monthlyExpenses) * 100 : 0
                    
                    if (percentage < 1) return null
                    
                    // Calculate rotation for pie slice
                    let cumulativePercentage = 0
                    for (let i = 0; i < index; i++) {
                      const prevCat = array[i]
                      const prevCatTransactions = transactions.filter(
                        t => t.category_id === prevCat.id && t.type === 'expense'
                      )
                      const prevTotal = prevCatTransactions.reduce((sum, t) => sum + t.amount, 0)
                      cumulativePercentage += monthlyExpenses > 0 ? (prevTotal / monthlyExpenses) * 100 : 0
                    }
                    
                    const rotation = cumulativePercentage * 3.6 // 3.6 degrees per percentage point
                    
                    return (
                      <div 
                        key={category.id}
                        className="absolute inset-0 w-full h-full"
                        style={{
                          background: `conic-gradient(${category.color} 0% ${percentage}%, transparent ${percentage}% 100%)`,
                          transform: `rotate(${rotation}deg)`
                        }}
                      ></div>
                    )
                  })}
                <div className="absolute inset-0 w-24 h-24 bg-white rounded-full m-auto"></div>
              </div>
              
              <div className="ml-6 space-y-2">
                {categories
                  .filter(cat => cat.type === 'expense')
                  .map(category => {
                    const categoryTransactions = transactions.filter(
                      t => t.category_id === category.id && t.type === 'expense'
                    )
                    const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
                    const percentage = monthlyExpenses > 0 ? (total / monthlyExpenses) * 100 : 0
                    
                    if (percentage < 1) return null
                    
                    return (
                      <div key={category.id} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                        <span className="text-xs text-gray-700">{category.name} ({percentage.toFixed(1)}%)</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}