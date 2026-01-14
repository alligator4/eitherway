# Multi-Language Property Management System

A comprehensive property management application supporting English, French, and Arabic with role-based access control.

## Features

### Multi-Language Support
- **English (EN)**: Default language
- **French (FR)**: Full French translations
- **Arabic (عربي)**: Full Arabic translations with RTL support

### Authentication & Authorization
- Secure user authentication with Supabase
- First user automatically becomes admin
- Role-based access control:
  - **Admin**: Full system access including user management
  - **Manager**: Property, tenant, and contract management
  - **Accountant**: Financial data access (invoices, payments)
  - **Tenant**: View own leases and payments
  - **Maintenance Staff**: Handle maintenance requests

### Pre-configured Admin Account
- **Email**: djalabiali@gmail.com
- **Initial Setup**: This email is seeded as an admin account
- Sign up with this email to get full administrative privileges

### Core Modules

**Properties Management**
- Add, edit, and delete properties
- Track property types (residential, commercial, mixed)
- Monitor property locations and details

**Units Management**
- Manage individual units within properties
- Track unit status (vacant, occupied, under maintenance)
- Unit specifications (bedrooms, bathrooms, size, rent)

**Tenants Management**
- Complete tenant profiles
- Contact information and documentation
- National ID and emergency contacts

**Leases Management**
- Create and manage lease agreements
- Track lease start/end dates
- Monitor lease status (active, expired, terminated)
- Automatic renewal alerts

**Financial Management**
- Generate rent invoices automatically
- Track payments and arrears
- Multiple payment methods (bank transfer, cash, check, card)
- Financial dashboards with revenue tracking

**Maintenance Requests**
- Submit and track maintenance requests
- Priority levels (low, medium, high, urgent)
- Status tracking (pending, in progress, completed)

**User Management** (Admin Only)
- Assign and change user roles
- Manage user permissions
- View all registered users

**Activity Logs** (Admin Only)
- Complete audit trail of all actions
- User activity tracking
- IP address logging

## Getting Started

### 1. Sign Up
- Visit the signup page
- Use email: **djalabiali@gmail.com** for admin access
- Or sign up with any email (subsequent users will need role assignment)

### 2. Language Selection
- Click the language buttons (EN / FR / عربي) on login/signup pages
- Or change language in the sidebar after logging in
- Your language preference is saved automatically

### 3. Admin Features
Once logged in as admin:
- Navigate to **User Management** to assign roles
- Access **Activity Logs** to monitor system usage
- Full access to all modules

### 4. Role-Based Workflows

**Manager Workflow**:
1. Add properties and units
2. Register tenants
3. Create lease agreements
4. Generate invoices
5. Record payments

**Accountant Workflow**:
1. View invoices and payment history
2. Track overdue payments
3. Monitor monthly revenue
4. Access financial dashboards

**Tenant Workflow**:
1. View own lease agreements
2. Check payment history
3. Submit maintenance requests

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Security Features

- Row Level Security (RLS) on all database tables
- Secure authentication with Supabase
- Role-based access control
- Protected routes
- Comprehensive activity logging
- First user auto-admin pattern

## Database Schema

- **profiles**: User accounts and roles
- **properties**: Property information
- **units**: Individual rental units
- **tenants**: Tenant profiles
- **leases**: Lease agreements
- **invoices**: Rent invoices
- **payments**: Payment records
- **maintenance_requests**: Maintenance tracking

## Language Support Details

The application provides comprehensive translations for:
- Navigation menus
- Form labels and placeholders
- Status indicators
- Error messages
- Dashboard statistics
- Action buttons

Arabic language includes full RTL (right-to-left) support with proper text alignment and layout adjustments.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Supabase credentials are automatically injected. No manual configuration needed.

## Support

For issues or questions, the admin account (djalabiali@gmail.com) has full access to manage users and resolve any problems.
