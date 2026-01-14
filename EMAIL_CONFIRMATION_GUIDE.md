# Email Confirmation Guide

## Problem: "Invalid login credentials" after signup

If you receive an "Invalid login credentials" error immediately after creating your account, this is because **Supabase requires email confirmation** before you can log in.

## Solution

### Option 1: Confirm Your Email (Recommended)

1. After signing up, check your email inbox
2. Look for an email from Supabase with the subject "Confirm Your Email"
3. Click the confirmation link in the email
4. Once confirmed, return to the login page and sign in with your credentials

**Important:** Check your spam/junk folder if you don't see the email within a few minutes.

### Option 2: Disable Email Confirmation (Development Only)

If you're testing the application in development mode and want to skip email confirmation:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Uncheck the option **"Enable email confirmations"**
4. Save the changes
5. New signups will no longer require email confirmation

**Warning:** Disabling email confirmation is NOT recommended for production applications as it reduces security.

### Option 3: Run SQL to Disable Confirmation Requirement

You can also run this SQL command in your Supabase SQL Editor:

```sql
-- Disable email confirmation requirement
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmation_token = NULL 
WHERE email_confirmed_at IS NULL;
```

This will confirm all existing unconfirmed users.

## How the Application Handles This

### Signup Page (`/signup`)
- Shows a clear success message after registration
- Provides step-by-step instructions:
  1. Check email inbox
  2. Click confirmation link
  3. Return to login
- Includes a warning about spam folders

### Login Page (`/login`)
- Provides helpful error messages
- If "Invalid login credentials" error occurs, reminds user to confirm email
- Includes a link to the forgot password page

### Password Reset System
- Fully functional at `/forgot-password`
- Sends a secure reset link to the user's email
- User clicks the link and sets a new password at `/reset-password`
- Automatically redirects to login after successful reset

## Testing the Flow

1. **Sign up** with a new email
2. **Check your email** for the confirmation link
3. **Click the confirmation link** - you'll be redirected to the app
4. **Log in** with your credentials - should now work!

## Troubleshooting

### Email not arriving?
- Check spam/junk folder
- Verify the email address is correct
- Try resending by signing up again (it will send another confirmation email)

### Still can't log in after confirming?
- Clear your browser cache and cookies
- Try a different browser
- Check that you're using the correct password

### Forgot your password?
- Click "Forgot Password?" on the login page
- Enter your email address
- Check your inbox for the password reset link
- Follow the link to set a new password

## Admin Setup

The first user to sign up automatically becomes an admin. To add more admins manually, run this SQL command:

```sql
-- Make a user admin by email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

See `ADMIN_SETUP.md` for more details on user roles and permissions.

## Support

If you continue to experience issues:
1. Check the browser console for detailed error messages
2. Verify your Supabase configuration in `.env.local`
3. Ensure your Supabase project is active and not paused
4. Check Supabase logs in your dashboard under "Logs" → "Auth"
