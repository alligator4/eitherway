-- Script de diagnostic pour les contrats

-- 1. Vérifier les contrats existants
SELECT 
  c.id,
  c.shop_id,
  c.tenant_id,
  c.title,
  c.start_date,
  c.end_date,
  c.status,
  c.created_at
FROM contracts c
ORDER BY c.created_at DESC;

-- 2. Vérifier les contrats avec leurs relations
SELECT 
  c.id,
  c.title,
  c.status,
  t.id as tenant_id,
  t.company_name,
  t.contact_name,
  s.id as shop_id,
  s.shop_number,
  s.name as shop_name
FROM contracts c
LEFT JOIN tenants t ON c.tenant_id = t.id
LEFT JOIN shops s ON c.shop_id = s.id
ORDER BY c.created_at DESC;

-- 3. Vérifier les foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'contracts';

-- 4. Tester la requête exacte utilisée dans l'app
SELECT 
  c.*,
  json_build_object(
    'id', t.id,
    'company_name', t.company_name,
    'contact_name', t.contact_name,
    'email', t.email,
    'active', t.active
  ) as tenant,
  json_build_object(
    'id', s.id,
    'name', s.name,
    'shop_number', s.shop_number,
    'floor', s.floor,
    'location', s.location
  ) as shop
FROM contracts c
LEFT JOIN tenants t ON c.tenant_id = t.id
LEFT JOIN shops s ON c.shop_id = s.id
ORDER BY c.created_at DESC;
