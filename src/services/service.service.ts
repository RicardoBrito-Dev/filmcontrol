import { createClient } from '@/lib/supabase/client'
import type { ServiceCatalog } from '@/types/database.types'
import type { ServiceFormData } from '@/schemas/service.schema'

const STORAGE_KEY = 'filmcontrol_services'

export const initialSeedServices: ServiceCatalog[] = [
  // --- AUTOMOTIVO PACOTES ---
  {
    id: 's_comum_auto',
    company_id: 'comp1',
    name: 'Película Comum (Tintada) — Laterais e Traseiro (G5/G20/G35)',
    category: 'AUTOMOTIVO',
    description: 'Aplicação padrão em 4 portas e vidro traseiro para escurecimento e privacidade.',
    unit: 'veículo',
    default_price: 250.0,
    estimated_cost: 60.0,
    estimated_duration_minutes: 60,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_poliester_auto',
    company_id: 'comp1',
    name: 'Película Poliéster Profissional — Laterais e Traseiro',
    category: 'AUTOMOTIVO',
    description: 'Poliéster de alta durabilidade, proteção UV 99%, não desbota nem fica roxa.',
    unit: 'veículo',
    default_price: 450.0,
    estimated_cost: 110.0,
    estimated_duration_minutes: 75,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_ceramica_auto',
    company_id: 'comp1',
    name: 'Película Nano Cerâmica Térmica — Completo (Laterais + Traseiro)',
    category: 'AUTOMOTIVO',
    description: 'Alta tecnologia com máxima rejeição de calor infravermelho (até 90%) e conforto térmico.',
    unit: 'veículo',
    default_price: 850.0,
    estimated_cost: 220.0,
    estimated_duration_minutes: 90,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_parabrisa_ceramica',
    company_id: 'comp1',
    name: 'Para-brisa Nano Cerâmica Térmica (G70 / Transparente Térmico)',
    category: 'AUTOMOTIVO',
    description: 'Redução drástica do calor frontal sem escurecer a visão noturna (norma CONTRAN).',
    unit: 'un',
    default_price: 350.0,
    estimated_cost: 90.0,
    estimated_duration_minutes: 60,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_parabrisa_comum',
    company_id: 'comp1',
    name: 'Para-brisa Fumê Solar (G35 / G50 / G70)',
    category: 'AUTOMOTIVO',
    description: 'Película fumê para redução de claridade no para-brisa dianteiro.',
    unit: 'un',
    default_price: 180.0,
    estimated_cost: 45.0,
    estimated_duration_minutes: 45,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_antivandalismo',
    company_id: 'comp1',
    name: 'Película Antivandalismo / Segurança (PS4 / PS8)',
    category: 'AUTOMOTIVO',
    description: 'Película espessa de alta resistência contra quebra de vidros e tentativas de furto.',
    unit: 'veículo',
    default_price: 650.0,
    estimated_cost: 180.0,
    estimated_duration_minutes: 90,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_remocao',
    company_id: 'comp1',
    name: 'Remoção de Película Antiga + Limpeza de Cola',
    category: 'AUTOMOTIVO',
    description: 'Remoção cuidadosa preservando o desembaçador traseiro e limpando 100% da cola.',
    unit: 'veículo',
    default_price: 120.0,
    estimated_cost: 15.0,
    estimated_duration_minutes: 60,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // --- RESIDENCIAL / COMERCIAL / POR METRO QUADRADO (m²) ---
  {
    id: 's_jateado_m2',
    company_id: 'comp1',
    name: 'Película Jateada Fosca (Privacidade Banheiros / Sacadas / Portas)',
    category: 'RESIDENCIAL',
    description: 'Efeito acetinado translúcido para privacidade sem perder luminosidade natural.',
    unit: 'm²',
    default_price: 160.0,
    estimated_cost: 45.0,
    estimated_duration_minutes: 45,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_blackout_m2',
    company_id: 'comp1',
    name: 'Película Blackout (Bloqueio Total 100% de Luz)',
    category: 'RESIDENCIAL',
    description: 'Corte completo de luz e visão para quartos, estúdios, fachadas e vitrines.',
    unit: 'm²',
    default_price: 180.0,
    estimated_cost: 50.0,
    estimated_duration_minutes: 45,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_controle_solar_res',
    company_id: 'comp1',
    name: 'Película Fumê Controle Solar Residencial (G5 / G20 / G35)',
    category: 'RESIDENCIAL',
    description: 'Redução de calor, brilho excessivo e proteção contra desbotamento de pisos e móveis.',
    unit: 'm²',
    default_price: 130.0,
    estimated_cost: 38.0,
    estimated_duration_minutes: 45,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_espelhada_m2',
    company_id: 'comp1',
    name: 'Película Espelhada / Refletiva Prata (Privacidade Diurna)',
    category: 'RESIDENCIAL',
    description: 'Efeito espelhado externo para proteção térmica e privacidade diurna.',
    unit: 'm²',
    default_price: 150.0,
    estimated_cost: 42.0,
    estimated_duration_minutes: 45,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_ceramica_m2',
    company_id: 'comp1',
    name: 'Película Nano Cerâmica Residencial / Arquitetura por m²',
    category: 'RESIDENCIAL',
    description: 'Máxima redução de temperatura para fechamentos de sacada e janelas com sol forte.',
    unit: 'm²',
    default_price: 250.0,
    estimated_cost: 75.0,
    estimated_duration_minutes: 60,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's_vitrine_comercial',
    company_id: 'comp1',
    name: 'Película para Vitrine Comercial / Proteção UV e Fachadas',
    category: 'COMERCIAL',
    description: 'Proteção contra radiação UV para manequins e produtos em exposição em lojas.',
    unit: 'm²',
    default_price: 140.0,
    estimated_cost: 40.0,
    estimated_duration_minutes: 45,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function getLocalServices(): ServiceCatalog[] {
  if (typeof window === 'undefined') return initialSeedServices
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedServices))
    return initialSeedServices
  }
  try {
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed) && parsed.length >= initialSeedServices.length) {
      return parsed
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedServices))
    return initialSeedServices
  } catch {
    return initialSeedServices
  }
}

function saveLocalServices(services: ServiceCatalog[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
  }
}

export const serviceService = {
  async list(): Promise<ServiceCatalog[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('service_catalog')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (!error && data && data.length > 0) {
        saveLocalServices(data)
        return data
      }

      // Se a tabela no Supabase estiver vazia, faz o seed inicial no banco
      if (!error && data && data.length === 0) {
        const { data: { user } } = await supabase.auth.getUser()
        let companyId: string | undefined
        if (user) {
          const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
          companyId = profile?.company_id
        }
        if (!companyId) {
          const { data: comp } = await supabase.from('companies').select('id').limit(1).single()
          companyId = comp?.id
        }

        if (companyId) {
          const seedToInsert = initialSeedServices.map((s) => ({
            company_id: companyId,
            name: s.name,
            category: s.category,
            description: s.description,
            unit: s.unit,
            default_price: s.default_price,
            estimated_cost: s.estimated_cost,
            estimated_duration_minutes: s.estimated_duration_minutes,
            is_active: true,
          }))

          const { data: inserted } = await supabase
            .from('service_catalog')
            .insert(seedToInsert)
            .select()

          if (inserted && inserted.length > 0) {
            saveLocalServices(inserted)
            return inserted
          }
        }
      }
    } catch (err) {
      console.error('Erro ao listar serviços do Supabase:', err)
    }

    return getLocalServices()
  },

  async create(data: ServiceFormData): Promise<ServiceCatalog> {
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
          const { data: newService, error } = await supabase
            .from('service_catalog')
            .insert({
              company_id: companyId,
              name: data.name,
              category: data.category,
              description: data.description || null,
              unit: data.unit,
              default_price: data.default_price,
              estimated_cost: data.estimated_cost || null,
              estimated_duration_minutes: data.estimated_duration_minutes || null,
              is_active: data.is_active,
            })
            .select()
            .single()

          if (!error && newService) {
            const currentList = getLocalServices().filter((s) => s.id !== newService.id)
            saveLocalServices([newService, ...currentList])
            return newService
          }
        }
      }
    } catch {
      // Fallback
    }

    const newService: ServiceCatalog = {
      id: 's_' + Date.now(),
      company_id: 'comp1',
      name: data.name,
      category: data.category,
      description: data.description || null,
      unit: data.unit,
      default_price: data.default_price,
      estimated_cost: data.estimated_cost || null,
      estimated_duration_minutes: data.estimated_duration_minutes || null,
      is_active: data.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const currentList = getLocalServices()
    saveLocalServices([newService, ...currentList])
    return newService
  },

  async update(id: string, data: Partial<ServiceFormData>): Promise<ServiceCatalog> {
    try {
      const supabase = createClient()
      const { data: updated, error } = await supabase
        .from('service_catalog')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (!error && updated) {
        const currentList = getLocalServices()
        const index = currentList.findIndex((s) => s.id === id)
        if (index !== -1) {
          currentList[index] = updated
        } else {
          currentList.unshift(updated)
        }
        saveLocalServices(currentList)
        return updated
      }
    } catch {
      // Fallback
    }

    const currentList = getLocalServices()
    const index = currentList.findIndex((s) => s.id === id)
    if (index !== -1) {
      currentList[index] = {
        ...currentList[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      saveLocalServices(currentList)
      return currentList[index]
    }

    throw new Error('Serviço não encontrado')
  },

  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('service_catalog').delete().eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalServices()
    saveLocalServices(currentList.filter((s) => s.id !== id))
  },
}
