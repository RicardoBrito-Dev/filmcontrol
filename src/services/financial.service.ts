import { createClient } from '@/lib/supabase/client'
import type { FinancialTransaction, TransactionType, PaymentMethod } from '@/types/database.types'
import type { FinancialTransactionFormData } from '@/schemas/financial.schema'

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  pendingReceivables: number
  pendingPayables: number
}

const STORAGE_KEY = 'filmcontrol_financial_transactions'

function getLocalTransactions(): FinancialTransaction[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveLocalTransactions(transactions: FinancialTransaction[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }
}

export const financialService = {
  async list(): Promise<FinancialTransaction[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('reference_date', { ascending: false })

      if (!error && data) {
        return data
      }
    } catch {
      // Fallback
    }

    return getLocalTransactions()
  },

  async getSummary(): Promise<FinancialSummary> {
    const list = await this.list()

    let totalIncome = 0
    let totalExpenses = 0
    let pendingReceivables = 0
    let pendingPayables = 0

    list.forEach((t) => {
      const val = Number(t.amount || 0)
      if (t.type === 'ENTRADA') {
        if (t.status === 'PAGO') {
          totalIncome += val
        } else {
          pendingReceivables += val
        }
      } else if (t.type === 'SAIDA') {
        if (t.status === 'PAGO') {
          totalExpenses += val
        } else {
          pendingPayables += val
        }
      }
    })

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netBalance: Number((totalIncome - totalExpenses).toFixed(2)),
      pendingReceivables: Number(pendingReceivables.toFixed(2)),
      pendingPayables: Number(pendingPayables.toFixed(2)),
    }
  },

  async create(data: FinancialTransactionFormData): Promise<FinancialTransaction> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()

        let companyId = userProfile?.company_id
        if (!companyId) {
          const { data: comp } = await supabase.from('companies').select('id').limit(1).single()
          companyId = comp?.id
        }

        if (companyId) {
          const { data: newTx, error } = await supabase
            .from('financial_transactions')
            .insert({
              company_id: companyId,
              description: data.description,
              category: data.category,
              amount: data.amount,
              type: data.type,
              method: data.method || null,
              status: data.status,
              reference_date: data.reference_date,
              notes: data.notes || null,
              created_by: user.id,
            })
            .select()
            .single()

          if (!error && newTx) return newTx
        }
      }
    } catch {
      // Fallback
    }

    const newTx: FinancialTransaction = {
      id: 'ft_' + Date.now(),
      company_id: 'comp1',
      description: data.description,
      category: data.category,
      amount: data.amount,
      type: data.type,
      method: data.method || null,
      status: data.status,
      reference_date: data.reference_date,
      work_order_id: null,
      notes: data.notes || null,
      created_by: 'u1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const currentList = getLocalTransactions()
    saveLocalTransactions([newTx, ...currentList])
    return newTx
  },

  async updateStatus(id: string, status: FinancialTransaction['status']): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('financial_transactions').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalTransactions()
    const index = currentList.findIndex((t) => t.id === id)
    if (index !== -1) {
      currentList[index].status = status
      currentList[index].updated_at = new Date().toISOString()
      saveLocalTransactions(currentList)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('financial_transactions').delete().eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalTransactions()
    saveLocalTransactions(currentList.filter((t) => t.id !== id))
  },
}
