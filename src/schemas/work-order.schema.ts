import { z } from 'zod'

export const workOrderItemSchema = z.object({
  id: z.string().optional(),
  service_id: z.string().optional().nullable(),
  product_id: z.string().optional().nullable(),
  description: z.string().min(1, 'Descrição do item é obrigatória'),
  quantity: z.number().min(0.01, 'Quantidade inválida'),
  unit_price: z.number().min(0, 'Preço unitário inválido'),
  subtotal: z.number().min(0, 'Subtotal inválido'),
})

export const workOrderSchema = z.object({
  customer_id: z.string().min(1, 'Selecione o cliente'),
  vehicle_id: z.string().optional().nullable(),
  installer_id: z.string().optional().nullable(),
  quote_id: z.string().optional().nullable(),
  status: z.enum(
    ['AGENDADO', 'EM_INSTALACAO', 'AGUARDANDO_PAGAMENTO', 'CONCLUIDO', 'CANCELADO'],
    { required_error: 'Status obrigatório' }
  ),
  payment_status: z.enum(['PAGO', 'PARCIAL', 'PENDENTE', 'ATRASADO'], {
    required_error: 'Status de pagamento obrigatório',
  }),
  total: z.number().min(0),
  scheduled_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(workOrderItemSchema).min(1, 'Adicione pelo menos um serviço ou produto'),
})

export type WorkOrderItemFormData = z.infer<typeof workOrderItemSchema>
export type WorkOrderFormData = z.infer<typeof workOrderSchema>
