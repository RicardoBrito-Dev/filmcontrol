'use client'

export interface StoreSettings {
  name: string
  document?: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  pixKey?: string
  warrantyTerms?: string
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  name: 'Minha Loja de Películas',
  document: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  pixKey: '',
  warrantyTerms: `1. GARANTIA: Garantia de 3 a 5 anos contra bolhas, descolamento e desbotamento para películas da linha Premium e Carbon.
2. CUIDADOS PÓS-INSTALAÇÃO: Não abrir os vidros laterais e traseiro por no mínimo 72 horas para cura total da película. Não utilizar produtos abrasivos ou álcool na limpeza interna.
3. FORMAS DE PAGAMENTO: Pagamento via PIX com desconto à vista ou parcelado no cartão.`,
}

const STORAGE_KEY = 'filmcontrol_store_settings'

export const storeSettingsService = {
  getSettings(): StoreSettings {
    if (typeof window === 'undefined') return DEFAULT_STORE_SETTINGS
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.error('Erro ao ler configurações da loja:', e)
    }
    return DEFAULT_STORE_SETTINGS
  },

  saveSettings(settings: Partial<StoreSettings>): StoreSettings {
    if (typeof window === 'undefined') return DEFAULT_STORE_SETTINGS
    try {
      const current = this.getSettings()
      const updated = { ...current, ...settings }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      // Disparar evento para componentes ouvirem a mudança em tempo real
      window.dispatchEvent(new Event('store_settings_updated'))
      return updated
    } catch (e) {
      console.error('Erro ao salvar configurações da loja:', e)
      return DEFAULT_STORE_SETTINGS
    }
  },
}
