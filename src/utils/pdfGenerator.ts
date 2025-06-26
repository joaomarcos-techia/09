import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  category_id?: string
  account_id: string
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
}

interface Account {
  id: string
  name: string
  balance: number
}

interface ReportData {
  period: string
  totalIncome: number
  totalExpenses: number
  balance: number
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
}

export class PDFGenerator {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF()
  }

  private addHeader(title: string, period: string) {
    // Logo/Title
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('CoreFinance', 20, 25)
    
    // Report title
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(title, 20, 40)
    
    // Period
    this.doc.setFontSize(12)
    this.doc.setTextColor(100)
    this.doc.text(`Período: ${period}`, 20, 50)
    
    // Date generated
    this.doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 58)
    
    // Reset color
    this.doc.setTextColor(0)
    
    return 70 // Return Y position for next content
  }

  private addSummary(data: ReportData, startY: number) {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Resumo Financeiro', 20, startY)
    
    const summaryData = [
      ['Total de Receitas', `R$ ${data.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Total de Despesas', `R$ ${data.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Saldo do Período', `R$ ${data.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Número de Transações', data.transactions.length.toString()]
    ]

    this.doc.autoTable({
      startY: startY + 10,
      head: [['Descrição', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [255, 152, 0] }, // Orange color
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' }
      }
    })

    return this.doc.lastAutoTable.finalY + 20
  }

  private addCategoryBreakdown(data: ReportData, startY: number) {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Detalhamento por Categoria', 20, startY)

    // Income categories
    const incomeCategories = data.categories.filter(cat => cat.type === 'income')
    const expenseCategories = data.categories.filter(cat => cat.type === 'expense')

    let currentY = startY + 10

    if (incomeCategories.length > 0) {
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Receitas por Categoria', 20, currentY)
      
      const incomeData = incomeCategories.map(category => {
        const categoryTransactions = data.transactions.filter(
          t => t.category_id === category.id && t.type === 'income'
        )
        const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
        const percentage = data.totalIncome > 0 ? (total / data.totalIncome) * 100 : 0
        
        return [
          category.name,
          categoryTransactions.length.toString(),
          `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `${percentage.toFixed(1)}%`
        ]
      }).filter(row => parseFloat(row[2].replace(/[^\d,]/g, '').replace(',', '.')) > 0)

      if (incomeData.length > 0) {
        this.doc.autoTable({
          startY: currentY + 5,
          head: [['Categoria', 'Qtd', 'Total', '%']],
          body: incomeData,
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] }, // Green color
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          }
        })
        currentY = this.doc.lastAutoTable.finalY + 15
      }
    }

    if (expenseCategories.length > 0) {
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Despesas por Categoria', 20, currentY)
      
      const expenseData = expenseCategories.map(category => {
        const categoryTransactions = data.transactions.filter(
          t => t.category_id === category.id && t.type === 'expense'
        )
        const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
        const percentage = data.totalExpenses > 0 ? (total / data.totalExpenses) * 100 : 0
        
        return [
          category.name,
          categoryTransactions.length.toString(),
          `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `${percentage.toFixed(1)}%`
        ]
      }).filter(row => parseFloat(row[2].replace(/[^\d,]/g, '').replace(',', '.')) > 0)

      if (expenseData.length > 0) {
        this.doc.autoTable({
          startY: currentY + 5,
          head: [['Categoria', 'Qtd', 'Total', '%']],
          body: expenseData,
          theme: 'grid',
          headStyles: { fillColor: [239, 68, 68] }, // Red color
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          }
        })
        currentY = this.doc.lastAutoTable.finalY + 15
      }
    }

    return currentY
  }

  private addTransactionsList(data: ReportData, startY: number) {
    if (data.transactions.length === 0) return startY

    // Check if we need a new page
    if (startY > 250) {
      this.doc.addPage()
      startY = 20
    }

    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Lista de Transações', 20, startY)

    const transactionData = data.transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50) // Limit to 50 transactions to avoid huge PDFs
      .map(transaction => {
        const category = data.categories.find(cat => cat.id === transaction.category_id)
        const account = data.accounts.find(acc => acc.id === transaction.account_id)
        
        return [
          new Date(transaction.date).toLocaleDateString('pt-BR'),
          transaction.description,
          category?.name || 'Sem categoria',
          account?.name || 'Conta não encontrada',
          transaction.type === 'income' ? 'Receita' : 'Despesa',
          `R$ ${transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]
      })

    this.doc.autoTable({
      startY: startY + 10,
      head: [['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor']],
      body: transactionData,
      theme: 'grid',
      headStyles: { fillColor: [255, 152, 0] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25, halign: 'right' }
      }
    })

    if (data.transactions.length > 50) {
      const remainingCount = data.transactions.length - 50
      this.doc.setFontSize(10)
      this.doc.setTextColor(100)
      this.doc.text(`... e mais ${remainingCount} transação(ões)`, 20, this.doc.lastAutoTable.finalY + 10)
      this.doc.setTextColor(0)
    }

    return this.doc.lastAutoTable.finalY + 20
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Footer line
      this.doc.setDrawColor(200)
      this.doc.line(20, 280, 190, 280)
      
      // Footer text
      this.doc.setFontSize(8)
      this.doc.setTextColor(100)
      this.doc.text('Gerado pelo CoreFinance - Sistema de Gestão Financeira', 20, 285)
      this.doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' })
    }
  }

  generateMonthlyReport(data: ReportData): void {
    let currentY = this.addHeader('Relatório Mensal', data.period)
    currentY = this.addSummary(data, currentY)
    currentY = this.addCategoryBreakdown(data, currentY)
    this.addTransactionsList(data, currentY)
    this.addFooter()
    
    this.doc.save(`relatorio-mensal-${data.period.replace(/\s/g, '-').toLowerCase()}.pdf`)
  }

  generateExpenseAnalysis(data: ReportData): void {
    let currentY = this.addHeader('Análise de Gastos', data.period)
    currentY = this.addSummary(data, currentY)
    currentY = this.addCategoryBreakdown(data, currentY)
    
    // Add expense-specific analysis
    if (currentY > 250) {
      this.doc.addPage()
      currentY = 20
    }

    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Análise Detalhada de Gastos', 20, currentY)

    const expenseTransactions = data.transactions.filter(t => t.type === 'expense')
    const avgExpense = expenseTransactions.length > 0 
      ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length 
      : 0

    const analysisData = [
      ['Maior Gasto', `R$ ${Math.max(...expenseTransactions.map(t => t.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Menor Gasto', `R$ ${Math.min(...expenseTransactions.map(t => t.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Gasto Médio', `R$ ${avgExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Gastos por Dia', `R$ ${(data.totalExpenses / 30).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
    ]

    this.doc.autoTable({
      startY: currentY + 10,
      head: [['Métrica', 'Valor']],
      body: analysisData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' }
      }
    })

    this.addFooter()
    this.doc.save(`analise-gastos-${data.period.replace(/\s/g, '-').toLowerCase()}.pdf`)
  }

  generateCashFlow(data: ReportData): void {
    let currentY = this.addHeader('Fluxo de Caixa', data.period)
    currentY = this.addSummary(data, currentY)

    // Daily cash flow
    if (currentY > 200) {
      this.doc.addPage()
      currentY = 20
    }

    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Fluxo de Caixa Diário', 20, currentY)

    // Group transactions by date
    const dailyFlow: { [key: string]: { income: number; expense: number } } = {}
    
    data.transactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('pt-BR')
      if (!dailyFlow[date]) {
        dailyFlow[date] = { income: 0, expense: 0 }
      }
      
      if (transaction.type === 'income') {
        dailyFlow[date].income += transaction.amount
      } else {
        dailyFlow[date].expense += transaction.amount
      }
    })

    const flowData = Object.entries(dailyFlow)
      .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime())
      .map(([date, flow]) => [
        date,
        `R$ ${flow.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${flow.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${(flow.income - flow.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ])

    this.doc.autoTable({
      startY: currentY + 10,
      head: [['Data', 'Receitas', 'Despesas', 'Saldo']],
      body: flowData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    })

    this.addFooter()
    this.doc.save(`fluxo-caixa-${data.period.replace(/\s/g, '-').toLowerCase()}.pdf`)
  }
}