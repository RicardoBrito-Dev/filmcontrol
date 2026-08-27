-- ============================================================
-- FILMCONTROL — Seed Data (Dados de Demonstração)
-- Run AFTER 001_initial_schema.sql
-- NOTE: Replace 'YOUR_USER_ID' with the actual auth.users id
--       after creating an account via the app.
-- ============================================================

-- This seed creates demonstration data for an existing user.
-- Steps:
--   1. Create an account via /register
--   2. Confirm email (or disable email confirmation in Supabase)
--   3. Get your user ID from Supabase Auth dashboard
--   4. Replace YOUR_USER_ID below and run this script

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_customer_1 UUID; v_customer_2 UUID; v_customer_3 UUID;
  v_customer_4 UUID; v_customer_5 UUID;
  v_vehicle_1 UUID; v_vehicle_2 UUID; v_vehicle_3 UUID;
  v_vehicle_4 UUID; v_vehicle_5 UUID;
  v_service_1 UUID; v_service_2 UUID; v_service_3 UUID;
  v_service_4 UUID; v_service_5 UUID;
  v_quote_1 UUID; v_quote_2 UUID;
  v_wo_1 UUID; v_wo_2 UUID; v_wo_3 UUID;
  v_product_1 UUID; v_product_2 UUID; v_product_3 UUID;
BEGIN
  -- Get the first company (created when you registered)
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  SELECT id INTO v_user_id FROM users WHERE company_id = v_company_id LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company found. Please register an account first.';
  END IF;

  -- ==============================
  -- SERVICE CATALOG
  -- ==============================
  INSERT INTO service_catalog (id, company_id, name, category, description, unit, default_price, estimated_cost, estimated_duration_minutes) VALUES
    (uuid_generate_v4(), v_company_id, 'Película G5', 'AUTOMOTIVO', 'Película fumê escuro 5% de luz transmitida', 'm²', 120.00, 40.00, 60),
    (uuid_generate_v4(), v_company_id, 'Película G20', 'AUTOMOTIVO', 'Película fumê médio 20% de luz transmitida', 'm²', 100.00, 35.00, 60),
    (uuid_generate_v4(), v_company_id, 'Película G35', 'AUTOMOTIVO', 'Película fumê claro 35% de luz transmitida', 'm²', 90.00, 30.00, 60),
    (uuid_generate_v4(), v_company_id, 'Nano Cerâmica', 'AUTOMOTIVO', 'Película nano cerâmica alta performance', 'm²', 250.00, 90.00, 90),
    (uuid_generate_v4(), v_company_id, 'Carbon', 'AUTOMOTIVO', 'Película carbon premium', 'm²', 180.00, 65.00, 75),
    (uuid_generate_v4(), v_company_id, 'Para-brisa Solar', 'AUTOMOTIVO', 'Película para-brisa controle solar', 'm²', 200.00, 70.00, 120),
    (uuid_generate_v4(), v_company_id, 'Remoção de Película', 'AUTOMOTIVO', 'Remoção de película antiga', 'un', 80.00, 10.00, 45),
    (uuid_generate_v4(), v_company_id, 'Jateado Residencial', 'RESIDENCIAL', 'Película jateado privacidade', 'm²', 150.00, 50.00, 60),
    (uuid_generate_v4(), v_company_id, 'Controle Solar Residencial', 'RESIDENCIAL', 'Película controle solar residencial', 'm²', 130.00, 45.00, 60),
    (uuid_generate_v4(), v_company_id, 'Vitrine Comercial', 'COMERCIAL', 'Película para vitrine comercial', 'm²', 110.00, 38.00, 60)
  RETURNING id INTO v_service_1;

  SELECT id INTO v_service_1 FROM service_catalog WHERE company_id = v_company_id AND name = 'Película G5';
  SELECT id INTO v_service_2 FROM service_catalog WHERE company_id = v_company_id AND name = 'Nano Cerâmica';
  SELECT id INTO v_service_3 FROM service_catalog WHERE company_id = v_company_id AND name = 'Jateado Residencial';
  SELECT id INTO v_service_4 FROM service_catalog WHERE company_id = v_company_id AND name = 'Carbon';
  SELECT id INTO v_service_5 FROM service_catalog WHERE company_id = v_company_id AND name = 'Para-brisa Solar';

  -- ==============================
  -- CUSTOMERS
  -- ==============================
  INSERT INTO customers (id, company_id, name, document, phone, whatsapp, email, city, state, neighborhood) VALUES
    (uuid_generate_v4(), v_company_id, 'João Silva', '123.456.789-00', '(11) 99999-1111', '(11) 99999-1111', 'joao@email.com', 'São Paulo', 'SP', 'Vila Madalena'),
    (uuid_generate_v4(), v_company_id, 'Pedro Souza', '234.567.890-11', '(11) 98888-2222', '(11) 98888-2222', 'pedro@email.com', 'São Paulo', 'SP', 'Moema'),
    (uuid_generate_v4(), v_company_id, 'Maria Santos', '345.678.901-22', '(11) 97777-3333', '(11) 97777-3333', 'maria@email.com', 'São Paulo', 'SP', 'Pinheiros'),
    (uuid_generate_v4(), v_company_id, 'Carlos Oliveira', '456.789.012-33', '(11) 96666-4444', '(11) 96666-4444', 'carlos@email.com', 'Guarulhos', 'SP', 'Centro'),
    (uuid_generate_v4(), v_company_id, 'Ana Costa', '567.890.123-44', '(11) 95555-5555', '(11) 95555-5555', 'ana@email.com', 'São Paulo', 'SP', 'Lapa'),
    (uuid_generate_v4(), v_company_id, 'Roberto Almeida', '678.901.234-55', '(11) 94444-6666', '(11) 94444-6666', 'roberto@email.com', 'Osasco', 'SP', 'Centro'),
    (uuid_generate_v4(), v_company_id, 'Fernanda Lima', '789.012.345-66', '(11) 93333-7777', '(11) 93333-7777', 'fernanda@email.com', 'São Paulo', 'SP', 'Tatuapé'),
    (uuid_generate_v4(), v_company_id, 'Marcos Ferreira', '890.123.456-77', '(11) 92222-8888', '(11) 92222-8888', 'marcos@email.com', 'São Paulo', 'SP', 'Santana'),
    (uuid_generate_v4(), v_company_id, 'Juliana Pereira', '901.234.567-88', '(11) 91111-9999', '(11) 91111-9999', 'juliana@email.com', 'São Paulo', 'SP', 'Jardins'),
    (uuid_generate_v4(), v_company_id, 'Lucas Rodrigues', '012.345.678-99', '(11) 90000-0000', '(11) 90000-0000', 'lucas@email.com', 'São Paulo', 'SP', 'Campo Belo');

  SELECT id INTO v_customer_1 FROM customers WHERE company_id = v_company_id AND name = 'João Silva';
  SELECT id INTO v_customer_2 FROM customers WHERE company_id = v_company_id AND name = 'Pedro Souza';
  SELECT id INTO v_customer_3 FROM customers WHERE company_id = v_company_id AND name = 'Maria Santos';
  SELECT id INTO v_customer_4 FROM customers WHERE company_id = v_company_id AND name = 'Carlos Oliveira';
  SELECT id INTO v_customer_5 FROM customers WHERE company_id = v_company_id AND name = 'Ana Costa';

  -- ==============================
  -- VEHICLES
  -- ==============================
  INSERT INTO vehicles (id, company_id, customer_id, brand, model, year, color, plate, type) VALUES
    (uuid_generate_v4(), v_company_id, v_customer_1, 'Chevrolet', 'Onix', 2023, 'Prata', 'ABC-1234', 'CARRO'),
    (uuid_generate_v4(), v_company_id, v_customer_2, 'Honda', 'Civic', 2022, 'Preto', 'DEF-5678', 'CARRO'),
    (uuid_generate_v4(), v_company_id, v_customer_3, 'Toyota', 'Corolla Cross', 2024, 'Branco', 'GHI-9012', 'SUV'),
    (uuid_generate_v4(), v_company_id, v_customer_4, 'Ford', 'Ranger', 2023, 'Cinza', 'JKL-3456', 'PICKUP'),
    (uuid_generate_v4(), v_company_id, v_customer_5, 'Volkswagen', 'T-Cross', 2022, 'Vermelho', 'MNO-7890', 'SUV'),
    (uuid_generate_v4(), v_company_id, v_customer_1, 'BMW', '320i', 2021, 'Azul', 'PQR-1234', 'CARRO'),
    (uuid_generate_v4(), v_company_id, v_customer_2, 'Jeep', 'Compass', 2023, 'Prata', 'STU-5678', 'SUV'),
    (uuid_generate_v4(), v_company_id, v_customer_3, 'Hyundai', 'HB20', 2022, 'Branco', 'VWX-9012', 'CARRO');

  SELECT id INTO v_vehicle_1 FROM vehicles WHERE company_id = v_company_id AND customer_id = v_customer_1 AND model = 'Onix';
  SELECT id INTO v_vehicle_2 FROM vehicles WHERE company_id = v_company_id AND customer_id = v_customer_2 AND model = 'Civic';
  SELECT id INTO v_vehicle_3 FROM vehicles WHERE company_id = v_company_id AND customer_id = v_customer_3 AND model = 'Corolla Cross';
  SELECT id INTO v_vehicle_4 FROM vehicles WHERE company_id = v_company_id AND customer_id = v_customer_4 AND model = 'Ranger';
  SELECT id INTO v_vehicle_5 FROM vehicles WHERE company_id = v_company_id AND customer_id = v_customer_5 AND model = 'T-Cross';

  -- ==============================
  -- PRODUCTS (Estoque)
  -- ==============================
  INSERT INTO products (id, company_id, name, category, brand, unit, quantity, min_quantity, cost, supplier) VALUES
    (uuid_generate_v4(), v_company_id, 'Película G5 Rolo', 'Película Automotiva', 'Insulfilm', 'm', 45.50, 10.00, 12.00, 'Distribuidora ABC'),
    (uuid_generate_v4(), v_company_id, 'Película G20 Rolo', 'Película Automotiva', 'Insulfilm', 'm', 38.00, 10.00, 10.00, 'Distribuidora ABC'),
    (uuid_generate_v4(), v_company_id, 'Película Nano Cerâmica', 'Película Premium', '3M', 'm', 22.00, 5.00, 45.00, 'Distribuidora 3M'),
    (uuid_generate_v4(), v_company_id, 'Película Carbon', 'Película Premium', 'Llumar', 'm', 18.50, 5.00, 32.00, 'Distribuidora Llumar'),
    (uuid_generate_v4(), v_company_id, 'Película Jateado', 'Película Residencial', 'Generica', 'm', 30.00, 8.00, 15.00, 'Distribuidora XYZ'),
    (uuid_generate_v4(), v_company_id, 'Squeegee Profissional', 'Ferramenta', 'Pro Tools', 'un', 8.00, 2.00, 25.00, 'Ferramentas Brasil'),
    (uuid_generate_v4(), v_company_id, 'Solução Instalação 1L', 'Insumo', 'Generica', 'un', 12.00, 3.00, 8.00, 'Distribuidora ABC'),
    (uuid_generate_v4(), v_company_id, 'Faca de Corte X-Acto', 'Ferramenta', 'X-Acto', 'un', 15.00, 5.00, 12.00, 'Ferramentas Brasil'),
    (uuid_generate_v4(), v_company_id, 'Película G35 Rolo', 'Película Automotiva', 'Insulfilm', 'm', 6.00, 10.00, 9.00, 'Distribuidora ABC'),
    (uuid_generate_v4(), v_company_id, 'Papel Toalha Industrial', 'Insumo', 'Generica', 'un', 4.00, 5.00, 15.00, 'Distribuidora ABC')
  RETURNING id INTO v_product_1;

  SELECT id INTO v_product_1 FROM products WHERE company_id = v_company_id AND name = 'Película G5 Rolo';
  SELECT id INTO v_product_2 FROM products WHERE company_id = v_company_id AND name = 'Película Nano Cerâmica';
  SELECT id INTO v_product_3 FROM products WHERE company_id = v_company_id AND name = 'Película Carbon';

  -- ==============================
  -- QUOTES
  -- ==============================
  INSERT INTO quotes (id, company_id, number, customer_id, vehicle_id, status, subtotal, discount, total, notes, valid_until, created_by)
  VALUES
    (uuid_generate_v4(), v_company_id, 'ORC-2024-0001', v_customer_1, v_vehicle_1, 'APROVADO', 600.00, 0, 600.00, 'Cliente optou pelo G5 em todos os vidros', NOW() + INTERVAL '30 days', v_user_id),
    (uuid_generate_v4(), v_company_id, 'ORC-2024-0002', v_customer_2, v_vehicle_2, 'AGUARDANDO_APROVACAO', 1200.00, 100, 1100.00, 'Nano cerâmica + para-brisa', NOW() + INTERVAL '15 days', v_user_id),
    (uuid_generate_v4(), v_company_id, 'ORC-2024-0003', v_customer_3, v_vehicle_3, 'ENVIADO', 840.00, 0, 840.00, 'SUV 4 vidros', NOW() + INTERVAL '7 days', v_user_id),
    (uuid_generate_v4(), v_company_id, 'ORC-2024-0004', v_customer_4, v_vehicle_4, 'RASCUNHO', 720.00, 50, 670.00, NULL, NOW() + INTERVAL '30 days', v_user_id),
    (uuid_generate_v4(), v_company_id, 'ORC-2024-0005', v_customer_5, v_vehicle_5, 'RECUSADO', 500.00, 0, 500.00, 'Cliente achou caro', NOW() - INTERVAL '5 days', v_user_id);

  SELECT id INTO v_quote_1 FROM quotes WHERE company_id = v_company_id AND number = 'ORC-2024-0001';
  SELECT id INTO v_quote_2 FROM quotes WHERE company_id = v_company_id AND number = 'ORC-2024-0002';

  -- ==============================
  -- WORK ORDERS
  -- ==============================
  INSERT INTO work_orders (id, company_id, number, quote_id, customer_id, vehicle_id, installer_id, status, total, payment_status, scheduled_at, completed_at)
  VALUES
    (uuid_generate_v4(), v_company_id, 'OS-2024-0001', v_quote_1, v_customer_1, v_vehicle_1, v_user_id, 'CONCLUIDO', 600.00, 'PAGO', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    (uuid_generate_v4(), v_company_id, 'OS-2024-0002', NULL, v_customer_2, v_vehicle_2, v_user_id, 'EM_INSTALACAO', 800.00, 'PARCIAL', NOW(), NULL),
    (uuid_generate_v4(), v_company_id, 'OS-2024-0003', NULL, v_customer_3, v_vehicle_3, v_user_id, 'AGENDADO', 840.00, 'PENDENTE', NOW() + INTERVAL '2 days', NULL),
    (uuid_generate_v4(), v_company_id, 'OS-2024-0004', NULL, v_customer_4, v_vehicle_4, v_user_id, 'CONCLUIDO', 1200.00, 'PAGO', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    (uuid_generate_v4(), v_company_id, 'OS-2024-0005', NULL, v_customer_5, v_vehicle_5, v_user_id, 'AGUARDANDO_PAGAMENTO', 500.00, 'PENDENTE', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

  SELECT id INTO v_wo_1 FROM work_orders WHERE company_id = v_company_id AND number = 'OS-2024-0001';
  SELECT id INTO v_wo_2 FROM work_orders WHERE company_id = v_company_id AND number = 'OS-2024-0002';
  SELECT id INTO v_wo_3 FROM work_orders WHERE company_id = v_company_id AND number = 'OS-2024-0003';

  -- ==============================
  -- APPOINTMENTS
  -- ==============================
  INSERT INTO appointments (company_id, customer_id, vehicle_id, work_order_id, title, start_time, end_time, installer_id, status)
  VALUES
    (v_company_id, v_customer_2, v_vehicle_2, v_wo_2, 'Honda Civic — G5 + Para-brisa', NOW() + INTERVAL '0 hours', NOW() + INTERVAL '2 hours', v_user_id, 'EM_ANDAMENTO'),
    (v_company_id, v_customer_3, v_vehicle_3, v_wo_3, 'Toyota Corolla Cross — Nano Cerâmica', NOW() + INTERVAL '2 days 9 hours', NOW() + INTERVAL '2 days 11 hours', v_user_id, 'AGENDADO'),
    (v_company_id, v_customer_4, v_vehicle_4, NULL, 'Ford Ranger — Carbon', NOW() + INTERVAL '3 days 14 hours', NOW() + INTERVAL '3 days 16 hours', v_user_id, 'AGENDADO'),
    (v_company_id, v_customer_5, v_vehicle_5, NULL, 'VW T-Cross — G20', NOW() + INTERVAL '4 days 10 hours', NOW() + INTERVAL '4 days 12 hours', v_user_id, 'AGENDADO');

  -- ==============================
  -- PAYMENTS
  -- ==============================
  INSERT INTO payments (company_id, work_order_id, amount, method, status, paid_at)
  VALUES
    (v_company_id, v_wo_1, 600.00, 'PIX', 'PAGO', NOW() - INTERVAL '10 days'),
    (v_company_id, v_wo_2, 400.00, 'DINHEIRO', 'PAGO', NOW()),
    (v_company_id, v_wo_3, 0, 'PIX', 'PENDENTE', NULL);

  -- ==============================
  -- FINANCIAL TRANSACTIONS
  -- ==============================
  INSERT INTO financial_transactions (company_id, description, category, amount, type, method, status, reference_date, work_order_id, created_by)
  VALUES
    (v_company_id, 'OS-2024-0001 — João Silva', 'Serviço', 600.00, 'ENTRADA', 'PIX', 'PAGO', (NOW() - INTERVAL '10 days')::DATE, v_wo_1, v_user_id),
    (v_company_id, 'OS-2024-0004 — Carlos Oliveira', 'Serviço', 1200.00, 'ENTRADA', 'CREDITO', 'PAGO', (NOW() - INTERVAL '5 days')::DATE, NULL, v_user_id),
    (v_company_id, 'Compra de películas — Distribuidora ABC', 'Material', 480.00, 'SAIDA', 'TRANSFERENCIA', 'PAGO', (NOW() - INTERVAL '15 days')::DATE, NULL, v_user_id),
    (v_company_id, 'Aluguel do espaço', 'Aluguel', 1500.00, 'SAIDA', 'TRANSFERENCIA', 'PAGO', (NOW() - INTERVAL '20 days')::DATE, NULL, v_user_id),
    (v_company_id, 'Compra de ferramentas', 'Ferramentas', 250.00, 'SAIDA', 'DINHEIRO', 'PAGO', (NOW() - INTERVAL '8 days')::DATE, NULL, v_user_id),
    (v_company_id, 'OS-2024-0002 — Pedro Souza (parcial)', 'Serviço', 400.00, 'ENTRADA', 'DINHEIRO', 'PAGO', NOW()::DATE, v_wo_2, v_user_id),
    (v_company_id, 'Conta de energia', 'Energia', 380.00, 'SAIDA', 'DEBITO', 'PAGO', (NOW() - INTERVAL '12 days')::DATE, NULL, v_user_id),
    (v_company_id, 'OS-2024-0003 — Maria Santos', 'Serviço', 840.00, 'ENTRADA', 'PIX', 'PENDENTE', (NOW() + INTERVAL '2 days')::DATE, v_wo_3, v_user_id),
    (v_company_id, 'Combustível', 'Combustível', 150.00, 'SAIDA', 'DINHEIRO', 'PAGO', NOW()::DATE, NULL, v_user_id),
    (v_company_id, 'Internet e telefone', 'Outros', 200.00, 'SAIDA', 'DEBITO', 'PENDENTE', (NOW() + INTERVAL '5 days')::DATE, NULL, v_user_id);

  RAISE NOTICE 'Seed data created successfully for company: %', v_company_id;
END;
$$;
