import { z } from 'zod'

export const quoteItemSchema = z.object({
  id: z.string().optional(),
  service_id: z.string().optional().nullable(),
  description: z.string().min(1, 'Descrição do item é obrigatória'),
  quantity: z.number().min(0.01, 'Quantidade inválida'),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  area: z.number().optional().nullable(),
  unit_price: z.number().min(0, 'Preço unitário inválido'),
  subtotal: z.number().min(0, 'Subtotal inválido'),
})

export const quoteSchema = z.object({
  customer_id: z.string().min(1, 'Selecione o cliente'),
  vehicle_id: z.string().optional().nullable(),
  status: z.enum(
    [
      'RASCUNHO',
      'ENVIADO',
      'AGUARDANDO_APROVACAO',
      'APROVADO',
      'RECUSADO',
      'EXPIRADO',
    ],
    { required_error: 'Status obrigatório' }
  ),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  total: z.number().min(0),
  valid_until: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).min(1, 'Adicione pelo menos um item ao orçamento'),
})

export type QuoteItemFormData = z.infer<typeof quoteItemSchema>
export type QuoteFormData = z.infer<typeof quoteSchema>
