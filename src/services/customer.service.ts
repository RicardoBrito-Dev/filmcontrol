import { createClient } from '@/lib/supabase/client'
import type { Customer, Vehicle, Quote, WorkOrder } from '@/types/database.types'
import type { CustomerFormData } from '@/schemas/customer.schema'

export interface CustomerWithRelations extends Customer {
  vehicles?: Vehicle[]
  quotes?: Quote[]
  work_orders?: WorkOrder[]
  total_spent?: number
  services_count?: number
  last_service_date?: string | null
}

const STORAGE_KEY = 'filmcontrol_customers'

// Seed customers fallback for immediate preview
const initialSeedCustomers: CustomerWithRelations[] = [
  {
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
    notes: 'Cliente exigente, prefere película Nano Cerâmica no carro e fumê controle solar na sacada do apartamento.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    total_spent: 1850.0,
    services_count: 2,
    last_service_date: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'c2',
    company_id: 'comp1',
    name: 'Pedro Henrique Souza',
    document: '234.567.890-11',
    phone: '(11) 2345-6789',
    whatsapp: '(11) 98888-2222',
    email: 'pedro.souza@email.com',
    zip_code: '04538-133',
    address: 'Av. Moema',
    address_number: '740',
    address_complement: 'Bloco B',
    neighborhood: 'Moema',
    city: 'São Paulo',
    state: 'SP',
    notes: 'Solicitou orçamento residencial para janela da sala + película G5 no Civic.',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    total_spent: 1200.0,
    services_count: 1,
    last_service_date: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'c3',
    company_id: 'comp1',
    name: 'Maria Clara Santos',
    document: '345.678.901-22',
    phone: '(11) 97777-3333',
    whatsapp: '(11) 97777-3333',
    email: 'maria.clara@email.com',
    zip_code: '01426-001',
    address: 'Alameda Lorena',
    address_number: '550',
    address_complement: 'Casa',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    notes: 'Aplicação residencial de película jateada de privacidade nos banheiros e varanda gourmet.',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    total_spent: 2400.0,
    services_count: 2,
    last_service_date: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'c4',
    company_id: 'comp1',
    name: 'Carlos Eduardo Oliveira',
    document: '456.789.012-33',
    phone: '(11) 96666-4444',
    whatsapp: '(11) 96666-4444',
    email: 'carlos.oliveira@empresa.com.br',
    zip_code: '07010-000',
    address: 'Rua Dom Pedro II',
    address_number: '88',
    address_complement: 'Sala 302',
    neighborhood: 'Centro',
    city: 'Guarulhos',
    state: 'SP',
    notes: 'Aplicação comercial de controle solar na fachada do escritório + película na Ford Ranger.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    total_spent: 3100.0,
    services_count: 3,
    last_service_date: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
]

function getLocalCustomers(): CustomerWithRelations[] {
  if (typeof window === 'undefined') return initialSeedCustomers
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedCustomers))
    return initialSeedCustomers
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialSeedCustomers
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

      if (error || !data || data.length === 0) {
        return getLocalCustomers()
      }

      return data.map((c) => ({
        ...c,
        total_spent: 0,
        services_count: c.vehicles?.length || 0,
      }))
    } catch {
      return getLocalCustomers()
    }
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

  async create(data: CustomerFormData): Promise<CustomerWithRelations> {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Try Supabase insert
      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (userProfile?.company_id) {
          const { data: newCustomer, error } = await supabase
            .from('customers')
            .insert({
              company_id: userProfile.company_id,
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
            return newCustomer
          }
        }
      }
    } catch {
      // Continue to local save
    }

    // Local fallback
    const newCustomer: CustomerWithRelations = {
      id: 'c_' + Date.now(),
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

    const currentList = getLocalCustomers()
    saveLocalCustomers([newCustomer, ...currentList])
    return newCustomer
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
