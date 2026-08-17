# Secure deployment setup

This site is published by GitHub Pages, but GitHub Pages itself is static hosting and does not provide username/password protection for the app.

## Recommended architecture
- GitHub Pages: public static frontend only.
- Supabase Auth: email/password authentication and sessions.
- Supabase Postgres + Row Level Security: private user data.
- Browser receives only the Supabase publishable/anon key; never use a service_role/secret key in the frontend.

## One-time setup
1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase-schema.sql`.
3. In Authentication settings, enable Email/Password. Keep email confirmation enabled if you want the extra verification step.
4. Copy the Project URL and Publishable/Anon Key into `auth-config.js`.
5. Add your GitHub Pages URL to Supabase Auth URL Configuration as the Site URL and allowed redirect URL.
6. Deploy/re-run GitHub Pages.
7. Create your private account from the login screen.

## Important
- Do not commit passwords, recovery codes, service-role keys, database passwords, or private tokens.
- The Supabase anon/publishable key is not a password. Security comes from Auth + RLS policies.
- Do not put real family/financial/health records in the public Git history.
