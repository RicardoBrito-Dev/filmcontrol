import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().min(1, 'Nome do serviço é obrigatório').min(2, 'Mínimo de 2 caracteres'),
  category: z.enum(['AUTOMOTIVO', 'RESIDENCIAL', 'COMERCIAL'], {
    required_error: 'Selecione uma categoria',
  }),
  description: z.string().optional().nullable(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  default_price: z
    .number({ invalid_type_error: 'Preço deve ser um número' })
    .min(0, 'Preço não pode ser negativo'),
  estimated_cost: z
    .number({ invalid_type_error: 'Custo deve ser um número' })
    .min(0, 'Custo não pode ser negativo')
    .optional()
    .nullable(),
  estimated_duration_minutes: z
    .number({ invalid_type_error: 'Duração deve ser em minutos' })
    .min(1, 'Duração mínima de 1 minuto')
    .optional()
    .nullable(),
  is_active: z.boolean(),
})

export type ServiceFormData = z.infer<typeof serviceSchema>
