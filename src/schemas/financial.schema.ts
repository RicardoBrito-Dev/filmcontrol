import { z } from 'zod'

export const financialTransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z
    .number({ invalid_type_error: 'Valor deve ser um número' })
    .min(0.01, 'Valor deve ser maior que zero'),
  type: z.enum(['ENTRADA', 'SAIDA'], {
    required_error: 'Tipo obrigatório (Entrada ou Saída)',
  }),
  method: z
    .enum(['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'TRANSFERENCIA', 'BOLETO', 'OUTRO'])
    .optional()
    .nullable(),
  status: z.enum(['PAGO', 'PENDENTE', 'VENCIDO'], {
    required_error: 'Status de pagamento obrigatório',
  }),
  reference_date: z.string().min(1, 'Data de competência/vencimento é obrigatória'),
  notes: z.string().optional().nullable(),
})

export type FinancialTransactionFormData = z.infer<typeof financialTransactionSchema>
