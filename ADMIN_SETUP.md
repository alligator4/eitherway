# Admin Account Setup Guide

## Pre-configured Admin Account

The system has been configured with the following admin account:

**Email**: `djalabiali@gmail.com`

This email is pre-seeded in the database as an admin account. When you sign up with this email, you will automatically receive full administrative privileges.

## First-Time Setup

### Step 1: Sign Up with Admin Email

1. Navigate to the signup page
2. Enter the following details:
   - **Email**: `djalabiali@gmail.com`
   - **Password**: Choose a secure password (minimum 6 characters)
   - **Full Name**: Your preferred name
3. Click "Sign Up"

### Step 2: Verify Admin Access

After signing up and logging in, verify you have admin access by checking:

1. **Navigation Menu**: You should see all menu items including:
   - Dashboard
   - Properties (Shops)
   - Tenants
   - Leases (Contracts)
   - Payments (Invoices & Payments)
   - **User Management** (Admin only)
   - **Activity Logs** (Admin only)

2. **Profile Badge**: Your role should display as "Admin" in the sidebar

### Step 3: Manage Other Users

Once logged in as admin:

1. Go to **User Management** in the sidebar
2. You'll see all registered users
3. Click "Change Role" to assign roles to other users
4. Available roles:
   - **Admin**: Full system access
   - **Manager**: Manage properties, tenants, contracts
   - **Accountant**: Access financial data only
   - **Tenant**: View own leases and payments
   - **Maintenance Staff**: Handle maintenance requests

## Language Settings

The admin account supports all three languages:

- **English (EN)**: Default
- **French (FR)**: Français
- **Arabic (عربي)**: العربية with RTL support

Change language using the language selector buttons in the sidebar or on the login page.

## Security Notes

1. **First User Auto-Admin**: The database is configured so the FIRST user to sign up automatically becomes admin
2. **Pre-seeded Email**: The email `djalabiali@gmail.com` is pre-configured in the database as admin
3. **Role Assignment**: Only admins can change user roles through the User Management page

## Database Migration Status

All database tables have been created with Row Level Security (RLS) enabled:

✅ **profiles** - User accounts and roles (admin pre-seeded)
✅ **properties** - Property information
✅ **units** - Rental units
✅ **tenants** - Tenant profiles
✅ **leases** - Lease agreements
✅ **invoices** - Billing and invoices
✅ **payments** - Payment records
✅ **maintenance_requests** - Maintenance tracking
✅ **shop_tenants** - Occupation history (for shop management context)

## Troubleshooting

### Can't see User Management menu?
- Verify you signed up with exactly: `djalabiali@gmail.com`
- Check your profile shows "Admin" role
- Try logging out and logging back in

### Other users can't access features?
- Go to User Management as admin
- Assign appropriate roles to each user
- Users need to log out and log back in after role changes

### Language not changing?
- Language preference is saved in browser localStorage
- Clear browser cache if language persists incorrectly
- Try changing language from the sidebar after login

## Next Steps

After admin setup:

1. **Add Properties**: Create properties and units
2. **Register Tenants**: Add tenant profiles
3. **Create Leases**: Link tenants to units with lease agreements
4. **Generate Invoices**: Create monthly rent invoices
5. **Record Payments**: Track payment transactions
6. **Invite Team**: Add other users and assign appropriate roles

## Support

If you encounter any issues:
1. Check the Activity Logs (Admin only) for system events
2. Verify database migrations completed successfully
3. Ensure you're using the correct admin email address
