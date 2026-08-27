export interface FilmPriceConfig {
  id: string
  name: string
  category: 'AUTOMOTIVO' | 'RESIDENCIAL' | 'COMERCIAL' | 'TODOS'
  badge?: string
  pricePerM2: number
  costPerM2: number
  description: string
}

export const DEFAULT_FILM_PRICES: Record<string, FilmPriceConfig> = {
  comum: {
    id: 'comum',
    name: 'Película Comum (Tintada / Standard)',
    category: 'TODOS',
    badge: 'Econômica',
    pricePerM2: 70.0,
    costPerM2: 20.0,
    description: 'Película fumê padrão para escurecimento e privacidade básica.',
  },
  poliester: {
    id: 'poliester',
    name: 'Película Poliéster Profissional',
    category: 'TODOS',
    badge: 'Profissional',
    pricePerM2: 120.0,
    costPerM2: 35.0,
    description: 'Película de poliéster com proteção UV, não desbota fácil e excelente acabamento.',
  },
  nano_ceramica: {
    id: 'nano_ceramica',
    name: 'Película Nano Cerâmica Alta Performance',
    category: 'TODOS',
    badge: 'Térmica / Premium',
    pricePerM2: 250.0,
    costPerM2: 75.0,
    description: 'Alta tecnologia com até 90% de rejeição de calor infravermelho.',
  },
  jateado: {
    id: 'jateado',
    name: 'Película Jateada (Fosca / Privacidade)',
    category: 'RESIDENCIAL',
    badge: 'Residencial / Comercial',
    pricePerM2: 160.0,
    costPerM2: 45.0,
    description: 'Efeito jateado para banheiros, portas, sacadas, consultórios e divisórias.',
  },
  blackout: {
    id: 'blackout',
    name: 'Película Blackout (Bloqueio Total 100%)',
    category: 'RESIDENCIAL',
    badge: 'Privacidade Total',
    pricePerM2: 180.0,
    costPerM2: 50.0,
    description: 'Bloqueio 100% de passagem de luz para quartos, estúdios e vitrines.',
  },
  espelhada: {
    id: 'espelhada',
    name: 'Película Espelhada / Refletiva Prata',
    category: 'RESIDENCIAL',
    badge: 'Refletiva',
    pricePerM2: 150.0,
    costPerM2: 42.0,
    description: 'Efeito espelhado externo para alta proteção solar e privacidade diurna.',
  },
}

const STORAGE_KEY = 'filmcontrol_film_prices'

export const filmPricingService = {
  getPricing(): Record<string, FilmPriceConfig> {
    if (typeof window === 'undefined') return DEFAULT_FILM_PRICES
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FILM_PRICES))
      return DEFAULT_FILM_PRICES
    }
    try {
      const parsed = JSON.parse(data)
      return { ...DEFAULT_FILM_PRICES, ...parsed }
    } catch {
      return DEFAULT_FILM_PRICES
    }
  },

  updatePricing(key: string, updates: Partial<FilmPriceConfig>): Record<string, FilmPriceConfig> {
    const current = this.getPricing()
    if (current[key]) {
      current[key] = { ...current[key], ...updates }
    } else {
      current[key] = {
        id: key,
        name: updates.name || 'Nova Película',
        category: updates.category || 'TODOS',
        badge: updates.badge || 'Personalizada',
        pricePerM2: updates.pricePerM2 || 100,
        costPerM2: updates.costPerM2 || 30,
        description: updates.description || '',
        ...updates,
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    }
    return current
  },

  deletePricing(key: string): Record<string, FilmPriceConfig> {
    const current = this.getPricing()
    delete current[key]
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    }
    return current
  },

  saveAllPricing(pricing: Record<string, FilmPriceConfig>): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pricing))
    }
  },
}
