'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Clock,
} from 'lucide-react'
import { FinancialTable } from '@/components/financial/financial-table'
import { TransactionFormModal } from '@/components/financial/transaction-form-modal'
import {
  financialService,
  type FinancialSummary,
} from '@/services/financial.service'
import type { FinancialTransaction } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      const [txs, sum] = await Promise.all([
        financialService.list(),
        financialService.getSummary(),
      ])
      setTransactions(txs)
      setSummary(sum)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar dados financeiros', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinancialData()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await financialService.delete(id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      financialService.getSummary().then(setSummary)
      toast({ title: 'Lançamento excluído com sucesso' })
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handleUpdateStatus = async (
    id: string,
    status: FinancialTransaction['status']
  ) => {
    try {
      await financialService.updateStatus(id, status)
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      )
      financialService.getSummary().then(setSummary)
      toast({ title: `Status atualizado para ${status}` })
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleTransactionCreated = (saved: FinancialTransaction) => {
    setTransactions((prev) => [saved, ...prev])
    financialService.getSummary().then(setSummary)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestão Financeira & Caixa
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle entradas de serviços, despesas operacionais, fornecedores e contas a receber.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Receitas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Receitas Realizadas
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary?.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Serviços pagos</p>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Despesas Realizadas
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(summary?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Estoque e custos fixos</p>
          </CardContent>
        </Card>

        {/* Saldo Líquido */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Saldo / Lucro em Caixa
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (summary?.netBalance || 0) >= 0
                  ? 'text-primary'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(summary?.netBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas</p>
          </CardContent>
        </Card>

        {/* A Receber vs A Pagar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Previsão Pendente
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              + {formatCurrency(summary?.pendingReceivables || 0)} a receber
            </div>
            <div className="text-xs text-rose-500 mt-0.5">
              - {formatCurrency(summary?.pendingPayables || 0)} a pagar
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <FinancialTable
        transactions={transactions}
        onDelete={handleDelete}
        onAddNew={() => setIsModalOpen(true)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Modal */}
      <TransactionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleTransactionCreated}
      />
    </div>
  )
}
