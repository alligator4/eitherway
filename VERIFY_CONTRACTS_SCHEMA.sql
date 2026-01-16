-- Script de vérification structure tables Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier colonnes table invoices
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoices'
ORDER BY ordinal_position;

-- 2. Vérifier colonnes table contracts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'contracts'
ORDER BY ordinal_position;

-- 3. Compter les données
SELECT 
  'shops' as table_name,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
  COUNT(CASE WHEN status = 'vacant' THEN 1 END) as vacant
FROM shops
UNION ALL
SELECT 
  'tenants',
  COUNT(*),
  COUNT(CASE WHEN active = true THEN 1 END),
  NULL
FROM tenants
UNION ALL
SELECT 
  'contracts',
  COUNT(*),
  COUNT(CASE WHEN status = 'active' THEN 1 END),
  NULL
FROM contracts
UNION ALL
SELECT 
  'invoices',
  COUNT(*),
  NULL,
  NULL
FROM invoices;

-- 4. Vérifier statuts invoices
SELECT status, COUNT(*) as count
FROM invoices
GROUP BY status;

-- 5. Exemple facture complète
SELECT *
FROM invoices
LIMIT 1;
