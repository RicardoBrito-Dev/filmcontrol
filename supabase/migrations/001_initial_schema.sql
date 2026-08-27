-- ============================================================
-- FILMCONTROL — Initial Schema (Updated & Hardened)
-- Migration: 001_initial_schema.sql
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- COMPANIES (Multi-tenant root)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  document    TEXT,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN','GERENTE','VENDEDOR','INSTALADOR')),
  avatar_url  TEXT,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id         UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  document           TEXT,
  phone              TEXT,
  whatsapp           TEXT,
  email              TEXT,
  zip_code           TEXT,
  address            TEXT,
  address_number     TEXT,
  address_complement TEXT,
  neighborhood       TEXT,
  city               TEXT,
  state              TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  brand       TEXT NOT NULL,
  model       TEXT NOT NULL,
  year        INTEGER,
  color       TEXT,
  plate       TEXT,
  type        TEXT NOT NULL DEFAULT 'CARRO' CHECK (type IN ('CARRO','SUV','PICKUP','MOTO','CAMINHAO','OUTRO')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVICE CATALOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id                 UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name                       TEXT NOT NULL,
  category                   TEXT NOT NULL CHECK (category IN ('AUTOMOTIVO','RESIDENCIAL','COMERCIAL')),
  description                TEXT,
  unit                       TEXT NOT NULL DEFAULT 'm²',
  default_price              NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_cost             NUMERIC(10,2),
  estimated_duration_minutes INTEGER,
  is_active                  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  number      TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  vehicle_id  UUID REFERENCES public.vehicles(id),
  status      TEXT NOT NULL DEFAULT 'RASCUNHO'
              CHECK (status IN ('RASCUNHO','ENVIADO','AGUARDANDO_APROVACAO','APROVADO','RECUSADO','EXPIRADO')),
  subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  valid_until DATE,
  created_by  UUID NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, number)
);

-- ============================================================
-- QUOTE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id    UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES public.service_catalog(id),
  description TEXT NOT NULL,
  quantity    NUMERIC(10,3) NOT NULL DEFAULT 1,
  width       NUMERIC(10,3),
  height      NUMERIC(10,3),
  area        NUMERIC(10,4),
  unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- WORK ORDERS (Ordens de Serviço)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  number         TEXT NOT NULL,
  quote_id       UUID REFERENCES public.quotes(id),
  customer_id    UUID NOT NULL REFERENCES public.customers(id),
  vehicle_id     UUID REFERENCES public.vehicles(id),
  installer_id   UUID REFERENCES public.users(id),
  status         TEXT NOT NULL DEFAULT 'AGENDADO'
                 CHECK (status IN ('AGENDADO','EM_INSTALACAO','AGUARDANDO_PAGAMENTO','CONCLUIDO','CANCELADO')),
  notes          TEXT,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'PENDENTE'
                 CHECK (payment_status IN ('PAGO','PARCIAL','PENDENTE','ATRASADO')),
  scheduled_at   TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, number)
);

-- ============================================================
-- WORK ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES public.service_catalog(id),
  product_id  UUID,
  description TEXT NOT NULL,
  quantity    NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- APPOINTMENTS (Agenda)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES public.customers(id),
  vehicle_id    UUID REFERENCES public.vehicles(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  title         TEXT NOT NULL,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ,
  address       TEXT,
  installer_id  UUID REFERENCES public.users(id),
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'AGENDADO'
                CHECK (status IN ('AGENDADO','CONFIRMADO','EM_ANDAMENTO','CONCLUIDO','CANCELADO','FALTOU')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS (Estoque)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT,
  brand        TEXT,
  unit         TEXT NOT NULL DEFAULT 'm',
  quantity     NUMERIC(10,3) NOT NULL DEFAULT 0,
  min_quantity NUMERIC(10,3) NOT NULL DEFAULT 0,
  cost         NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier     TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVENTORY MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  type          TEXT NOT NULL CHECK (type IN ('ENTRADA','SAIDA','AJUSTE')),
  quantity      NUMERIC(10,3) NOT NULL,
  notes         TEXT,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id),
  amount        NUMERIC(10,2) NOT NULL,
  method        TEXT NOT NULL CHECK (method IN ('DINHEIRO','PIX','DEBITO','CREDITO','TRANSFERENCIA','BOLETO','OUTRO')),
  status        TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PAGO','PARCIAL','PENDENTE','ATRASADO')),
  paid_at       TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FINANCIAL TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  description    TEXT NOT NULL,
  category       TEXT NOT NULL,
  amount         NUMERIC(10,2) NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('ENTRADA','SAIDA')),
  method         TEXT CHECK (method IN ('DINHEIRO','PIX','DEBITO','CREDITO','TRANSFERENCIA','BOLETO','OUTRO')),
  status         TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PAGO','PENDENTE','VENCIDO')),
  reference_date DATE NOT NULL,
  work_order_id  UUID REFERENCES public.work_orders(id),
  notes          TEXT,
  created_by     UUID NOT NULL REFERENCES public.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FILES (Fotos antes/depois)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.files (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id),
  customer_id   UUID REFERENCES public.customers(id),
  file_type     TEXT NOT NULL DEFAULT 'OUTRO' CHECK (file_type IN ('ANTES','DEPOIS','OUTRO')),
  url           TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  name          TEXT NOT NULL,
  size_bytes    INTEGER,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REVIEWS (Pós-venda)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES public.customers(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  contact_type  TEXT NOT NULL DEFAULT 'WHATSAPP',
  contacted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'INFO',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.users(id),
  action      TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON public.vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON public.vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON public.quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_company_id ON public.work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON public.work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON public.appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_company_id ON public.financial_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference_date ON public.financial_transactions(reference_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies', 'users', 'customers', 'vehicles',
    'service_catalog', 'quotes', 'work_orders',
    'appointments', 'products', 'financial_transactions'
  ] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_update_%I_updated_at ON public.%I;
      CREATE TRIGGER trigger_update_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- ============================================================
-- HANDLE NEW USER FUNCTION (Hardened with search_path)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_company_id UUID;
  company_name TEXT;
BEGIN
  company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Minha Empresa'
  );

  -- Create company in public schema
  INSERT INTO public.companies (name, email)
  VALUES (company_name, NEW.email)
  RETURNING id INTO new_company_id;

  -- Create user profile in public schema
  INSERT INTO public.users (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    new_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'ADMIN'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger: on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Helper function: get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions to public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- COMPANIES: users can only access their own company
DROP POLICY IF EXISTS "company_isolation" ON public.companies;
CREATE POLICY "company_isolation" ON public.companies
  FOR ALL USING (id = public.get_user_company_id());

-- USERS: only see users from same company
DROP POLICY IF EXISTS "users_company_isolation" ON public.users;
CREATE POLICY "users_company_isolation" ON public.users
  FOR ALL USING (company_id = public.get_user_company_id());

-- CUSTOMERS
DROP POLICY IF EXISTS "customers_company_isolation" ON public.customers;
CREATE POLICY "customers_company_isolation" ON public.customers
  FOR ALL USING (company_id = public.get_user_company_id());

-- VEHICLES
DROP POLICY IF EXISTS "vehicles_company_isolation" ON public.vehicles;
CREATE POLICY "vehicles_company_isolation" ON public.vehicles
  FOR ALL USING (company_id = public.get_user_company_id());

-- SERVICE_CATALOG
DROP POLICY IF EXISTS "service_catalog_company_isolation" ON public.service_catalog;
CREATE POLICY "service_catalog_company_isolation" ON public.service_catalog
  FOR ALL USING (company_id = public.get_user_company_id());

-- QUOTES
DROP POLICY IF EXISTS "quotes_company_isolation" ON public.quotes;
CREATE POLICY "quotes_company_isolation" ON public.quotes
  FOR ALL USING (company_id = public.get_user_company_id());

-- QUOTE_ITEMS
DROP POLICY IF EXISTS "quote_items_company_isolation" ON public.quote_items;
CREATE POLICY "quote_items_company_isolation" ON public.quote_items
  FOR ALL USING (
    quote_id IN (SELECT id FROM public.quotes WHERE company_id = public.get_user_company_id())
  );

-- WORK_ORDERS
DROP POLICY IF EXISTS "work_orders_company_isolation" ON public.work_orders;
CREATE POLICY "work_orders_company_isolation" ON public.work_orders
  FOR ALL USING (company_id = public.get_user_company_id());

-- WORK_ORDER_ITEMS
DROP POLICY IF EXISTS "work_order_items_company_isolation" ON public.work_order_items;
CREATE POLICY "work_order_items_company_isolation" ON public.work_order_items
  FOR ALL USING (
    work_order_id IN (SELECT id FROM public.work_orders WHERE company_id = public.get_user_company_id())
  );

-- APPOINTMENTS
DROP POLICY IF EXISTS "appointments_company_isolation" ON public.appointments;
CREATE POLICY "appointments_company_isolation" ON public.appointments
  FOR ALL USING (company_id = public.get_user_company_id());

-- PRODUCTS
DROP POLICY IF EXISTS "products_company_isolation" ON public.products;
CREATE POLICY "products_company_isolation" ON public.products
  FOR ALL USING (company_id = public.get_user_company_id());

-- INVENTORY_MOVEMENTS
DROP POLICY IF EXISTS "inventory_movements_company_isolation" ON public.inventory_movements;
CREATE POLICY "inventory_movements_company_isolation" ON public.inventory_movements
  FOR ALL USING (company_id = public.get_user_company_id());

-- PAYMENTS
DROP POLICY IF EXISTS "payments_company_isolation" ON public.payments;
CREATE POLICY "payments_company_isolation" ON public.payments
  FOR ALL USING (company_id = public.get_user_company_id());

-- FINANCIAL_TRANSACTIONS
DROP POLICY IF EXISTS "financial_transactions_company_isolation" ON public.financial_transactions;
CREATE POLICY "financial_transactions_company_isolation" ON public.financial_transactions
  FOR ALL USING (company_id = public.get_user_company_id());

-- FILES
DROP POLICY IF EXISTS "files_company_isolation" ON public.files;
CREATE POLICY "files_company_isolation" ON public.files
  FOR ALL USING (company_id = public.get_user_company_id());

-- REVIEWS
DROP POLICY IF EXISTS "reviews_company_isolation" ON public.reviews;
CREATE POLICY "reviews_company_isolation" ON public.reviews
  FOR ALL USING (company_id = public.get_user_company_id());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_user_isolation" ON public.notifications;
CREATE POLICY "notifications_user_isolation" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- AUDIT_LOGS
DROP POLICY IF EXISTS "audit_logs_company_isolation" ON public.audit_logs;
CREATE POLICY "audit_logs_company_isolation" ON public.audit_logs
  FOR ALL USING (company_id = public.get_user_company_id());
