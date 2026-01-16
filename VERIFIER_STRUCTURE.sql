-- ============================================
-- DIAGNOSTIC DE LA TABLE TENANTS
-- ============================================

-- 1️⃣ Vérifier quelles colonnes existent actuellement
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- Cette commande vous montrera la structure actuelle de votre table
