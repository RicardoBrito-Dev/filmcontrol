import { createClient } from '@/lib/supabase/client'
import type { Customer, Vehicle, Quote, WorkOrder, VehicleType } from '@/types/database.types'
import type { CustomerFormData } from '@/schemas/customer.schema'
import { vehicleService } from '@/services/vehicle.service'

export interface CustomerWithRelations extends Customer {
  vehicles?: Vehicle[]
  quotes?: Quote[]
  work_orders?: WorkOrder[]
  total_spent?: number
  services_count?: number
  last_service_date?: string | null
}

export interface QuickVehicleInput {
  brand: string
  model: string
  year?: number | null
  color?: string | null
  plate?: string | null
  type?: VehicleType
  notes?: string | null
}

const STORAGE_KEY = 'filmcontrol_customers'

function getLocalCustomers(): CustomerWithRelations[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveLocalCustomers(customers: CustomerWithRelations[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
  }
}

export const customerService = {
  async list(): Promise<CustomerWithRelations[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          vehicles (*)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        return data.map((c) => ({
          ...c,
          total_spent: 0,
          services_count: c.vehicles?.length || 0,
        }))
      }
    } catch {
      // Fallback
    }

    return getLocalCustomers()
  },

  async getById(id: string): Promise<CustomerWithRelations | null> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          vehicles (*),
          quotes (*),
          work_orders (*)
        `)
        .eq('id', id)
        .single()

      if (!error && data) {
        const totalSpent = (data.work_orders || []).reduce(
          (acc: number, curr: WorkOrder) => acc + Number(curr.total || 0),
          0
        )
        return {
          ...data,
          total_spent: totalSpent,
          services_count: data.work_orders?.length || 0,
        }
      }
    } catch {
      // Fallback
    }

    const localList = getLocalCustomers()
    const found = localList.find((c) => c.id === id)
    return found || null
  },

  async create(data: CustomerFormData, vehicleInput?: QuickVehicleInput | null): Promise<CustomerWithRelations> {
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
          const { data: newCustomer, error } = await supabase
            .from('customers')
            .insert({
              company_id: companyId,
              name: data.name,
              document: data.document || null,
              phone: data.phone || null,
              whatsapp: data.whatsapp || null,
              email: data.email || null,
              zip_code: data.zip_code || null,
              address: data.address || null,
              address_number: data.address_number || null,
              address_complement: data.address_complement || null,
              neighborhood: data.neighborhood || null,
              city: data.city || null,
              state: data.state || null,
              notes: data.notes || null,
            })
            .select()
            .single()

          if (!error && newCustomer) {
            const customerObj: CustomerWithRelations = { ...newCustomer, vehicles: [] }

            if (vehicleInput?.brand && vehicleInput?.model) {
              const createdVeh = await vehicleService.create({
                customer_id: newCustomer.id,
                brand: vehicleInput.brand,
                model: vehicleInput.model,
                year: vehicleInput.year || null,
                color: vehicleInput.color || null,
                plate: vehicleInput.plate || null,
                type: vehicleInput.type || 'CARRO',
                notes: vehicleInput.notes || null,
              })
              customerObj.vehicles = [createdVeh]
            }

            return customerObj
          }
        }
      }
    } catch {
      // Continue to local save
    }

    // Local fallback
    const newCustId = 'c_' + Date.now()
    const createdCustomer: CustomerWithRelations = {
      id: newCustId,
      company_id: 'comp1',
      name: data.name,
      document: data.document || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      zip_code: data.zip_code || null,
      address: data.address || null,
      address_number: data.address_number || null,
      address_complement: data.address_complement || null,
      neighborhood: data.neighborhood || null,
      city: data.city || null,
      state: data.state || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vehicles: [],
      total_spent: 0,
      services_count: 0,
    }

    if (vehicleInput?.brand && vehicleInput?.model) {
      const createdVeh = await vehicleService.create({
        customer_id: newCustId,
        brand: vehicleInput.brand,
        model: vehicleInput.model,
        year: vehicleInput.year || null,
        color: vehicleInput.color || null,
        plate: vehicleInput.plate || null,
        type: vehicleInput.type || 'CARRO',
        notes: vehicleInput.notes || null,
      })
      createdCustomer.vehicles = [createdVeh]
    }

    const currentList = getLocalCustomers()
    saveLocalCustomers([createdCustomer, ...currentList])
    return createdCustomer
  },

  async update(id: string, data: Partial<CustomerFormData>): Promise<CustomerWithRelations> {
    try {
      const supabase = createClient()
      const { data: updated, error } = await supabase
        .from('customers')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (!error && updated) return updated
    } catch {
      // Fallback
    }

    const currentList = getLocalCustomers()
    const index = currentList.findIndex((c) => c.id === id)
    if (index !== -1) {
      currentList[index] = {
        ...currentList[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      saveLocalCustomers(currentList)
      return currentList[index]
    }

    throw new Error('Cliente não encontrado')
  },

  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('customers').delete().eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalCustomers()
    saveLocalCustomers(currentList.filter((c) => c.id !== id))
  },
}
