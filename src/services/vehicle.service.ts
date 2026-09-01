import { createClient } from '@/lib/supabase/client'
import type { Vehicle } from '@/types/database.types'
import type { VehicleFormData } from '@/schemas/vehicle.schema'

export interface VehicleWithCustomer extends Vehicle {
  customer_name?: string
  customer_phone?: string
}

const STORAGE_KEY = 'filmcontrol_vehicles'

function getLocalVehicles(): VehicleWithCustomer[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveLocalVehicles(vehicles: VehicleWithCustomer[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles))
  }
}

export const vehicleService = {
  async list(): Promise<VehicleWithCustomer[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          customer:customers (name, phone, whatsapp)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        return data.map((v) => ({
          ...v,
          customer_name: (v.customer as { name?: string })?.name,
          customer_phone:
            (v.customer as { whatsapp?: string; phone?: string })?.whatsapp ||
            (v.customer as { whatsapp?: string; phone?: string })?.phone,
        }))
      }
    } catch {
      // Fallback
    }

    return getLocalVehicles()
  },

  async listByCustomer(customerId: string): Promise<Vehicle[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (!error && data) return data
    } catch {
      // Fallback
    }

    const localList = getLocalVehicles()
    return localList.filter((v) => v.customer_id === customerId)
  },

  async create(data: VehicleFormData): Promise<VehicleWithCustomer> {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

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
          const { data: newVehicle, error } = await supabase
            .from('vehicles')
            .insert({
              company_id: companyId,
              customer_id: data.customer_id,
              brand: data.brand,
              model: data.model,
              year: data.year || null,
              color: data.color || null,
              plate: data.plate ? data.plate.toUpperCase() : null,
              type: data.type,
              notes: data.notes || null,
            })
            .select(`*, customer:customers(name, phone, whatsapp)`)
            .single()

          if (!error && newVehicle) {
            return {
              ...newVehicle,
              customer_name: (newVehicle.customer as { name?: string })?.name,
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    const newVehicle: VehicleWithCustomer = {
      id: 'v_' + Date.now(),
      company_id: 'comp1',
      customer_id: data.customer_id,
      brand: data.brand,
      model: data.model,
      year: data.year || null,
      color: data.color || null,
      plate: data.plate ? data.plate.toUpperCase() : null,
      type: data.type,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const currentList = getLocalVehicles()
    saveLocalVehicles([newVehicle, ...currentList])
    return newVehicle
  },

  async update(id: string, data: Partial<VehicleFormData>): Promise<VehicleWithCustomer> {
    try {
      const supabase = createClient()
      const { data: updated, error } = await supabase
        .from('vehicles')
        .update({
          ...data,
          plate: data.plate ? data.plate.toUpperCase() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (!error && updated) return updated
    } catch {
      // Fallback
    }

    const currentList = getLocalVehicles()
    const index = currentList.findIndex((v) => v.id === id)
    if (index !== -1) {
      currentList[index] = {
        ...currentList[index],
        ...data,
        plate: data.plate ? data.plate.toUpperCase() : currentList[index].plate,
        updated_at: new Date().toISOString(),
      }
      saveLocalVehicles(currentList)
      return currentList[index]
    }

    throw new Error('Veículo não encontrado')
  },

  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      // Desvincular de orçamentos, ordens e agendamentos antes de excluir o veículo
      await supabase.from('quotes').update({ vehicle_id: null }).eq('vehicle_id', id)
      await supabase.from('work_orders').update({ vehicle_id: null }).eq('vehicle_id', id)
      await supabase.from('appointments').update({ vehicle_id: null }).eq('vehicle_id', id)
      await supabase.from('vehicles').delete().eq('id', id)
    } catch (err) {
      console.error('Erro ao excluir veículo:', err)
    }

    const currentList = getLocalVehicles()
    saveLocalVehicles(currentList.filter((v) => v.id !== id))
  },
}
