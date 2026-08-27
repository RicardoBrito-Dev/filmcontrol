import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Nome do produto/película é obrigatório'),
  category: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  quantity: z.number({ invalid_type_error: 'Quantidade deve ser um número' }).min(0, 'Quantidade não pode ser negativa'),
  min_quantity: z.number({ invalid_type_error: 'Estoque mínimo deve ser um número' }).min(0, 'Estoque mínimo não pode ser negativo'),
  cost: z.number({ invalid_type_error: 'Custo deve ser um número' }).min(0, 'Custo não pode ser negativo'),
  supplier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const inventoryMovementSchema = z.object({
  product_id: z.string().min(1, 'Selecione o produto'),
  type: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE'], {
    required_error: 'Tipo de movimentação obrigatório',
  }),
  quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
  notes: z.string().optional().nullable(),
})

export type ProductFormData = z.infer<typeof productSchema>
export type InventoryMovementFormData = z.infer<typeof inventoryMovementSchema>
