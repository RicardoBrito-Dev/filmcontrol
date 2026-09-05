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

function isValidUuid(id?: string | null): boolean {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export interface WorkOrderWithRelations extends WorkOrder {
  customer?: Customer
  vehicle?: Vehicle | null
  items?: WorkOrderItem[]
  files?: FileRecord[]
}

const STORAGE_KEY = 'filmcontrol_work_orders'

function getLocalWorkOrders(): WorkOrderWithRelations[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
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

      if (!error && data) {
        return data
      }
    } catch {
      // Fallback
    }

    return getLocalWorkOrders()
  },

  async getById(id: string): Promise<WorkOrderWithRelations | null> {
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

    const localList = getLocalWorkOrders()
    const found = localList.find((w) => w.id === id)
    return found || null
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
      installer_id: null,
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
          const { data: inserted, error } = await supabase
            .from('work_orders')
            .insert({
              company_id: companyId,
              number,
              customer_id: data.customer_id,
              vehicle_id: isValidUuid(data.vehicle_id) ? data.vehicle_id : null,
              quote_id: isValidUuid(data.quote_id) ? data.quote_id : null,
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
              service_id: isValidUuid(item.service_id) ? item.service_id : null,
              product_id: isValidUuid(item.product_id) ? item.product_id : null,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
            }))

            await supabase.from('work_order_items').insert(itemsToInsert)

            return {
              ...inserted,
              customer,
              vehicle,
              items: itemsToInsert,
              files: [],
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    const currentList = getLocalWorkOrders()
    saveLocalWorkOrders([newOrder, ...currentList])
    return newOrder
  },

  async createFromApprovedQuote(quote: any): Promise<WorkOrderWithRelations> {
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

    const notes = `Ordem gerada automaticamente do Orçamento #${quote.number}. ${quote.notes || ''}`

    // ========= 1. Busca e atualiza no Supabase =========
    try {
      const supabase = createClient()

      // Busca por quote_id (se UUID válido) OU por padrão no campo notes
      let existingList: any[] | null = null

      if (isValidUuid(quote.id)) {
        const { data } = await supabase
          .from('work_orders')
          .select(`*, customer:customers(*), vehicle:vehicles(*), items:work_order_items(*)`)
          .or(`quote_id.eq.${quote.id},notes.ilike.%#${quote.number}%`)
        existingList = data
      }

      // Fallback: busca apenas por notes se a primeira query não retornou nada
      if (!existingList || existingList.length === 0) {
        const { data } = await supabase
          .from('work_orders')
          .select(`*, customer:customers(*), vehicle:vehicles(*), items:work_order_items(*)`)
          .ilike('notes', `%#${quote.number}%`)
        existingList = data
      }

      if (existingList && existingList.length > 0) {
        const existing = existingList[0]

        // Tenta atualizar
        const { data: updated, error: updateError } = await supabase
          .from('work_orders')
          .update({
            customer_id: quote.customer_id,
            vehicle_id: isValidUuid(quote.vehicle_id) ? quote.vehicle_id : null,
            total: Number(quote.total || 0),
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select(`*, customer:customers(*), vehicle:vehicles(*), items:work_order_items(*)`)
          .single()

        if (updateError) {
          console.error('[WO] Erro ao atualizar OS existente:', updateError.message)
        }

        // Atualiza os itens da OS (delete + insert)
        try {
          await supabase.from('work_order_items').delete().eq('work_order_id', existing.id)
          const itemsToInsert = items.map((i) => ({
            work_order_id: existing.id,
            service_id: isValidUuid(i.service_id) ? i.service_id : null,
            product_id: isValidUuid(i.product_id) ? i.product_id : null,
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: i.subtotal,
          }))
          if (itemsToInsert.length > 0) {
            await supabase.from('work_order_items').insert(itemsToInsert)
          }
        } catch (itemErr) {
          console.error('[WO] Erro ao atualizar itens da OS:', itemErr)
        }

        // Usa o resultado atualizado ou o existente como fallback
        const result = updated || existing
        const finalResult = { ...result, items }

        // Sincroniza cache local
        const localList = getLocalWorkOrders()
        const idx = localList.findIndex(
          (w) => w.id === existing.id || w.quote_id === quote.id || (w.notes && w.notes.includes(quote.number))
        )
        if (idx !== -1) {
          localList[idx] = finalResult
        } else {
          localList.unshift(finalResult)
        }
        saveLocalWorkOrders(localList)

        // RETORNA AQUI — nunca cria duplicata se encontrou existente
        return finalResult
      }
    } catch (err) {
      console.error('[WO] Erro ao buscar/atualizar OS no Supabase:', err)
    }

    // ========= 2. Verifica se já existe no cache local =========
    const currentList = getLocalWorkOrders()
    const existingIdx = currentList.findIndex(
      (w) => w.quote_id === quote.id || (w.notes && w.notes.includes(quote.number))
    )

    if (existingIdx !== -1) {
      currentList[existingIdx] = {
        ...currentList[existingIdx],
        customer_id: quote.customer_id,
        vehicle_id: quote.vehicle_id || null,
        total: Number(quote.total || 0),
        notes,
        items,
        updated_at: new Date().toISOString(),
      }
      saveLocalWorkOrders(currentList)
      return currentList[existingIdx]
    }

    // ========= 3. Caso não exista em nenhum lugar, cria uma nova OS =========
    const payload: WorkOrderFormData = {
      customer_id: quote.customer_id,
      vehicle_id: quote.vehicle_id || null,
      quote_id: quote.id,
      installer_id: null,
      status: 'AGENDADO',
      payment_status: 'PENDENTE',
      total: Number(quote.total || 0),
      scheduled_at: new Date().toISOString(),
      notes,
      items,
    }

    const created = await this.create(payload, quote.customer, quote.vehicle)
    return created
  },

  async updateStatus(id: string, status: WorkOrderStatus): Promise<void> {
    try {
      const supabase = createClient()
      await supabase
        .from('work_orders')
        .update({
          status,
          completed_at: status === 'CONCLUIDO' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    } catch {
      // Fallback
    }

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
  },

  async updatePaymentStatus(id: string, payment_status: PaymentStatus): Promise<void> {
    try {
      const supabase = createClient()
      await supabase
        .from('work_orders')
        .update({ payment_status, updated_at: new Date().toISOString() })
        .eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalWorkOrders()
    const index = currentList.findIndex((w) => w.id === id)
    if (index !== -1) {
      currentList[index].payment_status = payment_status
      currentList[index].updated_at = new Date().toISOString()
      saveLocalWorkOrders(currentList)
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

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userProfile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
        if (userProfile?.company_id) {
          const { data: insertedFile } = await supabase.from('files').insert({
            company_id: userProfile.company_id,
            work_order_id: orderId,
            file_type: photo.file_type,
            url: photo.url,
            storage_path: `wo_${orderId}/${Date.now()}.jpg`,
            name: photo.name,
            size_bytes: 150000,
            created_by: user.id,
          }).select().single()

          if (insertedFile) return insertedFile
        }
      }
    } catch {
      // Fallback
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
    try {
      const supabase = createClient()
      await supabase.from('files').delete().eq('id', fileId)
    } catch {
      // Fallback
    }

    const currentList = getLocalWorkOrders()
    const index = currentList.findIndex((w) => w.id === orderId)
    if (index !== -1) {
      currentList[index].files = (currentList[index].files || []).filter((f) => f.id !== fileId)
      saveLocalWorkOrders(currentList)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('work_orders').delete().eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalWorkOrders()
    saveLocalWorkOrders(currentList.filter((w) => w.id !== id))
  },
}
