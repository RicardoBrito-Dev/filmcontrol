import { createClient } from '@/lib/supabase/client'
import type { LoginCredentials, RegisterData, ResetPasswordData } from '@/types/auth.types'

export const authService = {
  async login({ email, password }: LoginCredentials) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async register({ full_name, email, password, company_name }: RegisterData) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, company_name },
      },
    })
    if (error) throw error
    return data
  },

  async resetPassword({ email }: ResetPasswordData) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  async logout() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getUser() {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  async getSession() {
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },
}
