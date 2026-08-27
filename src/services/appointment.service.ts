import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus, Customer, Vehicle, Quote } from '@/types/database.types'
import type { AppointmentFormData } from '@/schemas/appointment.schema'

export interface AppointmentWithRelations extends Appointment {
  customer?: Customer
  vehicle?: Vehicle | null
  quote_number?: string | null
}

const STORAGE_KEY = 'filmcontrol_appointments'

const initialSeedAppointments: AppointmentWithRelations[] = [
  {
    id: 'apt1',
    company_id: 'comp1',
    customer_id: 'c1',
    vehicle_id: 'v1',
    work_order_id: null,
    title: 'Aplicação Película G5 Completa',
    start_time: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    address: 'Na loja',
    installer_id: 'u1',
    notes: 'Cliente aguardando na loja.',
    status: 'CONCLUIDO',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    customer: {
      id: 'c1',
      company_id: 'comp1',
      name: 'João Silva',
      document: '123.456.789-00',
      phone: '(11) 3456-7890',
      whatsapp: '(11) 99999-1111',
      email: 'joao.silva@email.com',
      zip_code: '05432-000',
      address: 'Rua Harmonia',
      address_number: '120',
      address_complement: 'Apto 42',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      notes: null,
      created_at: '',
      updated_at: '',
    },
    vehicle: {
      id: 'v1',
      company_id: 'comp1',
      customer_id: 'c1',
      brand: 'Chevrolet',
      model: 'Onix Plus Premier',
      year: 2023,
      color: 'Prata Shark',
      plate: 'BRA-2E19',
      type: 'CARRO',
      notes: null,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'apt2',
    company_id: 'comp1',
    customer_id: 'c2',
    vehicle_id: 'v3',
    work_order_id: null,
    title: 'Nano Cerâmica + Para-brisa',
    start_time: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(13, 30, 0, 0)).toISOString(),
    address: 'Na loja',
    installer_id: 'u1',
    notes: 'Honda Civic Touring preto.',
    status: 'EM_ANDAMENTO',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    customer: {
      id: 'c2',
      company_id: 'comp1',
      name: 'Pedro Henrique Souza',
      document: '234.567.890-11',
      phone: null,
      whatsapp: '(11) 98888-2222',
      email: 'pedro.souza@email.com',
      zip_code: '04538-133',
      address: 'Av. Moema',
      address_number: '740',
      address_complement: 'Bloco B',
      neighborhood: 'Moema',
      city: 'São Paulo',
      state: 'SP',
      notes: null,
      created_at: '',
      updated_at: '',
    },
    vehicle: {
      id: 'v3',
      company_id: 'comp1',
      customer_id: 'c2',
      brand: 'Honda',
      model: 'Civic Touring',
      year: 2022,
      color: 'Preto Cristal',
      plate: 'CIV-9H88',
      type: 'CARRO',
      notes: null,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'apt3',
    company_id: 'comp1',
    customer_id: 'c3',
    vehicle_id: null,
    work_order_id: null,
    title: 'Aplicação Residencial — Jateado Sacada',
    start_time: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(16, 30, 0, 0)).toISOString(),
    address: 'Alameda Lorena, 550 - Jardins',
    installer_id: 'u1',
    notes: 'Levar escada e solução de limpeza para vidros altos.',
    status: 'CONFIRMADO',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    customer: {
      id: 'c3',
      company_id: 'comp1',
      name: 'Maria Clara Santos',
      document: '345.678.901-22',
      phone: null,
      whatsapp: '(11) 97777-3333',
      email: 'maria.clara@email.com',
      zip_code: '01426-001',
      address: 'Alameda Lorena',
      address_number: '550',
      address_complement: 'Casa',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      notes: null,
      created_at: '',
      updated_at: '',
    },
    vehicle: null,
  },
]

function getLocalAppointments(): AppointmentWithRelations[] {
  if (typeof window === 'undefined') return initialSeedAppointments
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedAppointments))
    return initialSeedAppointments
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialSeedAppointments
  }
}

function saveLocalAppointments(appointments: AppointmentWithRelations[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))
  }
}

export const appointmentService = {
  async list(): Promise<AppointmentWithRelations[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers (*),
          vehicle:vehicles (*)
        `)
        .order('start_time', { ascending: true })

      if (error || !data || data.length === 0) {
        return getLocalAppointments()
      }
      return data
    } catch {
      return getLocalAppointments()
    }
  },

  async create(data: AppointmentFormData, customer?: Customer, vehicle?: Vehicle | null): Promise<AppointmentWithRelations> {
    const newId = 'apt_' + Date.now()
    const newApt: AppointmentWithRelations = {
      id: newId,
      company_id: 'comp1',
      customer_id: data.customer_id,
      vehicle_id: data.vehicle_id || null,
      work_order_id: null,
      title: data.title,
      start_time: data.start_time,
      end_time: data.end_time || null,
      address: data.address || null,
      installer_id: 'u1',
      status: data.status,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer,
      vehicle,
    }

    const currentList = getLocalAppointments()
    saveLocalAppointments([newApt, ...currentList])

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (userProfile?.company_id) {
          await supabase
            .from('appointments')
            .insert({
              company_id: userProfile.company_id,
              customer_id: data.customer_id,
              vehicle_id: data.vehicle_id || null,
              title: data.title,
              start_time: data.start_time,
              end_time: data.end_time || null,
              address: data.address || null,
              status: data.status,
              notes: data.notes || null,
            })
        }
      }
    } catch {
      // Fallback
    }

    return newApt
  },

  async createFromApprovedQuote(quote: any): Promise<AppointmentWithRelations> {
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() + 1)
    defaultStartTime.setHours(9, 0, 0, 0)

    const defaultEndTime = new Date(defaultStartTime)
    defaultEndTime.setHours(11, 30, 0, 0)

    const itemsSummary = (quote.items || [])
      .map((i: any) => i.description)
      .join(', ') || 'Instalação de Películas'

    const title = `${itemsSummary} (Orç. #${quote.number})`
    const address = quote.customer?.address
      ? `${quote.customer.address}, ${quote.customer.address_number || ''} ${quote.customer.address_complement || ''}`
      : 'Na Loja'

    const payload: AppointmentFormData = {
      customer_id: quote.customer_id,
      vehicle_id: quote.vehicle_id || null,
      title,
      start_time: defaultStartTime.toISOString(),
      end_time: defaultEndTime.toISOString(),
      address,
      status: 'CONFIRMADO',
      notes: `Orçamento #${quote.number} aprovado. Valor Total: R$ ${quote.total}.`,
    }

    const created = await this.create(payload, quote.customer, quote.vehicle)
    return created
  },

  async updateDateTime(id: string, startTime: string, endTime?: string | null, fallbackApt?: AppointmentWithRelations | null): Promise<AppointmentWithRelations> {
    const currentList = getLocalAppointments()
    const index = currentList.findIndex((a) => a.id === id)

    let updatedApt: AppointmentWithRelations

    if (index !== -1) {
      currentList[index].start_time = startTime
      currentList[index].end_time = endTime || null
      currentList[index].updated_at = new Date().toISOString()
      updatedApt = currentList[index]
      saveLocalAppointments(currentList)
    } else if (fallbackApt) {
      updatedApt = {
        ...fallbackApt,
        start_time: startTime,
        end_time: endTime || null,
        updated_at: new Date().toISOString(),
      }
      saveLocalAppointments([updatedApt, ...currentList])
    } else {
      updatedApt = {
        id,
        company_id: 'comp1',
        customer_id: '',
        vehicle_id: null,
        work_order_id: null,
        title: 'Instalação de Película',
        start_time: startTime,
        end_time: endTime || null,
        address: 'Na Loja',
        installer_id: 'u1',
        status: 'CONFIRMADO',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      saveLocalAppointments([updatedApt, ...currentList])
    }

    try {
      const supabase = createClient()
      await supabase
        .from('appointments')
        .update({
          start_time: startTime,
          end_time: endTime || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    } catch {
      // Fallback
    }

    return updatedApt
  },

  async update(id: string, data: Partial<AppointmentFormData>): Promise<AppointmentWithRelations> {
    const currentList = getLocalAppointments()
    const index = currentList.findIndex((a) => a.id === id)
    if (index !== -1) {
      currentList[index] = {
        ...currentList[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      saveLocalAppointments(currentList)
      return currentList[index]
    }
    throw new Error('Agendamento não encontrado')
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<void> {
    const currentList = getLocalAppointments()
    const index = currentList.findIndex((a) => a.id === id)
    if (index !== -1) {
      currentList[index].status = status
      currentList[index].updated_at = new Date().toISOString()
      saveLocalAppointments(currentList)
    }

    try {
      const supabase = createClient()
      await supabase.from('appointments').update({ status }).eq('id', id)
    } catch {
      // Fallback
    }
  },

  async delete(id: string): Promise<void> {
    const currentList = getLocalAppointments()
    saveLocalAppointments(currentList.filter((a) => a.id !== id))

    try {
      const supabase = createClient()
      await supabase.from('appointments').delete().eq('id', id)
    } catch {
      // Fallback
    }
  },
}
