-- ========================================
-- SCRIPT POUR AJOUTER LES FOREIGN KEYS
-- À exécuter dans Supabase SQL Editor
-- ========================================

-- 1. Ajouter la foreign key pour tenant_id
ALTER TABLE contracts
DROP CONSTRAINT IF EXISTS contracts_tenant_id_fkey;

ALTER TABLE contracts
ADD CONSTRAINT contracts_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 2. Ajouter la foreign key pour shop_id
ALTER TABLE contracts
DROP CONSTRAINT IF EXISTS contracts_shop_id_fkey;

ALTER TABLE contracts
ADD CONSTRAINT contracts_shop_id_fkey
FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE;

-- 3. Vérifier que les foreign keys sont bien créées
SELECT
    tc.constraint_name,
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

-- ✅ Vous devriez voir :
-- contracts_tenant_id_fkey | contracts | tenant_id | tenants | id
-- contracts_shop_id_fkey   | contracts | shop_id   | shops   | id
