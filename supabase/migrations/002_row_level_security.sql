-- =====================================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- =====================================================

-- =====================================================
-- 1. PROFILES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les utilisateurs peuvent modifier leur propre profil (sauf le rôle)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Seuls les superadmins peuvent modifier les rôles
CREATE POLICY "Superadmins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- =====================================================
-- 2. TENANTS
-- =====================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all tenants"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les locataires peuvent voir uniquement leurs propres données
CREATE POLICY "Tenants can view own data"
  ON tenants FOR SELECT
  USING (user_id = auth.uid());

-- Seuls les admins peuvent créer des locataires
CREATE POLICY "Admins can insert tenants"
  ON tenants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les admins peuvent modifier les locataires
CREATE POLICY "Admins can update tenants"
  ON tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les locataires peuvent mettre à jour certains de leurs champs
CREATE POLICY "Tenants can update own contact info"
  ON tenants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    user_id = (SELECT user_id FROM tenants WHERE id = tenants.id)
  );

-- Seuls les admins peuvent supprimer
CREATE POLICY "Admins can delete tenants"
  ON tenants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 3. SHOPS
-- =====================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les locaux (pour recherche)
CREATE POLICY "Everyone can view shops"
  ON shops FOR SELECT
  USING (true);

-- Seuls les admins peuvent créer/modifier/supprimer
CREATE POLICY "Admins can insert shops"
  ON shops FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can update shops"
  ON shops FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete shops"
  ON shops FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 4. CONTRACTS
-- =====================================================
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all contracts"
  ON contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les locataires peuvent voir leurs propres contrats
CREATE POLICY "Tenants can view own contracts"
  ON contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE id = contracts.tenant_id AND user_id = auth.uid()
    )
  );

-- Seuls les admins peuvent créer/modifier/supprimer
CREATE POLICY "Admins can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can update contracts"
  ON contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete contracts"
  ON contracts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 5. INVOICES
-- =====================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les locataires peuvent voir leurs propres factures
CREATE POLICY "Tenants can view own invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE id = invoices.tenant_id AND user_id = auth.uid()
    )
  );

-- Seuls les admins peuvent créer/modifier/supprimer
CREATE POLICY "Admins can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can update invoices"
  ON invoices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 6. INVOICE_ITEMS
-- =====================================================
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all invoice items"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les locataires peuvent voir les items de leurs factures
CREATE POLICY "Tenants can view own invoice items"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN tenants t ON t.id = i.tenant_id
      WHERE i.id = invoice_items.invoice_id AND t.user_id = auth.uid()
    )
  );

-- Seuls les admins peuvent créer/modifier/supprimer
CREATE POLICY "Admins can insert invoice items"
  ON invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can update invoice items"
  ON invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete invoice items"
  ON invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 7. PAYMENTS
-- =====================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les locataires peuvent voir leurs propres paiements
CREATE POLICY "Tenants can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE id = payments.tenant_id AND user_id = auth.uid()
    )
  );

-- Seuls les admins peuvent créer/modifier/supprimer
CREATE POLICY "Admins can insert payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 8. NOTIFICATIONS
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Les admins peuvent voir toutes les notifications
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Seuls les admins peuvent créer des notifications
CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 9. AUDIT_LOGS
-- =====================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- Seul le système peut créer des logs (via fonction)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Personne ne peut modifier ou supprimer les logs (immutables)
-- Aucune politique de UPDATE ou DELETE

-- =====================================================
-- 10. SETTINGS
-- =====================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les paramètres
CREATE POLICY "Everyone can view settings"
  ON settings FOR SELECT
  USING (true);

-- Seuls les admins peuvent modifier les paramètres
CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- Seuls les superadmins peuvent créer/supprimer des paramètres
CREATE POLICY "Superadmins can insert settings"
  ON settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can delete settings"
  ON settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- =====================================================
-- FONCTIONS UTILITAIRES POUR RLS
-- =====================================================

-- Fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur possède un locataire
CREATE OR REPLACE FUNCTION user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM tenants
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le rôle de l'utilisateur
CREATE OR REPLACE FUNCTION user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
