import { useState, useEffect } from 'react'
import { supabase, Transaction, Account, Category } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch transactions, accounts, and categories in parallel
      const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('accounts')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('categories')
          .select('*')
          .order('name')
      ])

      if (transactionsRes.error) throw transactionsRes.error
      if (accountsRes.error) throw accountsRes.error
      if (categoriesRes.error) throw categoriesRes.error

      setTransactions(transactionsRes.data || [])
      setAccounts(accountsRes.data || [])
      setCategories(categoriesRes.data || [])
      
      // Se não há contas, criar uma conta padrão
      if (!accountsRes.data || accountsRes.data.length === 0) {
        await createDefaultAccount()
      }
      
      // Se não há categorias, criar categorias padrão
      if (!categoriesRes.data || categoriesRes.data.length === 0) {
        await createDefaultCategories()
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching financial data')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          user_id: user!.id,
          name: 'Conta Principal',
          type: 'checking',
          balance: 0,
          is_active: true
        }])
        .select()

      if (error) throw error
      if (data) {
        setAccounts(data)
      }
    } catch (err) {
      console.error('Error creating default account:', err)
    }
  }

  const createDefaultCategories = async () => {
    try {
      const defaultCategories = [
        // Receitas
        { name: 'Vendas', type: 'income', color: '#10B981', is_default: true },
        { name: 'Serviços', type: 'income', color: '#059669', is_default: true },
        { name: 'Investimentos', type: 'income', color: '#047857', is_default: true },
        { name: 'Outros', type: 'income', color: '#065F46', is_default: true },
        
        // Despesas
        { name: 'Marketing', type: 'expense', color: '#EF4444', is_default: true },
        { name: 'Operacional', type: 'expense', color: '#DC2626', is_default: true },
        { name: 'Pessoal', type: 'expense', color: '#B91C1C', is_default: true },
        { name: 'Impostos', type: 'expense', color: '#991B1B', is_default: true },
        { name: 'Outros', type: 'expense', color: '#7F1D1D', is_default: true }
      ]

      const { data, error } = await supabase
        .from('categories')
        .insert(
          defaultCategories.map(cat => ({
            ...cat,
            user_id: user!.id
          }))
        )
        .select()

      if (error) throw error
      if (data) {
        setCategories(data)
      }
    } catch (err) {
      console.error('Error creating default categories:', err)
    }
  }

  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transactionData, user_id: user!.id }])
        .select()
        .single()

      if (error) throw error
      setTransactions(prev => [data, ...prev])
      
      // Update account balance
      await updateAccountBalance(transactionData.account_id)
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating transaction'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setTransactions(prev => prev.map(transaction => transaction.id === id ? data : transaction))
      
      // Update account balance if account changed
      if (updates.account_id) {
        await updateAccountBalance(updates.account_id)
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating transaction'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const transaction = transactions.find(t => t.id === id)
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTransactions(prev => prev.filter(transaction => transaction.id !== id))
      
      // Update account balance
      if (transaction) {
        await updateAccountBalance(transaction.account_id)
      }
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting transaction'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  const updateAccountBalance = async (accountId: string) => {
    try {
      // Calculate new balance based on all transactions for this account
      const { data: accountTransactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('account_id', accountId)

      if (accountTransactions) {
        const balance = accountTransactions.reduce((sum, transaction) => {
          return transaction.type === 'income' 
            ? sum + transaction.amount 
            : sum - transaction.amount
        }, 0)

        await supabase
          .from('accounts')
          .update({ balance })
          .eq('id', accountId)

        // Update local state
        setAccounts(prev => prev.map(account => 
          account.id === accountId ? { ...account, balance } : account
        ))
      }
    } catch (err) {
      console.error('Error updating account balance:', err)
    }
  }

  const getFinancialStats = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const currentMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear
    })

    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = income - expenses
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

    return {
      monthlyIncome: income,
      monthlyExpenses: expenses,
      monthlyBalance: balance,
      totalBalance,
      transactionCount: currentMonthTransactions.length
    }
  }

  return {
    transactions,
    accounts,
    categories,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchData,
    stats: getFinancialStats()
  }
}