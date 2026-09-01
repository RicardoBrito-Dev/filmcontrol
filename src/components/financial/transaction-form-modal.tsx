'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, DollarSign, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  financialTransactionSchema,
  type FinancialTransactionFormData,
} from '@/schemas/financial.schema'
import { financialService } from '@/services/financial.service'
import type { FinancialTransaction } from '@/types/database.types'
import { toast } from '@/hooks/use-toast'

interface TransactionFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (transaction: FinancialTransaction) => void
}

export function TransactionFormModal({
  open,
  onOpenChange,
  onSuccess,
}: TransactionFormModalProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FinancialTransactionFormData>({
    resolver: zodResolver(financialTransactionSchema),
    defaultValues: {
      description: '',
      category: 'Vendas de PelÃ­culas',
      amount: 0,
      type: 'ENTRADA',
      method: 'PIX',
      status: 'PAGO',
      reference_date: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  })

  const currentType = watch('type')

  const onSubmit = async (data: FinancialTransactionFormData) => {
    setLoading(true)
    try {
      const created = await financialService.create(data)
      toast({
        title: 'LanÃ§amento financeiro registrado!',
        description: `${created.description} salvo com sucesso.`,
        variant: 'success' as 'default',
      })
      reset()
      onSuccess(created)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar lanÃ§amento'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto w-full sm:max-w-lg p-4 sm:p-6 gap-4 rounded-t-2xl sm:rounded-2xl top-auto bottom-0 sm:top-1/2 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Novo LanÃ§amento Financeiro
          </DialogTitle>
          <DialogDescription>
            Registre receitas (entradas) e despesas (saÃ­das) para controle de fluxo de caixa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo Entrada / SaÃ­da */}
          <div className="space-y-2">
            <Label>Tipo de LanÃ§amento</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={currentType === 'ENTRADA' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'ENTRADA')}
                className="gap-1.5"
              >
                <ArrowDownLeft className="h-4 w-4 text-emerald-500" /> Receita (Entrada)
              </Button>
              <Button
                type="button"
                variant={currentType === 'SAIDA' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'SAIDA')}
                className="gap-1.5"
              >
                <ArrowUpRight className="h-4 w-4 text-rose-500" /> Despesa (SaÃ­da)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-desc">
              DescriÃ§Ã£o <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tx-desc"
              placeholder={
                currentType === 'ENTRADA'
                  ? 'Ex: InstalaÃ§Ã£o pelÃ­cula Onix / Sinal cliente'
                  : 'Ex: Compra de bobinas de insulfilm / Aluguel'
              }
              {...register('description')}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tx-cat">Categoria</Label>
              <select
                id="tx-cat"
                {...register('category')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {currentType === 'ENTRADA' ? (
                  <>
                    <option value="Vendas de PelÃ­culas">Vendas de PelÃ­culas</option>
                    <option value="ServiÃ§os Residenciais">ServiÃ§os Residenciais</option>
                    <option value="ServiÃ§os Comerciais">ServiÃ§os Comerciais</option>
                    <option value="Outras Receitas">Outras Receitas</option>
                  </>
                ) : (
                  <>
                    <option value="Estoque / Fornecedores">Estoque / Fornecedores</option>
                    <option value="Despesas Fixas">Despesas Fixas</option>
                    <option value="Contas de Consumo">Contas de Consumo</option>
                    <option value="Ferramentas & Insumos">Ferramentas & Insumos</option>
                    <option value="Folha de Pagamento">Folha de Pagamento</option>
                    <option value="Outras Despesas">Outras Despesas</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-amt">
                Valor (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tx-amt"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
                className={`font-mono font-bold text-base ${
                  errors.amount ? 'border-destructive' : ''
                }`}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-method">Forma de Pagamento</Label>
              <select
                id="tx-method"
                {...register('method')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PIX">PIX</option>
                <option value="CREDITO">CartÃ£o de CrÃ©dito</option>
                <option value="DEBITO">CartÃ£o de DÃ©bito</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="BOLETO">Boleto BancÃ¡rio</option>
                <option value="TRANSFERENCIA">TransferÃªncia</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-status">Status</Label>
              <select
                id="tx-status"
                {...register('status')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PAGO">Pago / ConcluÃ­do</option>
                <option value="PENDENTE">Pendente / A Pagar / A Receber</option>
                <option value="VENCIDO">Vencido</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tx-date">Data de CompetÃªncia / Vencimento</Label>
              <Input id="tx-date" type="date" {...register('reference_date')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-notes">ObservaÃ§Ãµes</Label>
            <textarea
              id="tx-notes"
              rows={2}
              placeholder="NÃºmero de nota fiscal, comprovante ou observaÃ§Ã£o..."
              {...register('notes')}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar LanÃ§amento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

