import { createClient } from '@/lib/supabase/client'
import type { Vehicle } from '@/types/database.types'
import type { VehicleFormData } from '@/schemas/vehicle.schema'

export interface VehicleWithCustomer extends Vehicle {
  customer_name?: string
  customer_phone?: string
}

const STORAGE_KEY = 'filmcontrol_vehicles'

const initialSeedVehicles: VehicleWithCustomer[] = [
  {
    id: 'v1',
    company_id: 'comp1',
    customer_id: 'c1',
    brand: 'Chevrolet',
    model: 'Onix Plus Premier',
    year: 2023,
    color: 'Prata Shark',
    plate: 'BRA-2E19',
    type: 'CARRO',
    notes: 'Vidros originais, sem insufilm antigo.',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    customer_name: 'João Silva',
    customer_phone: '(11) 99999-1111',
  },
  {
    id: 'v2',
    company_id: 'comp1',
    customer_id: 'c1',
    brand: 'BMW',
    model: '320i M Sport',
    year: 2022,
    color: 'Azul Portimao',
    plate: 'BMW-3A20',
    type: 'CARRO',
    notes: 'Exige película de alta rejeição térmica nano cerâmica.',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    customer_name: 'João Silva',
    customer_phone: '(11) 99999-1111',
  },
  {
    id: 'v3',
    company_id: 'comp1',
    customer_id: 'c2',
    brand: 'Honda',
    model: 'Civic Touring',
    year: 2022,
    color: 'Preto Cristal',
    plate: 'CIV-9H88',
    type: 'CARRO',
    notes: 'Película G5 laterais e traseiro + G35 parabrisa.',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    customer_name: 'Pedro Henrique Souza',
    customer_phone: '(11) 98888-2222',
  },
  {
    id: 'v4',
    company_id: 'comp1',
    customer_id: 'c3',
    brand: 'Toyota',
    model: 'Corolla Cross XRE',
    year: 2024,
    color: 'Branco Lunar',
    plate: 'TOY-4K55',
    type: 'SUV',
    notes: 'Instalação completa + película antivandalismo.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    customer_name: 'Maria Clara Santos',
    customer_phone: '(11) 97777-3333',
  },
  {
    id: 'v5',
    company_id: 'comp1',
    customer_id: 'c4',
    brand: 'Ford',
    model: 'Ranger Limited 4x4',
    year: 2023,
    color: 'Cinza Moscovo',
    plate: 'FOR-7R34',
    type: 'PICKUP',
    notes: 'Película Carbon 70% rejeição térmica.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    customer_name: 'Carlos Eduardo Oliveira',
    customer_phone: '(11) 96666-4444',
  },
]

function getLocalVehicles(): VehicleWithCustomer[] {
  if (typeof window === 'undefined') return initialSeedVehicles
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedVehicles))
    return initialSeedVehicles
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialSeedVehicles
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

      if (error || !data || data.length === 0) {
        return getLocalVehicles()
      }

      return data.map((v) => ({
        ...v,
        customer_name: (v.customer as { name?: string })?.name,
        customer_phone:
          (v.customer as { whatsapp?: string; phone?: string })?.whatsapp ||
          (v.customer as { whatsapp?: string; phone?: string })?.phone,
      }))
    } catch {
      return getLocalVehicles()
    }
  },

  async listByCustomer(customerId: string): Promise<Vehicle[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) return data
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

        if (userProfile?.company_id) {
          const { data: newVehicle, error } = await supabase
            .from('vehicles')
            .insert({
              company_id: userProfile.company_id,
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
      await supabase.from('vehicles').delete().eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalVehicles()
    saveLocalVehicles(currentList.filter((v) => v.id !== id))
  },
}
