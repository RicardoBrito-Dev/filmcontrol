export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
  company_id: string
  avatar_url: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  full_name: string
  email: string
  password: string
  company_name: string
}

export interface ResetPasswordData {
  email: string
}
