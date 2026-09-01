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
        const totalSpent = (data.work_orders || [])
          .filter((w: WorkOrder) => w.payment_status === 'PAGO')
          .reduce((acc: number, w: WorkOrder) => acc + Number(w.total || 0), 0)

        return {
          ...data,
          total_spent: totalSpent,
          services_count: (data.work_orders || []).length,
          last_service_date: data.work_orders?.[0]?.created_at || null,
        }
      }
    } catch {
      // Fallback
    }

    const localList = getLocalCustomers()
    const found = localList.find((c) => c.id === id)
    return found || null
  },

  async create(
    data: CustomerFormData,
    vehicleInput?: QuickVehicleInput | null
  ): Promise<CustomerWithRelations> {
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
            const customerObj: CustomerWithRelations = {
              ...newCustomer,
              vehicles: [],
              total_spent: 0,
              services_count: 0,
            }

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

      // 1. Apagar itens de orçamentos e orçamentos vinculados ao cliente
      const { data: quotes } = await supabase.from('quotes').select('id').eq('customer_id', id)
      if (quotes && quotes.length > 0) {
        const qIds = quotes.map((q) => q.id)
        await supabase.from('quote_items').delete().in('quote_id', qIds)
        await supabase.from('quotes').delete().in('id', qIds)
      }

      // 2. Apagar pagamentos, itens de OS e OS vinculadas ao cliente
      const { data: workOrders } = await supabase.from('work_orders').select('id').eq('customer_id', id)
      if (workOrders && workOrders.length > 0) {
        const woIds = workOrders.map((w) => w.id)
        await supabase.from('payments').delete().in('work_order_id', woIds)
        await supabase.from('work_order_items').delete().in('work_order_id', woIds)
        await supabase.from('files').delete().in('work_order_id', woIds)
        await supabase.from('work_orders').delete().in('id', woIds)
      }

      // 3. Apagar agendamentos, avaliações, arquivos e veículos do cliente
      await supabase.from('appointments').delete().eq('customer_id', id)
      await supabase.from('reviews').delete().eq('customer_id', id)
      await supabase.from('files').delete().eq('customer_id', id)
      await supabase.from('vehicles').delete().eq('customer_id', id)

      // 4. Apagar o registro do cliente
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) {
        console.error('Erro ao excluir cliente no Supabase:', error)
      }
    } catch (err) {
      console.error('Exceção ao excluir cliente:', err)
    }

    // 5. Limpar do LocalStorage
    const currentList = getLocalCustomers()
    saveLocalCustomers(currentList.filter((c) => c.id !== id))

    if (typeof window !== 'undefined') {
      try {
        const vKey = 'filmcontrol_vehicles'
        const vData = localStorage.getItem(vKey)
        if (vData) {
          const vList = JSON.parse(vData)
          localStorage.setItem(vKey, JSON.stringify(vList.filter((v: any) => v.customer_id !== id)))
        }
      } catch {}

      try {
        const qKey = 'filmcontrol_quotes'
        const qData = localStorage.getItem(qKey)
        if (qData) {
          const qList = JSON.parse(qData)
          localStorage.setItem(qKey, JSON.stringify(qList.filter((q: any) => q.customer_id !== id)))
        }
      } catch {}

      try {
        const aKey = 'filmcontrol_appointments'
        const aData = localStorage.getItem(aKey)
        if (aData) {
          const aList = JSON.parse(aData)
          localStorage.setItem(aKey, JSON.stringify(aList.filter((a: any) => a.customer_id !== id)))
        }
      } catch {}

      try {
        const woKey = 'filmcontrol_work_orders'
        const woData = localStorage.getItem(woKey)
        if (woData) {
          const woList = JSON.parse(woData)
          localStorage.setItem(woKey, JSON.stringify(woList.filter((w: any) => w.customer_id !== id)))
        }
      } catch {}
    }
  },
}
