# RoboRoll message board setup

## 1. Create the free project

1. Open https://supabase.com/dashboard
2. Create a new project.
3. Keep the database password somewhere private.

## 2. Create the table and permissions

1. Open **SQL Editor** in Supabase.
2. Copy all SQL from `supabase-setup.sql`.
3. Run it once.

## 3. Connect the website

Open **Project Settings > Data API** and copy:

- Project URL
- Publishable key (or legacy `anon` public key)

Put them in `supabase-config.js`:

```js
window.ROBOROLL_SUPABASE = {
  url: "https://your-project.supabase.co",
  anonKey: "your-public-anon-key",
};
```

The publishable/anon key is designed to be used in a public website. Never put the service-role key in this file.

## 4. Create the administrator login

1. Open **Authentication > Users**.
2. Create one user using the RoboRoll administrator email and a strong password.
3. Open **Authentication > Sign In / Providers > Email**.
4. Disable public user sign-up so visitors cannot create administrator accounts.

The private reply page is:

`https://stephenbodymind.github.io/roboroll-l1/admin.html`

## Behavior

- New visitor messages appear publicly immediately.
- The home page displays up to three featured/latest messages.
- `comments.html` displays all visible messages.
- The administrator can reply, feature, or hide each message.

Because public messages appear immediately, check the admin page regularly for spam. A moderated-before-publishing workflow can be enabled later by changing the `visible` default to `false`.
