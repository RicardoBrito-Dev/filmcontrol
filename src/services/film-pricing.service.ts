export interface FilmPriceConfig {
  id: string
  name: string
  category: 'AUTOMOTIVO' | 'RESIDENCIAL' | 'COMERCIAL' | 'TODOS'
  pricePerM2: number
  costPerM2: number
  description: string
}

export const DEFAULT_FILM_PRICES: Record<string, FilmPriceConfig> = {
  comum: {
    id: 'comum',
    name: 'Película Comum (Tintada / Standard)',
    category: 'TODOS',
    pricePerM2: 70.0,
    costPerM2: 20.0,
    description: 'Película fumê econômica para escurecimento e privacidade básica.',
  },
  poliester: {
    id: 'poliester',
    name: 'Película Poliéster Profissional',
    category: 'TODOS',
    pricePerM2: 120.0,
    costPerM2: 35.0,
    description: 'Película de poliéster de alta durabilidade, proteção UV e estabilidade de cor.',
  },
  nano_ceramica: {
    id: 'nano_ceramica',
    name: 'Película Nano Cerâmica Alta Performance',
    category: 'TODOS',
    pricePerM2: 250.0,
    costPerM2: 75.0,
    description: 'Tecnologia de ponta com até 90% de rejeição de calor por infravermelho.',
  },
  jateado: {
    id: 'jateado',
    name: 'Película Jateada (Fosca / Privacidade)',
    category: 'RESIDENCIAL',
    pricePerM2: 160.0,
    costPerM2: 45.0,
    description: 'Efeito jateado acetinado para banheiros, portas, sacadas e divisórias.',
  },
  blackout: {
    id: 'blackout',
    name: 'Película Blackout (Bloqueio 100% de Luz)',
    category: 'RESIDENCIAL',
    pricePerM2: 180.0,
    costPerM2: 50.0,
    description: 'Bloqueio total de visão e passagem de luz para quartos, estúdios e vitrines.',
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
      return { ...DEFAULT_FILM_PRICES, ...JSON.parse(data) }
    } catch {
      return DEFAULT_FILM_PRICES
    }
  },

  updatePricing(key: string, updates: Partial<FilmPriceConfig>): Record<string, FilmPriceConfig> {
    const current = this.getPricing()
    if (current[key]) {
      current[key] = { ...current[key], ...updates }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
      }
    }
    return current
  },

  saveAllPricing(pricing: Record<string, FilmPriceConfig>): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pricing))
    }
  },
}
