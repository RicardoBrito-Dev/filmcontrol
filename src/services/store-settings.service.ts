'use client'

import { createClient } from '@/lib/supabase/client'
import type { FilmPriceConfig } from './film-pricing.service'

export interface StoreSettings {
  name: string
  document?: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  pixKey?: string
  warrantyTerms?: string
  filmPrices?: Record<string, FilmPriceConfig>
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
      console.error('Erro ao ler configurações locais:', e)
    }
    return DEFAULT_STORE_SETTINGS
  },

  async fetchSettings(): Promise<StoreSettings> {
    const local = this.getSettings()
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      let companyId: string | undefined

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        companyId = profile?.company_id
      }

      let compData: any = null
      if (companyId) {
        const { data } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single()
        compData = data
      } else {
        const { data } = await supabase
          .from('companies')
          .select('*')
          .limit(1)
          .single()
        compData = data
      }

      if (compData) {
        let extra: any = {}
        if (compData.logo_url && compData.logo_url.startsWith('{')) {
          try {
            extra = JSON.parse(compData.logo_url)
          } catch {
            // ignore
          }
        }

        const merged: StoreSettings = {
          name: compData.name || local.name || DEFAULT_STORE_SETTINGS.name,
          document: compData.document || local.document || '',
          phone: compData.phone || local.phone || '',
          whatsapp: extra.whatsapp || compData.phone || local.whatsapp || '',
          email: compData.email || local.email || '',
          address: compData.address || local.address || '',
          pixKey: extra.pixKey || local.pixKey || '',
          warrantyTerms: extra.warrantyTerms || local.warrantyTerms || DEFAULT_STORE_SETTINGS.warrantyTerms,
          filmPrices: extra.filmPrices || local.filmPrices || undefined,
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          if (merged.filmPrices) {
            localStorage.setItem('filmcontrol_film_prices', JSON.stringify(merged.filmPrices))
          }
          window.dispatchEvent(new Event('store_settings_updated'))
        }

        return merged
      }
    } catch (err) {
      console.error('Erro ao buscar configurações no Supabase:', err)
    }

    return local
  },

  async saveSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = this.getSettings()
    const updated: StoreSettings = { ...current, ...settings }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      if (updated.filmPrices) {
        localStorage.setItem('filmcontrol_film_prices', JSON.stringify(updated.filmPrices))
      }
      window.dispatchEvent(new Event('store_settings_updated'))
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      let companyId: string | undefined

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        companyId = profile?.company_id
      }

      if (!companyId) {
        const { data: comp } = await supabase.from('companies').select('id').limit(1).single()
        companyId = comp?.id
      }

      const extraJson = JSON.stringify({
        pixKey: updated.pixKey || '',
        whatsapp: updated.whatsapp || '',
        warrantyTerms: updated.warrantyTerms || '',
        filmPrices: updated.filmPrices || null,
      })

      if (companyId) {
        await supabase
          .from('companies')
          .update({
            name: updated.name || 'Minha Loja de Películas',
            document: updated.document || null,
            phone: updated.phone || updated.whatsapp || null,
            email: updated.email || null,
            address: updated.address || null,
            logo_url: extraJson,
            updated_at: new Date().toISOString(),
          })
          .eq('id', companyId)
      } else {
        await supabase
          .from('companies')
          .insert({
            name: updated.name || 'Minha Loja de Películas',
            document: updated.document || null,
            phone: updated.phone || updated.whatsapp || null,
            email: updated.email || null,
            address: updated.address || null,
            logo_url: extraJson,
          })
      }
    } catch (err) {
      console.error('Erro ao persistir configurações da loja no Supabase:', err)
    }

    return updated
  },
}
