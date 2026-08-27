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

const initialSeedQuotes: QuoteWithRelations[] = [
  {
    id: 'q1',
    company_id: 'comp1',
    number: 'ORC-2024-1042',
    customer_id: 'c1',
    vehicle_id: 'v1',
    status: 'APROVADO',
    subtotal: 600.0,
    discount: 50.0,
    total: 550.0,
    notes: 'Instalação de película G5 em todos os vidros do Onix Plus.',
    valid_until: new Date(Date.now() + 15 * 86400000).toISOString(),
    created_by: 'u1',
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
        id: 'qi1',
        quote_id: 'q1',
        service_id: 's_comum',
        description: 'Película G5 Laterais e Traseiro',
        quantity: 1,
        width: null,
        height: null,
        area: null,
        unit_price: 350.0,
        subtotal: 350.0,
      },
      {
        id: 'qi2',
        quote_id: 'q1',
        service_id: 's_parabrisa',
        description: 'Película Para-brisa Solar 75%',
        quantity: 1,
        width: null,
        height: null,
        area: null,
        unit_price: 250.0,
        subtotal: 250.0,
      },
    ],
  },
  {
    id: 'q2',
    company_id: 'comp1',
    number: 'ORC-2024-1043',
    customer_id: 'c3',
    vehicle_id: null,
    status: 'AGUARDANDO_APROVACAO',
    subtotal: 1280.0,
    discount: 80.0,
    total: 1200.0,
    notes: 'Aplicação residencial: 4 vidros da sacada gourmet (1.90m x 0.50m) e porta balcão.',
    valid_until: new Date(Date.now() + 10 * 86400000).toISOString(),
    created_by: 'u1',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
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
    items: [
      {
        id: 'qi3',
        quote_id: 'q2',
        service_id: 's_jateado',
        description: 'Película Jateada Sacada (4 vidros de 1.90m x 0.50m)',
        quantity: 4,
        width: 1.9,
        height: 0.5,
        area: 3.8,
        unit_price: 160.0,
        subtotal: 608.0,
      },
      {
        id: 'qi4',
        quote_id: 'q2',
        service_id: 's_blackout',
        description: 'Controle Solar / Blackout Janelas Quarto',
        quantity: 2,
        width: 2.1,
        height: 1.0,
        area: 4.2,
        unit_price: 160.0,
        subtotal: 672.0,
      },
    ],
  },
  {
    id: 'q3',
    company_id: 'comp1',
    number: 'ORC-2024-1044',
    customer_id: 'c2',
    vehicle_id: 'v3',
    status: 'ENVIADO',
    subtotal: 850.0,
    discount: 0,
    total: 850.0,
    notes: 'Nano Cerâmica completa no Civic.',
    valid_until: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_by: 'u1',
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
    items: [
      {
        id: 'qi5',
        quote_id: 'q3',
        service_id: 's_ceramica',
        description: 'Película Nano Cerâmica Alta Performance',
        quantity: 1,
        width: null,
        height: null,
        area: null,
        unit_price: 850.0,
        subtotal: 850.0,
      },
    ],
  },
]

function getLocalQuotes(): QuoteWithRelations[] {
  if (typeof window === 'undefined') return initialSeedQuotes
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedQuotes))
    return initialSeedQuotes
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialSeedQuotes
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

      if (error || !data || data.length === 0) {
        return getLocalQuotes()
      }
      return data
    } catch {
      return getLocalQuotes()
    }
  },

  async getById(id: string): Promise<QuoteWithRelations | null> {
    const localList = getLocalQuotes()
    const found = localList.find((q) => q.id === id)
    if (found) return found

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

    return null
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

    // Save to local storage first
    const currentList = getLocalQuotes()
    saveLocalQuotes([newQuote, ...currentList])

    // Se já foi criado com status APROVADO, insere automaticamente na Agenda e nas Ordens de Serviço!
    if (data.status === 'APROVADO') {
      await Promise.all([
        appointmentService.createFromApprovedQuote(newQuote),
        workOrderService.createFromApprovedQuote(newQuote),
      ])
    }

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
          const { data: insertedQuote, error: quoteError } = await supabase
            .from('quotes')
            .insert({
              company_id: userProfile.company_id,
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
          }
        }
      }
    } catch {
      // Fallback
    }

    return newQuote
  },

  async updateStatus(id: string, status: QuoteStatus, explicitQuote?: QuoteWithRelations): Promise<QuoteWithRelations | null> {
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

    // Se o status mudou para APROVADO, cria o agendamento E a Ordem de Serviço automaticamente!
    if (status === 'APROVADO' && targetQuote) {
      await Promise.all([
        appointmentService.createFromApprovedQuote(targetQuote),
        workOrderService.createFromApprovedQuote(targetQuote),
      ])
    }

    // Try Supabase update
    try {
      const supabase = createClient()
      await supabase.from('quotes').update({ status }).eq('id', id)
    } catch {
      // Fallback
    }

    return targetQuote
  },

  async delete(id: string): Promise<void> {
    const currentList = getLocalQuotes()
    saveLocalQuotes(currentList.filter((q) => q.id !== id))

    try {
      const supabase = createClient()
      await supabase.from('quotes').delete().eq('id', id)
    } catch {
      // Fallback
    }
  },
}
