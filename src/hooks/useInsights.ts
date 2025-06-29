import { useState, useEffect } from 'react'
import { supabase, Insight } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchInsights()
    }
  }, [user])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInsights(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching insights')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('insights')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setInsights(prev => prev.map(insight => insight.id === id ? data : insight))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error marking insight as read'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const markAsApplied = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('insights')
        .update({ is_applied: true, is_read: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setInsights(prev => prev.map(insight => insight.id === id ? data : insight))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error marking insight as applied'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const createInsight = async (insightData: Omit<Insight, 'id' | 'user_id' | 'created_at' | 'is_read' | 'is_applied'>) => {
    try {
      const { data, error } = await supabase
        .from('insights')
        .insert([{ 
          ...insightData, 
          user_id: user!.id,
          is_read: false,
          is_applied: false
        }])
        .select()
        .single()

      if (error) throw error
      setInsights(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating insight'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteInsight = async (id: string) => {
    try {
      const { error } = await supabase
        .from('insights')
        .delete()
        .eq('id', id)

      if (error) throw error
      setInsights(prev => prev.filter(insight => insight.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting insight'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  const getInsightStats = () => {
    const total = insights.length
    const unread = insights.filter(i => !i.is_read).length
    const applied = insights.filter(i => i.is_applied).length
    const highPriority = insights.filter(i => i.priority === 3).length

    return {
      total,
      unread,
      applied,
      highPriority
    }
  }

  return {
    insights,
    loading,
    error,
    markAsRead,
    markAsApplied,
    createInsight,
    deleteInsight,
    refetch: fetchInsights,
    stats: getInsightStats()
  }
}