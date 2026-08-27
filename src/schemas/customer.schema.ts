import { z } from 'zod'

export const customerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres'),
  document: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  whatsapp: z
    .string()
    .min(1, 'WhatsApp / Telefone é obrigatório')
    .min(10, 'Número de WhatsApp inválido'),
  email: z
    .string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  // Endereço completo para aplicações residenciais e comerciais
  zip_code: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  address_number: z.string().optional().or(z.literal('')),
  address_complement: z.string().optional().or(z.literal('')),
  neighborhood: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type CustomerFormData = z.infer<typeof customerSchema>
