-- ============================================
-- CORRECTION COMPLÈTE DE LA TABLE TENANTS
-- ============================================

-- ⚠️ ATTENTION : Ce script va supprimer et recréer la table tenants
-- Si vous avez des données importantes, sauvegardez-les d'abord !

-- 1️⃣ SUPPRIMER L'ANCIENNE TABLE
DROP TABLE IF EXISTS tenants CASCADE;

-- 2️⃣ RECRÉER LA TABLE AVEC LA BONNE STRUCTURE
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
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

-- 3️⃣ CRÉER LES INDEX
CREATE INDEX idx_tenants_user_id ON tenants(user_id);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_active ON tenants(active);

-- 4️⃣ ACTIVER ROW LEVEL SECURITY
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 5️⃣ CRÉER LES POLITIQUES RLS
CREATE POLICY "Admins can view all tenants"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Tenants can view own data"
  ON tenants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert tenants"
  ON tenants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can update tenants"
  ON tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Tenants can update own contact info"
  ON tenants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    user_id = (SELECT user_id FROM tenants WHERE id = tenants.id)
  );

CREATE POLICY "Admins can delete tenants"
  ON tenants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- 6️⃣ CRÉER LE TRIGGER UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7️⃣ INSÉRER DES DONNÉES DE TEST
INSERT INTO tenants (company_name, contact_name, email, phone, business_type, active)
VALUES 
  ('Boutique Mode Paris', 'Sophie Dubois', 'sophie@mode-paris.fr', '0612345678', 'Prêt-à-porter', true),
  ('Restaurant Le Gourmet', 'Jean Martin', 'jean@legourmet.fr', '0623456789', 'Restauration', true),
  ('Librairie du Centre', 'Marie Lefebvre', 'marie@librairie-centre.fr', '0634567890', 'Commerce de détail', true),
  ('Pharmacie Santé Plus', 'Pierre Durand', 'pierre@sante-plus.fr', '0645678901', 'Santé', true),
  ('Coiffeur Style & Co', 'Isabelle Moreau', 'isabelle@style-co.fr', '0656789012', 'Services', true);

-- 8️⃣ VÉRIFIER QUE TOUT FONCTIONNE
SELECT 
  id, 
  company_name, 
  contact_name, 
  email, 
  business_type,
  active
FROM tenants
ORDER BY company_name;

-- ✅ Si vous voyez 5 lignes, tout est bon !
