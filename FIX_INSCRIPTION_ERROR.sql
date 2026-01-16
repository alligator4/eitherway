-- ============================================
-- DIAGNOSTIC ERREUR INSCRIPTION
-- ============================================

-- 1️⃣ VÉRIFIER LA STRUCTURE DE LA TABLE TENANTS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- 2️⃣ VÉRIFIER SI LE TRIGGER EXISTE
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%tenant%'
ORDER BY trigger_name;

-- 3️⃣ VÉRIFIER LA FONCTION DU TRIGGER
SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname LIKE '%tenant%';

-- 4️⃣ TESTER LA CRÉATION MANUELLE D'UN LOCATAIRE
-- (Pour voir quelle colonne pose problème)
/*
INSERT INTO tenants (
  company_name,
  contact_name,
  email,
  active
) VALUES (
  'Test - Entreprise',
  'Test User',
  'test@example.com',
  true
);
*/

-- 5️⃣ SOLUTION RAPIDE : RECRÉER LA TABLE TENANTS AVEC STRUCTURE CORRECTE
-- ⚠️ DÉCOMMENTEZ SEULEMENT SI VOUS VOULEZ TOUT RECRÉER

/*
-- Sauvegarder les données existantes
CREATE TEMP TABLE tenants_backup AS SELECT * FROM tenants;

-- Supprimer l'ancienne table
DROP TABLE IF EXISTS tenants CASCADE;

-- Recréer avec la bonne structure
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  business_type TEXT,
  tax_id TEXT,
  registration_number TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Restaurer les données
INSERT INTO tenants SELECT * FROM tenants_backup;

-- Activer RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Créer les index
CREATE INDEX idx_tenants_user_id ON tenants(user_id);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_active ON tenants(active);
*/

-- 6️⃣ SOLUTION ALTERNATIVE : RENDRE company_name NULLABLE
ALTER TABLE tenants ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN contact_name DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN email DROP NOT NULL;

-- 7️⃣ VÉRIFIER LES CONTRAINTES NOT NULL
SELECT 
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
AND is_nullable = 'NO';

-- ✅ APRÈS CETTE EXÉCUTION, TESTEZ À NOUVEAU L'INSCRIPTION
