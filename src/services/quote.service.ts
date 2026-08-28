import { createClient } from '@/lib/supabase/client'
import type { Quote, QuoteItem, QuoteStatus, Customer, Vehicle } from '@/types/database.types'
import type { QuoteFormData } from '@/schemas/quote.schema'
import { generateQuoteNumber } from '@/lib/utils'
import { appointmentService } from '@/services/appointment.service'
import { workOrderService } from '@/services/work-order.service'

export interface QuoteWithRelations extends Quote {
  customer?: Customer
  vehicle?: Vehicle | null
  items?: QuoteItem[]
}

const STORAGE_KEY = 'filmcontrol_quotes'

function getLocalQuotes(): QuoteWithRelations[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveLocalQuotes(quotes: QuoteWithRelations[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
  }
}

export const quoteService = {
  async list(): Promise<QuoteWithRelations[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customers (*),
          vehicle:vehicles (*),
          items:quote_items (*)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        return data
      }
    } catch {
      // Fallback
    }

    return getLocalQuotes()
  },

  async getById(id: string): Promise<QuoteWithRelations | null> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customers (*),
          vehicle:vehicles (*),
          items:quote_items (*)
        `)
        .eq('id', id)
        .single()

      if (!error && data) return data
    } catch {
      // Fallback
    }

    const localList = getLocalQuotes()
    const found = localList.find((q) => q.id === id)
    return found || null
  },

  async create(data: QuoteFormData, customer?: Customer, vehicle?: Vehicle | null): Promise<QuoteWithRelations> {
    const number = generateQuoteNumber()
    const quoteId = 'q_' + Date.now()
    const newQuote: QuoteWithRelations = {
      id: quoteId,
      company_id: 'comp1',
      number,
      customer_id: data.customer_id,
      vehicle_id: data.vehicle_id || null,
      status: data.status,
      subtotal: data.subtotal,
      discount: data.discount || 0,
      total: data.total,
      valid_until: data.valid_until || null,
      notes: data.notes || null,
      created_by: 'u1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer,
      vehicle,
      items: data.items.map((item, idx) => ({
        id: 'qi_' + Date.now() + '_' + idx,
        quote_id: quoteId,
        service_id: item.service_id || null,
        description: item.description,
        quantity: item.quantity,
        width: item.width || null,
        height: item.height || null,
        area: item.area || null,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
    }

    // Try Supabase first
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
          const { data: insertedQuote, error: quoteError } = await supabase
            .from('quotes')
            .insert({
              company_id: companyId,
              number,
              customer_id: data.customer_id,
              vehicle_id: data.vehicle_id || null,
              status: data.status,
              subtotal: data.subtotal,
              discount: data.discount || 0,
              total: data.total,
              valid_until: data.valid_until || null,
              notes: data.notes || null,
              created_by: user.id,
            })
            .select()
            .single()

          if (!quoteError && insertedQuote) {
            const itemsToInsert = data.items.map((item) => ({
              quote_id: insertedQuote.id,
              service_id: item.service_id || null,
              description: item.description,
              quantity: item.quantity,
              width: item.width || null,
              height: item.height || null,
              area: item.area || null,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
            }))

            await supabase.from('quote_items').insert(itemsToInsert)

            const fullQuote: QuoteWithRelations = {
              ...insertedQuote,
              customer,
              vehicle,
              items: itemsToInsert,
            }

            if (data.status === 'APROVADO') {
              await Promise.all([
                appointmentService.createFromApprovedQuote(fullQuote),
                workOrderService.createFromApprovedQuote(fullQuote),
              ])
            }

            return fullQuote
          }
        }
      }
    } catch {
      // Fallback
    }

    // Save to local storage fallback
    const currentList = getLocalQuotes()
    saveLocalQuotes([newQuote, ...currentList])

    if (data.status === 'APROVADO') {
      await Promise.all([
        appointmentService.createFromApprovedQuote(newQuote),
        workOrderService.createFromApprovedQuote(newQuote),
      ])
    }

    return newQuote
  },

  async update(id: string, data: QuoteFormData, customer?: Customer, vehicle?: Vehicle | null): Promise<QuoteWithRelations> {
    const updatedItems = data.items.map((item, idx) => ({
      id: 'qi_' + Date.now() + '_' + idx,
      quote_id: id,
      service_id: item.service_id || null,
      description: item.description,
      quantity: item.quantity,
      width: item.width || null,
      height: item.height || null,
      area: item.area || null,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }))

    try {
      const supabase = createClient()
      const { data: updated, error } = await supabase
        .from('quotes')
        .update({
          customer_id: data.customer_id,
          vehicle_id: data.vehicle_id || null,
          status: data.status,
          subtotal: data.subtotal,
          discount: data.discount || 0,
          total: data.total,
          valid_until: data.valid_until || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (!error && updated) {
        // Delete old items and insert updated items
        await supabase.from('quote_items').delete().eq('quote_id', id)
        if (updatedItems.length > 0) {
          await supabase.from('quote_items').insert(updatedItems)
        }

        const fullQuote: QuoteWithRelations = {
          ...updated,
          customer,
          vehicle,
          items: updatedItems,
        }

        if (data.status === 'APROVADO') {
          await Promise.all([
            appointmentService.createFromApprovedQuote(fullQuote),
            workOrderService.createFromApprovedQuote(fullQuote),
          ])
        }

        return fullQuote
      }
    } catch {
      // Fallback
    }

    // Local fallback
    const currentList = getLocalQuotes()
    const index = currentList.findIndex((q) => q.id === id)
    let updatedQuote: QuoteWithRelations

    if (index !== -1) {
      currentList[index] = {
        ...currentList[index],
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id || null,
        status: data.status,
        subtotal: data.subtotal,
        discount: data.discount || 0,
        total: data.total,
        valid_until: data.valid_until || null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
        customer: customer || currentList[index].customer,
        vehicle: vehicle || currentList[index].vehicle,
        items: updatedItems,
      }
      updatedQuote = currentList[index]
      saveLocalQuotes(currentList)
    } else {
      updatedQuote = {
        id,
        company_id: 'comp1',
        number: generateQuoteNumber(),
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id || null,
        status: data.status,
        subtotal: data.subtotal,
        discount: data.discount || 0,
        total: data.total,
        valid_until: data.valid_until || null,
        notes: data.notes || null,
        created_by: 'u1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer,
        vehicle,
        items: updatedItems,
      }
      saveLocalQuotes([updatedQuote, ...currentList])
    }

    if (data.status === 'APROVADO') {
      await Promise.all([
        appointmentService.createFromApprovedQuote(updatedQuote),
        workOrderService.createFromApprovedQuote(updatedQuote),
      ])
    }

    return updatedQuote
  },

  async updateStatus(id: string, status: QuoteStatus, explicitQuote?: QuoteWithRelations): Promise<QuoteWithRelations | null> {
    try {
      const supabase = createClient()
      await supabase.from('quotes').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalQuotes()
    const index = currentList.findIndex((q) => q.id === id)
    let targetQuote = explicitQuote || (index !== -1 ? currentList[index] : null)

    if (index !== -1) {
      currentList[index].status = status
      currentList[index].updated_at = new Date().toISOString()
      saveLocalQuotes(currentList)
      targetQuote = currentList[index]
    } else if (explicitQuote) {
      explicitQuote.status = status
      saveLocalQuotes([explicitQuote, ...currentList])
      targetQuote = explicitQuote
    }

    if (status === 'APROVADO' && targetQuote) {
      await Promise.all([
        appointmentService.createFromApprovedQuote(targetQuote),
        workOrderService.createFromApprovedQuote(targetQuote),
      ])
    }

    return targetQuote
  },

  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('quotes').delete().eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalQuotes()
    saveLocalQuotes(currentList.filter((q) => q.id !== id))
  },
}
