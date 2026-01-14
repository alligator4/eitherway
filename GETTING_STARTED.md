# Getting Started with PropertyHub

## 🌍 Multi-Language Property Management System

Welcome to PropertyHub - a comprehensive property management application with full support for **English**, **French**, and **Arabic** languages, featuring robust role-based access control.

---

## 🚀 Quick Start

### Step 1: Initial Admin Setup

**IMPORTANT**: The first user to sign up automatically becomes the system administrator.

**Pre-configured Admin Email**: `djalabiali@gmail.com`

To set up the admin account:

1. Navigate to the signup page
2. Use email: **djalabiali@gmail.com**
3. Choose a secure password (minimum 6 characters)
4. Enter your full name
5. Click "Sign Up"

You will immediately receive full administrative privileges including:
- User management capabilities
- Role assignment permissions
- Access to all system modules
- Activity log monitoring

### Step 2: Language Selection

The system supports three languages with automatic persistence:

- **English (EN)** - Default
- **French (FR)** - Français
- **Arabic (عربي)** - Full RTL (right-to-left) support

**How to change language:**
1. Click the language buttons (EN / FR / عربي) on the login/signup page
2. Or use the language selector in the sidebar after logging in
3. Your preference is automatically saved to localStorage

---

## 👥 User Roles & Permissions

### Admin
**Full System Access**
- ✅ User management (assign/change roles)
- ✅ Properties and units management
- ✅ Tenant and lease management
- ✅ Financial operations (invoices, payments)
- ✅ Activity logs and audit trail
- ✅ All dashboard statistics

### Manager
**Operational Management**
- ✅ Properties and units management
- ✅ Tenant and lease management
- ✅ Contract creation and management
- ✅ Invoice generation
- ✅ Payment recording
- ✅ Maintenance requests
- ❌ User management
- ❌ Activity logs

### Accountant
**Financial Focus**
- ✅ View all invoices
- ✅ View all payments
- ✅ Financial dashboards
- ✅ Revenue tracking
- ❌ Property/tenant management
- ❌ User management

### Tenant
**Limited Self-Service**
- ✅ View own leases
- ✅ View payment history
- ✅ Submit maintenance requests
- ❌ All management functions

### Maintenance Staff
**Maintenance Operations**
- ✅ View maintenance requests
- ✅ Update request status
- ✅ View assigned properties
- ❌ Financial data access
- ❌ Management functions

---

## 📋 Core Features

### 1. Properties Management
Manage your real estate portfolio:
- Add properties with detailed information
- Track property types (residential, commercial, mixed)
- Monitor property locations
- View occupancy rates

### 2. Units Management
Individual unit tracking:
- Unit specifications (bedrooms, bathrooms, size)
- Rental amounts
- Status tracking (vacant, occupied, under maintenance)
- Floor and location within property

### 3. Tenants Management
Comprehensive tenant profiles:
- Contact information
- National ID documentation
- Emergency contacts
- Business type and registration details
- Tenant history

### 4. Leases Management
Full lease lifecycle:
- Create lease agreements
- Set start and end dates
- Define monthly rent and deposits
- Track lease status
- Automatic renewal alerts (90 days before expiry)

### 5. Financial Management
Complete financial tracking:
- **Invoices**: Automatic generation from active leases
- **Payments**: Record payments with multiple methods
- **Revenue Tracking**: Monthly and total revenue dashboards
- **Arrears Monitoring**: Overdue payment alerts

### 6. Maintenance Requests
Maintenance workflow:
- Submit requests with priority levels
- Track status (pending, in progress, completed)
- Assign to maintenance staff
- View request history

### 7. User Management (Admin Only)
Role-based user control:
- View all registered users
- Assign roles to new users
- Change existing user roles
- Monitor user activity

### 8. Activity Logs (Admin Only)
Complete audit trail:
- All user actions logged
- IP address tracking
- Timestamp recording
- Search and filter capabilities

---

## 🎯 Common Workflows

### For Admins

**Adding a New Manager:**
1. Have the user sign up with their email
2. Go to **User Management**
3. Find the user in the list
4. Click **Change Role**
5. Select "Manager"
6. Click **Save**

**Monitoring System Activity:**
1. Navigate to **Activity Logs**
2. View all system actions
3. Search by user or action type
4. Track important events

### For Managers

**Onboarding a New Tenant:**
1. Go to **Properties** → Add property (if needed)
2. Go to **Units** → Add unit (if needed)
3. Go to **Tenants** → Add tenant with full details
4. Go to **Leases** → Create lease agreement
5. System automatically generates first invoice

**Monthly Financial Tasks:**
1. Review dashboard for occupancy and revenue
2. Check **Invoices** for unpaid amounts
3. Record payments in **Payments** section
4. Follow up on overdue invoices

### For Accountants

**Monthly Financial Review:**
1. View **Dashboard** for revenue overview
2. Check **Invoices** for payment status
3. Review **Payments** for transaction history
4. Track overdue payments
5. Generate financial reports (if needed)

---

## 🌐 Language-Specific Features

### French (Français)
- Complete UI translation
- Financial terms in French
- Date formats adjusted
- Proper accent support

### Arabic (عربي)
- Full RTL (right-to-left) layout
- Arabic number formatting
- Proper text alignment
- Cultural considerations in UI

**Language Coverage Includes:**
- All navigation menus
- Form labels and inputs
- Status indicators
- Error messages
- Dashboard statistics
- Action buttons
- Help text and tooltips

---

## 🔐 Security Features

- **Secure Authentication**: Powered by Supabase Auth
- **Row Level Security**: Database-level access control
- **Role-Based Access**: Granular permissions
- **Activity Logging**: Complete audit trail
- **Protected Routes**: Frontend route guards
- **First User Admin**: Automatic admin assignment

---

## 📊 Dashboard Overview

The dashboard provides at-a-glance insights:

**Admin/Manager View:**
- Total properties and units
- Occupancy rates and vacant units
- Active leases count
- Monthly revenue
- Pending maintenance requests
- Overdue payments alert

**Accountant View:**
- Monthly revenue
- Overdue payments
- Payment status breakdown
- Financial trends

**Tenant View:**
- Active lease details
- Payment history
- Maintenance requests status

---

## 💡 Pro Tips

1. **Set Language First**: Choose your preferred language before logging in - it persists across sessions

2. **Admin Setup**: Sign up with djalabiali@gmail.com FIRST to ensure admin access

3. **Role Assignment**: After initial admin setup, create manager accounts next for operational tasks

4. **Regular Monitoring**: Check Activity Logs weekly to monitor system usage

5. **Financial Tracking**: Review invoices at the start of each month to stay on top of payments

6. **Mobile Access**: The system is fully responsive - use on tablets and phones

7. **Language Switching**: You can change languages anytime without losing your work

---

## 🆘 Troubleshooting

**Problem**: Can't access User Management
**Solution**: Only admins can access this page. Check your role in the sidebar.

**Problem**: Language not changing
**Solution**: Clear browser cache and try again. The language is stored in localStorage.

**Problem**: Can't see properties/tenants
**Solution**: Check your role. Accountants and tenants have limited access.

**Problem**: Invoice not generating
**Solution**: Ensure the lease is in "active" status and has proper rent amounts set.

---

## 📞 Support

For any issues or questions:
- **Admin Access**: djalabiali@gmail.com has full system access
- **Role Issues**: Contact your admin to adjust permissions
- **Technical Problems**: Check the Activity Logs for error details

---

## 🎉 Welcome to PropertyHub!

You're all set! Start by:
1. Signing up with the admin email
2. Selecting your preferred language
3. Adding your first property
4. Inviting team members
5. Starting your property management journey

**Remember**: The first user to sign up becomes admin, so make sure to use djalabiali@gmail.com first!
