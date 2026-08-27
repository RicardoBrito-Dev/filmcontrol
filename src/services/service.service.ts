import { createClient } from '@/lib/supabase/client'
import type { ServiceCatalog } from '@/types/database.types'
import type { ServiceFormData } from '@/schemas/service.schema'

const STORAGE_KEY = 'filmcontrol_services'

const initialSeedServices: ServiceCatalog[] = [
  // 1. Película Comum (Tintada)
  {
    id: 's_comum',
    company_id: 'comp1',
    name: 'Película Comum (Tintada / Standard)',
    category: 'AUTOMOTIVO',
    description: 'Película fumê padrão para escurecimento, privacidade básica e redução de luminosidade.',
    unit: 'm²',
    default_price: 70.0,
    estimated_cost: 20.0,
    estimated_duration_minutes: 60,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  // 2. Película Poliéster
  {
    id: 's_poliester',
    company_id: 'comp1',
    name: 'Película Poliéster Profissional',
    category: 'AUTOMOTIVO',
    description: 'Película de poliéster de alta durabilidade, proteção UV de 99% e estabilidade de cor (não fica roxa).',
    unit: 'm²',
    default_price: 120.0,
    estimated_cost: 35.0,
    estimated_duration_minutes: 75,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  // 3. Película Nano Cerâmica
  {
    id: 's_ceramica',
    company_id: 'comp1',
    name: 'Película Nano Cerâmica Alta Performance',
    category: 'AUTOMOTIVO',
    description: 'Tecnologia de ponta com até 90% de rejeição de calor infravermelho e máxima proteção térmica.',
    unit: 'm²',
    default_price: 250.0,
    estimated_cost: 75.0,
    estimated_duration_minutes: 90,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  // 4. Película Jateada
  {
    id: 's_jateado',
    company_id: 'comp1',
    name: 'Película Jateada (Fosca / Privacidade)',
    category: 'RESIDENCIAL',
    description: 'Efeito jateado acetinado para banheiros, portas de vidro, sacadas e divisórias corporativas.',
    unit: 'm²',
    default_price: 160.0,
    estimated_cost: 45.0,
    estimated_duration_minutes: 60,
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  // 5. Película Blackout
  {
    id: 's_blackout',
    company_id: 'comp1',
    name: 'Película Blackout (Bloqueio Total 100%)',
    category: 'RESIDENCIAL',
    description: 'Bloqueio total de passagem de luz e visão completa para quartos, estúdios e fachadas.',
    unit: 'm²',
    default_price: 180.0,
    estimated_cost: 50.0,
    estimated_duration_minutes: 60,
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  // 6. Para-brisa Solar
  {
    id: 's_parabrisa',
    company_id: 'comp1',
    name: 'Película de Para-brisa Controle Solar 75%',
    category: 'AUTOMOTIVO',
    description: 'Aplicação exclusiva para o para-brisa frontal dentro das normas do CONTRAN.',
    unit: 'un',
    default_price: 250.0,
    estimated_cost: 70.0,
    estimated_duration_minutes: 60,
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  // 7. Remoção de Película
  {
    id: 's_remocao',
    company_id: 'comp1',
    name: 'Remoção de Película Antiga',
    category: 'AUTOMOTIVO',
    description: 'Remoção completa com limpeza técnica de cola e preservação do desembaçador térmico.',
    unit: 'veículo',
    default_price: 120.0,
    estimated_cost: 15.0,
    estimated_duration_minutes: 60,
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
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
    return JSON.parse(data)
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

      if (error || !data || data.length === 0) {
        return getLocalServices()
      }
      return data
    } catch {
      return getLocalServices()
    }
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

        if (userProfile?.company_id) {
          const { data: newService, error } = await supabase
            .from('service_catalog')
            .insert({
              company_id: userProfile.company_id,
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

          if (!error && newService) return newService
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

      if (!error && updated) return updated
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
