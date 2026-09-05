import { storeSettingsService } from './store-settings.service'

export interface FilmPriceConfig {
  id: string
  name: string
  category: 'AUTOMOTIVO' | 'RESIDENCIAL' | 'COMERCIAL' | 'TODOS'
  badge?: string
  rollWidth?: number // Largura da bobina em metros (padrão 1.52m)
  costPerLinearMeter?: number // Custo por metro linear / corrido (R$/m)
  costPerM2: number // Custo por metro quadrado (R$/m²)
  pricePerM2: number // Preço de venda por metro quadrado (R$/m²)
  description: string
}

export const DEFAULT_FILM_PRICES: Record<string, FilmPriceConfig> = {
  comum: {
    id: 'comum',
    name: 'Película Comum (Tintada / Standard)',
    category: 'TODOS',
    badge: 'Econômica',
    rollWidth: 1.52,
    costPerLinearMeter: 30.0,
    costPerM2: 20.0,
    pricePerM2: 70.0,
    description: 'Película fumê padrão para escurecimento e privacidade básica.',
  },
  poliester: {
    id: 'poliester',
    name: 'Película Poliéster Profissional',
    category: 'TODOS',
    badge: 'Profissional',
    rollWidth: 1.52,
    costPerLinearMeter: 53.0,
    costPerM2: 35.0,
    pricePerM2: 120.0,
    description: 'Película de poliéster com proteção UV, não desbota fácil e excelente acabamento.',
  },
  nano_ceramica: {
    id: 'nano_ceramica',
    name: 'Película Nano Cerâmica Alta Performance',
    category: 'TODOS',
    badge: 'Térmica / Premium',
    rollWidth: 1.52,
    costPerLinearMeter: 114.0,
    costPerM2: 75.0,
    pricePerM2: 250.0,
    description: 'Alta tecnologia com até 90% de rejeição de calor infravermelho.',
  },
  jateado: {
    id: 'jateado',
    name: 'Película Jateada (Fosca / Privacidade)',
    category: 'RESIDENCIAL',
    badge: 'Residencial / Comercial',
    rollWidth: 1.52,
    costPerLinearMeter: 68.0,
    costPerM2: 45.0,
    pricePerM2: 160.0,
    description: 'Efeito jateado para banheiros, portas, sacadas, consultórios e divisórias.',
  },
  blackout: {
    id: 'blackout',
    name: 'Película Blackout (Bloqueio Total 100%)',
    category: 'RESIDENCIAL',
    badge: 'Privacidade Total',
    rollWidth: 1.52,
    costPerLinearMeter: 76.0,
    costPerM2: 50.0,
    pricePerM2: 180.0,
    description: 'Bloqueio 100% de passagem de luz para quartos, estúdios e vitrines.',
  },
  espelhada: {
    id: 'espelhada',
    name: 'Película Espelhada / Refletiva Prata',
    category: 'RESIDENCIAL',
    badge: 'Refletiva',
    rollWidth: 1.52,
    costPerLinearMeter: 64.0,
    costPerM2: 42.0,
    pricePerM2: 150.0,
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
      const merged: Record<string, FilmPriceConfig> = { ...DEFAULT_FILM_PRICES }
      for (const [k, v] of Object.entries(parsed as Record<string, FilmPriceConfig>)) {
        const rollWidth = v.rollWidth || 1.52
        const costPerM2 = v.costPerM2 || (v.costPerLinearMeter ? Number((v.costPerLinearMeter / rollWidth).toFixed(2)) : 30)
        const costPerLinearMeter = v.costPerLinearMeter || Number((costPerM2 * rollWidth).toFixed(2))
        merged[k] = {
          ...v,
          rollWidth,
          costPerM2,
          costPerLinearMeter,
        }
      }
      return merged
    } catch {
      return DEFAULT_FILM_PRICES
    }
  },

  async fetchPricing(): Promise<Record<string, FilmPriceConfig>> {
    try {
      const settings = await storeSettingsService.fetchSettings()
      if (settings.filmPrices && Object.keys(settings.filmPrices).length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.filmPrices))
        }
        return this.getPricing()
      }
    } catch (err) {
      console.error('Erro ao sincronizar preços com o banco de dados:', err)
    }
    return this.getPricing()
  },

  updatePricing(key: string, updates: Partial<FilmPriceConfig>): Record<string, FilmPriceConfig> {
    const current = this.getPricing()
    const rollWidth = updates.rollWidth ?? current[key]?.rollWidth ?? 1.52

    let costPerM2 = updates.costPerM2
    let costPerLinearMeter = updates.costPerLinearMeter

    if (costPerLinearMeter !== undefined && costPerM2 === undefined) {
      costPerM2 = Number((costPerLinearMeter / rollWidth).toFixed(2))
    } else if (costPerM2 !== undefined && costPerLinearMeter === undefined) {
      costPerLinearMeter = Number((costPerM2 * rollWidth).toFixed(2))
    }

    if (current[key]) {
      current[key] = {
        ...current[key],
        ...updates,
        rollWidth,
        costPerM2: costPerM2 ?? current[key].costPerM2,
        costPerLinearMeter: costPerLinearMeter ?? current[key].costPerLinearMeter ?? Number(((costPerM2 ?? current[key].costPerM2) * rollWidth).toFixed(2)),
      }
    } else {
      const finalCostM2 = costPerM2 ?? 30
      current[key] = {
        id: key,
        name: updates.name || 'Nova Película',
        category: updates.category || 'TODOS',
        badge: updates.badge || 'Personalizada',
        rollWidth,
        costPerLinearMeter: costPerLinearMeter ?? Number((finalCostM2 * rollWidth).toFixed(2)),
        costPerM2: finalCostM2,
        pricePerM2: updates.pricePerM2 || 100,
        description: updates.description || '',
        ...updates,
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    }

    // Persiste no banco de dados na nuvem
    storeSettingsService.saveSettings({ filmPrices: current }).catch(console.error)

    return current
  },

  deletePricing(key: string): Record<string, FilmPriceConfig> {
    const current = this.getPricing()
    delete current[key]
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    }
    storeSettingsService.saveSettings({ filmPrices: current }).catch(console.error)
    return current
  },

  saveAllPricing(pricing: Record<string, FilmPriceConfig>): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pricing))
    }
    storeSettingsService.saveSettings({ filmPrices: pricing }).catch(console.error)
  },
}
