# Changement de devise : EUR → FCFA (XAF)

## ✅ Fichiers modifiés

### Composants principaux

1. **src/components/ContractModal.jsx**
   - Devise par défaut : `XAF`
   - Ordre des options : FCFA (XAF) en premier
   - Tous les fallbacks : `EUR` → `XAF`

2. **src/components/InvoiceModal.jsx**
   - Devise par défaut : `XAF`
   - Ordre des options : FCFA (XAF) en premier
   - Tous les fallbacks : `EUR` → `XAF`

3. **src/components/PaymentModal.jsx**
   - Devise par défaut dans formatMoney : `XAF`
   - Fallback paiement : `EUR` → `XAF`

### Pages d'affichage

4. **src/components/Dashboard.jsx**
   - formatMoney par défaut : `XAF`
   - Affichage revenu mensuel : `XAF`
   - Affichage factures en retard : `XAF`

5. **src/components/DashboardEnhanced.jsx**
   - formatCurrency : `XAF`

6. **src/components/ContractsPage.jsx**
   - formatMoney par défaut : `XAF`

7. **src/components/InvoicesPage.jsx**
   - formatMoney par défaut : `XAF`
   - Statistiques (total, payé, à encaisser) : `XAF`
   - Liste des factures : `XAF`

8. **src/components/PaymentsPage.jsx**
   - formatMoney par défaut : `XAF`
   - Totaux par devise : `XAF`
   - Liste des paiements : `XAF`

9. **src/components/ShopsPage.jsx**
   - formatMoney par défaut : `XAF`
   - Affichage loyer mensuel : `XAF`

## 📋 Sélecteurs de devise

Tous les sélecteurs de devise affichent maintenant :
```
1. FCFA (XAF)  ← Par défaut
2. EUR
3. USD
4. MAD
```

## 🔧 Valeurs par défaut

- **Nouveaux contrats** : `XAF`
- **Nouvelles factures** : `XAF`
- **Nouveaux paiements** : `XAF`
- **Affichage montants** : `XAF` si non spécifié

## 🎯 Résultat

✅ Toute l'application utilise maintenant le FCFA (XAF) comme devise par défaut
✅ Les utilisateurs peuvent toujours choisir EUR, USD ou MAD si nécessaire
✅ Format d'affichage : `123 456,78 F CFA` (via Intl.NumberFormat)
