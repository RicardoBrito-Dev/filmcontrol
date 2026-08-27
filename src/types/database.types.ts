export type UserRole = 'ADMIN' | 'GERENTE' | 'VENDEDOR' | 'INSTALADOR'

export type QuoteStatus =
  | 'RASCUNHO'
  | 'ENVIADO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADO'
  | 'RECUSADO'
  | 'EXPIRADO'

export type AppointmentStatus =
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'FALTOU'

export type WorkOrderStatus =
  | 'AGENDADO'
  | 'EM_INSTALACAO'
  | 'AGUARDANDO_PAGAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'

export type PaymentStatus = 'PAGO' | 'PARCIAL' | 'PENDENTE' | 'ATRASADO'

export type PaymentMethod =
  | 'DINHEIRO'
  | 'PIX'
  | 'DEBITO'
  | 'CREDITO'
  | 'TRANSFERENCIA'
  | 'BOLETO'
  | 'OUTRO'

export type VehicleType =
  | 'CARRO'
  | 'SUV'
  | 'PICKUP'
  | 'MOTO'
  | 'CAMINHAO'
  | 'OUTRO'

export type ServiceCategory = 'AUTOMOTIVO' | 'RESIDENCIAL' | 'COMERCIAL'

export type TransactionType = 'ENTRADA' | 'SAIDA'

export type FileType = 'ANTES' | 'DEPOIS' | 'OUTRO'

export interface Company {
  id: string
  name: string
  document: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  company_id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  company_id: string
  name: string
  document: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  zip_code: string | null
  address: string | null
  address_number: string | null
  address_complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  company_id: string
  customer_id: string
  brand: string
  model: string
  year: number | null
  color: string | null
  plate: string | null
  type: VehicleType
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ServiceCatalog {
  id: string
  company_id: string
  name: string
  category: ServiceCategory
  description: string | null
  unit: string
  default_price: number
  estimated_cost: number | null
  estimated_duration_minutes: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  company_id: string
  number: string
  customer_id: string
  vehicle_id: string | null
  status: QuoteStatus
  subtotal: number
  discount: number
  total: number
  notes: string | null
  valid_until: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface QuoteItem {
  id: string
  quote_id: string
  service_id: string | null
  description: string
  quantity: number
  width: number | null
  height: number | null
  area: number | null
  unit_price: number
  subtotal: number
}

export interface Appointment {
  id: string
  company_id: string
  customer_id: string
  vehicle_id: string | null
  work_order_id: string | null
  title: string
  start_time: string
  end_time: string | null
  address: string | null
  installer_id: string | null
  notes: string | null
  status: AppointmentStatus
  created_at: string
  updated_at: string
}

export interface WorkOrder {
  id: string
  company_id: string
  number: string
  quote_id: string | null
  customer_id: string
  vehicle_id: string | null
  installer_id: string | null
  status: WorkOrderStatus
  notes: string | null
  total: number
  payment_status: PaymentStatus
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface WorkOrderItem {
  id: string
  work_order_id: string
  service_id: string | null
  product_id: string | null
  description: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Product {
  id: string
  company_id: string
  name: string
  category: string | null
  brand: string | null
  unit: string
  quantity: number
  min_quantity: number
  cost: number
  supplier: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: string
  company_id: string
  product_id: string
  work_order_id: string | null
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE'
  quantity: number
  notes: string | null
  created_by: string
  created_at: string
}

export interface Payment {
  id: string
  company_id: string
  work_order_id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  paid_at: string | null
  notes: string | null
  created_at: string
}

export interface FinancialTransaction {
  id: string
  company_id: string
  description: string
  category: string
  amount: number
  type: TransactionType
  method: PaymentMethod | null
  status: 'PAGO' | 'PENDENTE' | 'VENCIDO'
  reference_date: string
  work_order_id: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface FileRecord {
  id: string
  company_id: string
  work_order_id: string | null
  customer_id: string | null
  file_type: FileType
  url: string
  storage_path: string
  name: string
  size_bytes: number | null
  created_by: string
  created_at: string
}

export interface Review {
  id: string
  company_id: string
  customer_id: string
  work_order_id: string | null
  rating: number | null
  comment: string | null
  contact_type: string
  contacted_at: string
  created_at: string
}

export interface Notification {
  id: string
  company_id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}
