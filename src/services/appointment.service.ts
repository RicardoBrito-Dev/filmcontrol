import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus, Customer, Vehicle } from '@/types/database.types'
import type { AppointmentFormData } from '@/schemas/appointment.schema'

export interface AppointmentWithRelations extends Appointment {
  customer?: Customer
  vehicle?: Vehicle | null
  quote_number?: string | null
}

const STORAGE_KEY = 'filmcontrol_appointments'

function getLocalAppointments(): AppointmentWithRelations[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
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

      if (!error && data) {
        return data
      }
    } catch {
      // Fallback
    }

    return getLocalAppointments()
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
      installer_id: null,
      status: data.status,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer,
      vehicle,
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()

        let companyId = userProfile?.company_id
        if (!companyId) {
          const { data: comp } = await supabase.from('companies').select('id').limit(1).single()
          companyId = comp?.id
        }

        if (companyId) {
          const { data: dbApt, error } = await supabase
            .from('appointments')
            .insert({
              company_id: companyId,
              customer_id: data.customer_id,
              vehicle_id: data.vehicle_id || null,
              title: data.title,
              start_time: data.start_time,
              end_time: data.end_time || null,
              address: data.address || null,
              status: data.status,
              notes: data.notes || null,
            })
            .select(`*, customer:customers(*), vehicle:vehicles(*)`)
            .single()

          if (!error && dbApt) {
            return dbApt
          }
        }
      }
    } catch {
      // Fallback
    }

    const currentList = getLocalAppointments()
    saveLocalAppointments([newApt, ...currentList])
    return newApt
  },

  async createFromApprovedQuote(quote: any): Promise<AppointmentWithRelations> {
    const itemsSummary = (quote.items || [])
      .map((i: any) => i.description)
      .filter(Boolean)
      .join(', ') || 'Instalação de Películas'

    const title = `${itemsSummary} (Orç. #${quote.number})`
    const address = quote.customer?.address
      ? `${quote.customer.address}, ${quote.customer.address_number || ''} ${quote.customer.address_complement || ''}`.trim()
      : 'Na Loja'

    const notes = `Orçamento #${quote.number} aprovado. Valor Total: R$ ${quote.total}.`

    // 1. Verifica se já existe agendamento deste orçamento no Supabase
    try {
      const supabase = createClient()
      const { data: existingList } = await supabase
        .from('appointments')
        .select(`*, customer:customers(*), vehicle:vehicles(*)`)
        .or(`notes.ilike.%#${quote.number}%,title.ilike.%#${quote.number}%`)

      if (existingList && existingList.length > 0) {
        const existing = existingList[0]
        const { data: updated } = await supabase
          .from('appointments')
          .update({
            title,
            customer_id: quote.customer_id,
            vehicle_id: quote.vehicle_id || null,
            address,
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select(`*, customer:customers(*), vehicle:vehicles(*)`)
          .single()

        if (updated) {
          const localList = getLocalAppointments()
          const idx = localList.findIndex(
            (a) => a.id === existing.id || (a.notes && a.notes.includes(quote.number))
          )
          if (idx !== -1) {
            localList[idx] = updated
          } else {
            localList.unshift(updated)
          }
          saveLocalAppointments(localList)
          return updated
        }
      }
    } catch {
      // Fallback
    }

    // 2. Verifica se já existe no cache local
    const currentList = getLocalAppointments()
    const localExistingIndex = currentList.findIndex(
      (a) =>
        (a.notes && a.notes.includes(quote.number)) ||
        (a.title && a.title.includes(quote.number))
    )

    if (localExistingIndex !== -1) {
      currentList[localExistingIndex] = {
        ...currentList[localExistingIndex],
        customer_id: quote.customer_id,
        vehicle_id: quote.vehicle_id || null,
        title,
        address,
        notes,
        customer: quote.customer || currentList[localExistingIndex].customer,
        vehicle: quote.vehicle || currentList[localExistingIndex].vehicle,
        updated_at: new Date().toISOString(),
      }
      saveLocalAppointments(currentList)
      return currentList[localExistingIndex]
    }

    // 3. Caso não exista nenhum agendamento anterior, cria o primeiro
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() + 1)
    defaultStartTime.setHours(9, 0, 0, 0)

    const defaultEndTime = new Date(defaultStartTime)
    defaultEndTime.setHours(11, 30, 0, 0)

    const payload: AppointmentFormData = {
      customer_id: quote.customer_id,
      vehicle_id: quote.vehicle_id || null,
      title,
      start_time: defaultStartTime.toISOString(),
      end_time: defaultEndTime.toISOString(),
      address,
      status: 'CONFIRMADO',
      notes,
    }

    const created = await this.create(payload, quote.customer, quote.vehicle)
    return created
  },

  async updateDateTime(id: string, startTime: string, endTime?: string | null, fallbackApt?: AppointmentWithRelations | null): Promise<AppointmentWithRelations> {
    try {
      const supabase = createClient()
      const { data: updated, error } = await supabase
        .from('appointments')
        .update({
          start_time: startTime,
          end_time: endTime || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`*, customer:customers(*), vehicle:vehicles(*)`)
        .single()

      if (!error && updated) return updated
    } catch {
      // Fallback
    }

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
        installer_id: null,
        status: 'CONFIRMADO',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      saveLocalAppointments([updatedApt, ...currentList])
    }

    return updatedApt
  },

  async update(id: string, data: Partial<AppointmentFormData>): Promise<AppointmentWithRelations> {
    try {
      const supabase = createClient()
      const { data: updated, error } = await supabase
        .from('appointments')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`*, customer:customers(*), vehicle:vehicles(*)`)
        .single()

      if (!error && updated) return updated
    } catch {
      // Fallback
    }

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
    try {
      const supabase = createClient()
      await supabase.from('appointments').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalAppointments()
    const index = currentList.findIndex((a) => a.id === id)
    if (index !== -1) {
      currentList[index].status = status
      currentList[index].updated_at = new Date().toISOString()
      saveLocalAppointments(currentList)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('appointments').delete().eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalAppointments()
    saveLocalAppointments(currentList.filter((a) => a.id !== id))
  },
}
