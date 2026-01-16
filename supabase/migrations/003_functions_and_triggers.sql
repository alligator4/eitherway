-- =====================================================
-- FONCTIONS ET TRIGGERS AVANCÉS
-- =====================================================

-- =====================================================
-- 1. FONCTION : Logging d'audit automatique
-- =====================================================
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_data = to_jsonb(OLD);
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, old_data);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data = to_jsonb(OLD);
    new_data = to_jsonb(NEW);
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, old_data, new_data);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    new_data = to_jsonb(NEW);
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, new_data);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Application des triggers d'audit sur les tables importantes
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- =====================================================
-- 2. FONCTION : Mise à jour automatique du statut des contrats
-- =====================================================
CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    IF CURRENT_DATE < NEW.start_date THEN
      NEW.status = 'draft';
    ELSIF CURRENT_DATE > NEW.end_date THEN
      NEW.status = 'expired';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_contract_status BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_contract_status();

-- =====================================================
-- 3. FONCTION : Mise à jour du statut du local lors de contrat
-- =====================================================
CREATE OR REPLACE FUNCTION update_shop_status_on_contract()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status = 'active' THEN
      UPDATE shops SET status = 'occupied' WHERE id = NEW.shop_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status IN ('terminated', 'expired')) THEN
    IF NOT EXISTS (
      SELECT 1 FROM contracts 
      WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id) 
      AND status = 'active'
      AND id != COALESCE(NEW.id, OLD.id)
    ) THEN
      UPDATE shops SET status = 'vacant' WHERE id = COALESCE(NEW.shop_id, OLD.shop_id);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shop_on_contract_change 
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_shop_status_on_contract();

-- =====================================================
-- 4. FONCTION : Calcul automatique du total de facture
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  items_total DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO items_total
  FROM invoice_items
  WHERE invoice_id = NEW.id;
  
  NEW.subtotal = items_total;
  NEW.tax_amount = ROUND((items_total * NEW.tax_rate / 100), 2);
  NEW.total_amount = NEW.subtotal + NEW.tax_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_invoice_totals_trigger 
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();

-- =====================================================
-- 5. FONCTION : Mise à jour du statut de facture selon paiements
-- =====================================================
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total DECIMAL(10, 2);
  paid_amount DECIMAL(10, 2);
BEGIN
  SELECT total_amount INTO invoice_total
  FROM invoices
  WHERE id = NEW.invoice_id;
  
  SELECT COALESCE(SUM(amount), 0) INTO paid_amount
  FROM payments
  WHERE invoice_id = NEW.invoice_id AND status = 'completed';
  
  UPDATE invoices
  SET 
    amount_paid = paid_amount,
    status = CASE
      WHEN paid_amount >= invoice_total THEN 'paid'
      WHEN paid_amount > 0 THEN 'pending'
      ELSE status
    END,
    paid_at = CASE
      WHEN paid_amount >= invoice_total AND paid_at IS NULL THEN now()
      ELSE paid_at
    END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_on_payment 
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

-- =====================================================
-- 6. FONCTION : Mise à jour du statut de facture en retard
-- =====================================================
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status IN ('pending', 'sent')
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FONCTION : Génération automatique de numéro de facture
-- =====================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  next_num INTEGER;
  year_part TEXT;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    RETURN NEW;
  END IF;
  
  SELECT value::TEXT INTO prefix FROM settings WHERE key = 'invoice_prefix';
  IF prefix IS NULL THEN
    prefix = 'INV';
  ELSE
    prefix = REPLACE(prefix, '"', '');
  END IF;
  
  year_part = TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER
    )
  ), 0) + 1 INTO next_num
  FROM invoices
  WHERE invoice_number LIKE prefix || '-' || year_part || '%';
  
  NEW.invoice_number = prefix || '-' || year_part || '-' || LPAD(next_num::TEXT, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_trigger 
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- 8. FONCTION : Génération automatique de numéro de contrat
-- =====================================================
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  next_num INTEGER;
  year_part TEXT;
BEGIN
  IF NEW.contract_number IS NOT NULL AND NEW.contract_number != '' THEN
    RETURN NEW;
  END IF;
  
  SELECT value::TEXT INTO prefix FROM settings WHERE key = 'contract_prefix';
  IF prefix IS NULL THEN
    prefix = 'CT';
  ELSE
    prefix = REPLACE(prefix, '"', '');
  END IF;
  
  year_part = TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(contract_number FROM '[0-9]+$') AS INTEGER
    )
  ), 0) + 1 INTO next_num
  FROM contracts
  WHERE contract_number LIKE prefix || '-' || year_part || '%';
  
  NEW.contract_number = prefix || '-' || year_part || '-' || LPAD(next_num::TEXT, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_contract_number_trigger 
  BEFORE INSERT ON contracts
  FOR EACH ROW EXECUTE FUNCTION generate_contract_number();

-- =====================================================
-- 9. FONCTION : Créer notification
-- =====================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_category TEXT DEFAULT 'system',
  p_action_url TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, title, message, type, category, 
    action_url, related_entity_type, related_entity_id
  )
  VALUES (
    p_user_id, p_title, p_message, p_type, p_category,
    p_action_url, p_entity_type, p_entity_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. FONCTION : Renouvellement automatique de contrat
-- =====================================================
CREATE OR REPLACE FUNCTION auto_renew_contracts()
RETURNS void AS $$
DECLARE
  contract_rec RECORD;
  new_start_date DATE;
  new_end_date DATE;
  duration_days INTEGER;
  tenant_user_id UUID;
BEGIN
  FOR contract_rec IN
    SELECT * FROM contracts
    WHERE status = 'active'
      AND auto_renewal = true
      AND end_date - renewal_notice_days <= CURRENT_DATE
      AND end_date >= CURRENT_DATE
  LOOP
    duration_days = contract_rec.end_date - contract_rec.start_date;
    new_start_date = contract_rec.end_date + 1;
    new_end_date = new_start_date + duration_days;
    
    UPDATE contracts
    SET 
      status = 'renewed',
      updated_at = now()
    WHERE id = contract_rec.id;
    
    INSERT INTO contracts (
      tenant_id, shop_id, start_date, end_date,
      monthly_rent, deposit, charges, payment_day,
      status, auto_renewal, renewal_notice_days,
      contract_type, terms, created_by
    )
    VALUES (
      contract_rec.tenant_id, contract_rec.shop_id,
      new_start_date, new_end_date,
      contract_rec.monthly_rent, contract_rec.deposit,
      contract_rec.charges, contract_rec.payment_day,
      'active', contract_rec.auto_renewal, contract_rec.renewal_notice_days,
      contract_rec.contract_type, contract_rec.terms, contract_rec.created_by
    );
    
    SELECT user_id INTO tenant_user_id
    FROM tenants
    WHERE id = contract_rec.tenant_id;
    
    IF tenant_user_id IS NOT NULL THEN
      PERFORM create_notification(
        tenant_user_id,
        'Contrat renouvelé',
        'Votre contrat pour le local ' || (SELECT shop_number FROM shops WHERE id = contract_rec.shop_id) || ' a été renouvelé automatiquement.',
        'success',
        'contract',
        '/contracts',
        'contract',
        contract_rec.id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. FONCTION : Génération automatique des factures mensuelles
-- =====================================================
CREATE OR REPLACE FUNCTION generate_monthly_invoices()
RETURNS void AS $$
DECLARE
  contract_rec RECORD;
  invoice_id UUID;
  due_date DATE;
  tenant_user_id UUID;
  period_start DATE;
  period_end DATE;
BEGIN
  period_start = DATE_TRUNC('month', CURRENT_DATE)::DATE;
  period_end = (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  
  FOR contract_rec IN
    SELECT c.*, t.user_id as tenant_user_id
    FROM contracts c
    LEFT JOIN tenants t ON t.id = c.tenant_id
    WHERE c.status = 'active'
      AND c.start_date <= period_end
      AND c.end_date >= period_start
      AND NOT EXISTS (
        SELECT 1 FROM invoices
        WHERE contract_id = c.id
          AND period_start = period_start
          AND period_end = period_end
      )
  LOOP
    due_date = DATE_TRUNC('month', CURRENT_DATE)::DATE + 
               (contract_rec.payment_day - 1 || ' days')::INTERVAL;
    
    INSERT INTO invoices (
      contract_id, tenant_id, issue_date, due_date,
      period_start, period_end, tax_rate, status
    )
    VALUES (
      contract_rec.id, contract_rec.tenant_id, CURRENT_DATE, due_date,
      period_start, period_end, 
      (SELECT COALESCE((value)::NUMERIC, 20.00) FROM settings WHERE key = 'default_tax_rate'),
      'pending'
    )
    RETURNING id INTO invoice_id;
    
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total, item_type)
    VALUES 
      (invoice_id, 'Loyer mensuel', 1, contract_rec.monthly_rent, contract_rec.monthly_rent, 'rent'),
      (invoice_id, 'Charges', 1, contract_rec.charges, contract_rec.charges, 'charges');
    
    IF contract_rec.tenant_user_id IS NOT NULL THEN
      PERFORM create_notification(
        contract_rec.tenant_user_id,
        'Nouvelle facture',
        'Une nouvelle facture a été générée pour la période du ' || TO_CHAR(period_start, 'DD/MM/YYYY') || ' au ' || TO_CHAR(period_end, 'DD/MM/YYYY'),
        'info',
        'invoice',
        '/invoices',
        'invoice',
        invoice_id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. FONCTION : Envoi de rappels de paiement
-- =====================================================
CREATE OR REPLACE FUNCTION send_payment_reminders()
RETURNS void AS $$
DECLARE
  invoice_rec RECORD;
  days_until_due INTEGER;
  reminder_days INTEGER[];
  tenant_user_id UUID;
BEGIN
  SELECT (value)::TEXT INTO reminder_days
  FROM settings
  WHERE key = 'payment_reminder_days';
  
  IF reminder_days IS NULL THEN
    reminder_days = ARRAY[7, 3, 1];
  END IF;
  
  FOR invoice_rec IN
    SELECT i.*, t.user_id as tenant_user_id
    FROM invoices i
    LEFT JOIN tenants t ON t.id = i.tenant_id
    WHERE i.status IN ('pending', 'sent')
      AND i.due_date >= CURRENT_DATE
  LOOP
    days_until_due = invoice_rec.due_date - CURRENT_DATE;
    
    IF days_until_due = ANY(reminder_days) THEN
      IF invoice_rec.tenant_user_id IS NOT NULL THEN
        PERFORM create_notification(
          invoice_rec.tenant_user_id,
          'Rappel de paiement',
          'Votre facture ' || invoice_rec.invoice_number || ' arrive à échéance dans ' || days_until_due || ' jour(s). Montant : ' || invoice_rec.total_amount || ' EUR',
          'warning',
          'payment',
          '/invoices',
          'invoice',
          invoice_rec.id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. VUES UTILES
-- =====================================================

-- Vue : Contrats avec détails complets
CREATE OR REPLACE VIEW contracts_full AS
SELECT 
  c.*,
  t.company_name as tenant_name,
  t.email as tenant_email,
  t.phone as tenant_phone,
  s.shop_number,
  s.name as shop_name,
  s.surface_area,
  p.full_name as created_by_name
FROM contracts c
LEFT JOIN tenants t ON t.id = c.tenant_id
LEFT JOIN shops s ON s.id = c.shop_id
LEFT JOIN profiles p ON p.id = c.created_by;

-- Vue : Factures avec détails complets
CREATE OR REPLACE VIEW invoices_full AS
SELECT 
  i.*,
  t.company_name as tenant_name,
  t.email as tenant_email,
  c.contract_number,
  c.shop_id,
  s.shop_number,
  (i.total_amount - i.amount_paid) as balance_due
FROM invoices i
LEFT JOIN tenants t ON t.id = i.tenant_id
LEFT JOIN contracts c ON c.id = i.contract_id
LEFT JOIN shops s ON s.id = c.shop_id;

-- Vue : Statistiques du dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM tenants WHERE active = true) as active_tenants,
  (SELECT COUNT(*) FROM shops WHERE status = 'occupied') as occupied_shops,
  (SELECT COUNT(*) FROM shops WHERE status = 'vacant') as vacant_shops,
  (SELECT COUNT(*) FROM contracts WHERE status = 'active') as active_contracts,
  (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices,
  (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM invoices WHERE status IN ('pending', 'sent', 'overdue')) as pending_payments,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as current_month_revenue;

-- Accorder les permissions sur les vues
GRANT SELECT ON contracts_full TO authenticated;
GRANT SELECT ON invoices_full TO authenticated;
GRANT SELECT ON dashboard_stats TO authenticated;
