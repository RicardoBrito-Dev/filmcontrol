import { z } from 'zod'

export const vehicleSchema = z.object({
  customer_id: z.string().min(1, 'Selecione um cliente'),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  year: z
    .number({ invalid_type_error: 'Ano deve ser um número' })
    .min(1950, 'Ano inválido')
    .max(new Date().getFullYear() + 2, 'Ano inválido')
    .optional()
    .nullable(),
  color: z.string().optional().nullable(),
  plate: z.string().optional().nullable(),
  type: z.enum(['CARRO', 'SUV', 'PICKUP', 'MOTO', 'CAMINHAO', 'OUTRO'], {
    required_error: 'Selecione o tipo de veículo',
  }),
  notes: z.string().optional().nullable(),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>
