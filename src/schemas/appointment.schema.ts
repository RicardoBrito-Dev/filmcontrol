import { z } from 'zod'

export const appointmentSchema = z.object({
  customer_id: z.string().min(1, 'Selecione o cliente'),
  vehicle_id: z.string().optional().nullable(),
  title: z.string().min(1, 'Título / Serviço é obrigatório'),
  start_time: z.string().min(1, 'Data e horário de início são obrigatórios'),
  end_time: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(
    ['AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO', 'FALTOU'],
    { required_error: 'Status obrigatório' }
  ),
  notes: z.string().optional().nullable(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>
