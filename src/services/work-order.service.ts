import { createClient } from '@/lib/supabase/client'
import type {
  WorkOrder,
  WorkOrderItem,
  WorkOrderStatus,
  PaymentStatus,
  Customer,
  Vehicle,
  FileRecord,
} from '@/types/database.types'
import type { WorkOrderFormData } from '@/schemas/work-order.schema'
import { generateWorkOrderNumber } from '@/lib/utils'

export interface WorkOrderWithRelations extends WorkOrder {
  customer?: Customer
  vehicle?: Vehicle | null
  items?: WorkOrderItem[]
  files?: FileRecord[]
}

const STORAGE_KEY = 'filmcontrol_work_orders'

const initialSeedWorkOrders: WorkOrderWithRelations[] = [
  {
    id: 'wo1',
    company_id: 'comp1',
    number: 'OS-2024-5921',
    quote_id: 'q1',
    customer_id: 'c1',
    vehicle_id: 'v1',
    installer_id: 'u1',
    status: 'CONCLUIDO',
    notes: 'Aplicação perfeita de película G5 em todos os vidros.',
    total: 550.0,
    payment_status: 'PAGO',
    scheduled_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
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
    items: [
      {
        id: 'woi1',
        work_order_id: 'wo1',
        service_id: 's_comum',
        product_id: null,
        description: 'Película G5 Laterais e Traseiro',
        quantity: 1,
        unit_price: 350.0,
        subtotal: 350.0,
      },
      {
        id: 'woi2',
        work_order_id: 'wo1',
        service_id: 's_parabrisa',
        product_id: null,
        description: 'Película Para-brisa Solar 75%',
        quantity: 1,
        unit_price: 200.0,
        subtotal: 200.0,
      },
    ],
    files: [
      {
        id: 'f1',
        company_id: 'comp1',
        work_order_id: 'wo1',
        customer_id: 'c1',
        file_type: 'ANTES',
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        storage_path: 'wo1/antes-1.jpg',
        name: 'Vidros originais sem película',
        size_bytes: 120400,
        created_by: 'u1',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'f2',
        company_id: 'comp1',
        work_order_id: 'wo1',
        customer_id: 'c1',
        file_type: 'DEPOIS',
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
        storage_path: 'wo1/depois-1.jpg',
        name: 'Película G5 instalada com acabamento impecável',
        size_bytes: 145200,
        created_by: 'u1',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'wo2',
    company_id: 'comp1',
    number: 'OS-2024-5922',
    quote_id: null,
    customer_id: 'c2',
    vehicle_id: 'v3',
    installer_id: 'u1',
    status: 'EM_INSTALACAO',
    notes: 'Honda Civic Touring — Nano Cerâmica em andamento.',
    total: 850.0,
    payment_status: 'PARCIAL',
    scheduled_at: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    items: [
      {
        id: 'woi3',
        work_order_id: 'wo2',
        service_id: 's_ceramica',
        product_id: null,
        description: 'Película Nano Cerâmica Alta Performance',
        quantity: 1,
        unit_price: 850.0,
        subtotal: 850.0,
      },
    ],
    files: [],
  },
]

function getLocalWorkOrders(): WorkOrderWithRelations[] {
  if (typeof window === 'undefined') return initialSeedWorkOrders
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedWorkOrders))
    return initialSeedWorkOrders
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialSeedWorkOrders
  }
}

function saveLocalWorkOrders(orders: WorkOrderWithRelations[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  }
}

export const workOrderService = {
  async list(): Promise<WorkOrderWithRelations[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customer:customers (*),
          vehicle:vehicles (*),
          items:work_order_items (*),
          files (*)
        `)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        return getLocalWorkOrders()
      }
      return data
    } catch {
      return getLocalWorkOrders()
    }
  },

  async getById(id: string): Promise<WorkOrderWithRelations | null> {
    const localList = getLocalWorkOrders()
    const found = localList.find((w) => w.id === id)
    if (found) return found

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customer:customers (*),
          vehicle:vehicles (*),
          items:work_order_items (*),
          files (*)
        `)
        .eq('id', id)
        .single()

      if (!error && data) return data
    } catch {
      // Fallback
    }

    return null
  },

  async create(data: WorkOrderFormData, customer?: Customer, vehicle?: Vehicle | null): Promise<WorkOrderWithRelations> {
    const number = generateWorkOrderNumber()
    const newId = 'wo_' + Date.now()

    const newOrder: WorkOrderWithRelations = {
      id: newId,
      company_id: 'comp1',
      number,
      quote_id: data.quote_id || null,
      customer_id: data.customer_id,
      vehicle_id: data.vehicle_id || null,
      installer_id: 'u1',
      status: data.status,
      payment_status: data.payment_status,
      total: data.total,
      scheduled_at: data.scheduled_at || new Date().toISOString(),
      completed_at: data.status === 'CONCLUIDO' ? new Date().toISOString() : null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer,
      vehicle,
      items: data.items.map((item, idx) => ({
        id: 'woi_' + Date.now() + '_' + idx,
        work_order_id: newId,
        service_id: item.service_id || null,
        product_id: item.product_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
      files: [],
    }

    // Always update local storage first
    const currentList = getLocalWorkOrders()
    saveLocalWorkOrders([newOrder, ...currentList])

    // Try Supabase in background
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
          const { data: inserted, error } = await supabase
            .from('work_orders')
            .insert({
              company_id: userProfile.company_id,
              number,
              customer_id: data.customer_id,
              vehicle_id: data.vehicle_id || null,
              quote_id: data.quote_id || null,
              installer_id: user.id,
              status: data.status,
              payment_status: data.payment_status,
              total: data.total,
              scheduled_at: data.scheduled_at || null,
              notes: data.notes || null,
            })
            .select()
            .single()

          if (!error && inserted) {
            const itemsToInsert = data.items.map((item) => ({
              work_order_id: inserted.id,
              service_id: item.service_id || null,
              product_id: item.product_id || null,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
            }))

            await supabase.from('work_order_items').insert(itemsToInsert)
          }
        }
      }
    } catch {
      // Fallback
    }

    return newOrder
  },

  async createFromApprovedQuote(quote: any): Promise<WorkOrderWithRelations> {
    // Check if an order for this quote already exists
    const currentList = getLocalWorkOrders()
    const existing = currentList.find((w) => w.quote_id === quote.id || (w.notes && w.notes.includes(quote.number)))
    if (existing) return existing

    const items: any[] = (quote.items || []).map((i: any) => ({
      service_id: i.service_id || null,
      product_id: null,
      description: i.description,
      quantity: i.quantity || 1,
      unit_price: Number(i.unit_price || 0),
      subtotal: Number(i.subtotal || 0),
    }))

    if (items.length === 0) {
      items.push({
        description: 'Instalação de Películas',
        quantity: 1,
        unit_price: Number(quote.total || 0),
        subtotal: Number(quote.total || 0),
      })
    }

    const payload: WorkOrderFormData = {
      customer_id: quote.customer_id,
      vehicle_id: quote.vehicle_id || null,
      quote_id: quote.id,
      installer_id: null,
      status: 'AGENDADO',
      payment_status: 'PENDENTE',
      total: Number(quote.total || 0),
      scheduled_at: new Date().toISOString(),
      notes: `Ordem gerada automaticamente do Orçamento #${quote.number}. ${quote.notes || ''}`,
      items,
    }

    const created = await this.create(payload, quote.customer, quote.vehicle)
    return created
  },

  async updateStatus(id: string, status: WorkOrderStatus): Promise<void> {
    const currentList = getLocalWorkOrders()
    const index = currentList.findIndex((w) => w.id === id)
    if (index !== -1) {
      currentList[index].status = status
      if (status === 'CONCLUIDO') {
        currentList[index].completed_at = new Date().toISOString()
      }
      currentList[index].updated_at = new Date().toISOString()
      saveLocalWorkOrders(currentList)
    }

    try {
      const supabase = createClient()
      await supabase
        .from('work_orders')
        .update({
          status,
          completed_at: status === 'CONCLUIDO' ? new Date().toISOString() : null,
        })
        .eq('id', id)
    } catch {
      // Fallback
    }
  },

  async updatePaymentStatus(id: string, payment_status: PaymentStatus): Promise<void> {
    const currentList = getLocalWorkOrders()
    const index = currentList.findIndex((w) => w.id === id)
    if (index !== -1) {
      currentList[index].payment_status = payment_status
      currentList[index].updated_at = new Date().toISOString()
      saveLocalWorkOrders(currentList)
    }

    try {
      const supabase = createClient()
      await supabase
        .from('work_orders')
        .update({ payment_status })
        .eq('id', id)
    } catch {
      // Fallback
    }
  },

  async addPhoto(orderId: string, photo: { file_type: 'ANTES' | 'DEPOIS'; url: string; name: string }): Promise<FileRecord> {
    const newFile: FileRecord = {
      id: 'f_' + Date.now(),
      company_id: 'comp1',
      work_order_id: orderId,
      customer_id: null,
      file_type: photo.file_type,
      url: photo.url,
      storage_path: `wo_${orderId}/${Date.now()}.jpg`,
      name: photo.name,
      size_bytes: 150000,
      created_by: 'u1',
      created_at: new Date().toISOString(),
    }

    const currentList = getLocalWorkOrders()
    const index = currentList.findIndex((w) => w.id === orderId)
    if (index !== -1) {
      currentList[index].files = [...(currentList[index].files || []), newFile]
      saveLocalWorkOrders(currentList)
    }

    return newFile
  },

  async deletePhoto(orderId: string, fileId: string): Promise<void> {
    const currentList = getLocalWorkOrders()
    const index = currentList.findIndex((w) => w.id === orderId)
    if (index !== -1) {
      currentList[index].files = (currentList[index].files || []).filter((f) => f.id !== fileId)
      saveLocalWorkOrders(currentList)
    }
  },

  async delete(id: string): Promise<void> {
    const currentList = getLocalWorkOrders()
    saveLocalWorkOrders(currentList.filter((w) => w.id !== id))

    try {
      const supabase = createClient()
      await supabase.from('work_orders').delete().eq('id', id)
    } catch {
      // Fallback
    }
  },
}
