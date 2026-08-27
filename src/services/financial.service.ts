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

const initialSeedTransactions: FinancialTransaction[] = [
  {
    id: 'ft1',
    company_id: 'comp1',
    description: 'Instalação Película G5 — Onix Plus (OS #5921)',
    category: 'Vendas de Películas',
    amount: 550.0,
    type: 'ENTRADA',
    method: 'PIX',
    status: 'PAGO',
    reference_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    work_order_id: 'wo1',
    notes: 'Pagamento total via PIX.',
    created_by: 'u1',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'ft2',
    company_id: 'comp1',
    description: 'Sinal 50% — Nano Cerâmica Civic Touring (OS #5922)',
    category: 'Vendas de Películas',
    amount: 425.0,
    type: 'ENTRADA',
    method: 'CREDITO',
    status: 'PAGO',
    reference_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    work_order_id: 'wo2',
    notes: 'Cartão de crédito 2x.',
    created_by: 'u1',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'ft3',
    company_id: 'comp1',
    description: 'Compra de Rolos de Película G5 e Cerâmica',
    category: 'Estoque / Fornecedores',
    amount: 1450.0,
    type: 'SAIDA',
    method: 'BOLETO',
    status: 'PAGO',
    reference_date: new Date(Date.now() - 10 * 86400000).toISOString(),
    work_order_id: null,
    notes: 'Distribuidora São Paulo - NF 84920',
    created_by: 'u1',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'ft4',
    company_id: 'comp1',
    description: 'Aluguel do Ponto Comercial / Galpão',
    category: 'Despesas Fixas',
    amount: 2200.0,
    type: 'SAIDA',
    method: 'TRANSFERENCIA',
    status: 'PAGO',
    reference_date: new Date(Date.now() - 15 * 86400000).toISOString(),
    work_order_id: null,
    notes: 'Competência do mês atual.',
    created_by: 'u1',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'ft5',
    company_id: 'comp1',
    description: 'Conta de Energia Elétrica / Iluminação',
    category: 'Contas de Consumo',
    amount: 380.5,
    type: 'SAIDA',
    method: 'PIX',
    status: 'PENDENTE',
    reference_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    work_order_id: null,
    notes: 'Vencimento em 5 dias.',
    created_by: 'u1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ft6',
    company_id: 'comp1',
    description: 'Saldo Restante — Nano Cerâmica Civic (OS #5922)',
    category: 'Vendas de Películas',
    amount: 425.0,
    type: 'ENTRADA',
    method: 'PIX',
    status: 'PENDENTE',
    reference_date: new Date(Date.now() + 1 * 86400000).toISOString(),
    work_order_id: 'wo2',
    notes: 'Receber na entrega do veículo.',
    created_by: 'u1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function getLocalTransactions(): FinancialTransaction[] {
  if (typeof window === 'undefined') return initialSeedTransactions
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedTransactions))
    return initialSeedTransactions
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialSeedTransactions
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

      if (error || !data || data.length === 0) {
        return getLocalTransactions()
      }
      return data
    } catch {
      return getLocalTransactions()
    }
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

        if (userProfile?.company_id) {
          const { data: newTx, error } = await supabase
            .from('financial_transactions')
            .insert({
              company_id: userProfile.company_id,
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
      await supabase.from('financial_transactions').update({ status }).eq('id', id)
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
