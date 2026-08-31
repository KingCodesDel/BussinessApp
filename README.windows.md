# Velora — Windows setup guide

This is a Windows-specific version of the setup instructions from `README.md`.
Everything else in that file (schema, architecture, payments, security notes)
applies as-is — this file only replaces the shell commands that differ on
Windows (env vars, path separators, script invocation).

Use **PowerShell** (recommended, comes with Windows 10/11) unless noted
otherwise. Command Prompt (`cmd.exe`) alternatives are given where the syntax
differs.

---

## 1. Prerequisites

- **Node.js 18.17+** — download from nodejs.org and run the installer
  (check "Add to PATH" if the installer asks). Verify with:
  ```powershell
  node -v
  npm -v
  ```
- **Git for Windows** (optional but recommended) — git-scm.com
- A code editor — VS Code works well and has a built-in terminal you can run
  all of this from directly.

---

## 2. Local setup

Open PowerShell, navigate into the unzipped project folder, then:

```powershell
npm install
copy .env.example .env.local
npm run dev
```

*(Command Prompt: use `copy` as well — that part is the same on both.)*

Then open `.env.local` in your editor and fill in the Supabase values from
section 3 below. Once saved, visit **http://localhost:3000**.

If `npm install` fails with a permissions or script-execution error in
PowerShell, you likely have PowerShell's execution policy blocking npm's
shell scripts. Fix it once (per user, doesn't need admin):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## 3. Supabase setup ($0 tier)

Identical to the main README — no OS-specific steps here:

1. Create a project at supabase.com (free tier).
2. **Project Settings → API** → copy the Project URL and `anon public` key
   into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Also copy the `service_role` key into `SUPABASE_SERVICE_ROLE_KEY`.
3. **SQL Editor** → paste the full contents of `supabase\schema.sql` → Run.
4. **Storage** → New bucket → name it exactly `product-images` → make it public.
5. **Database → Replication** → enable replication on the `messages` table
   (needed for live chat delivery; everything else works without it).
6. **Authentication → Providers** → email/password is on by default. Turn off
   "Confirm email" while developing locally, or leave it on and test the
   confirmation flow via the Auth logs tab.

---

## 4. Create your first business owner account

This is the one step that genuinely differs on Windows — setting environment
variables for a single command uses different syntax than macOS/Linux's
`export`.

**PowerShell** — load `.env.local` into your session, then run the script:

```powershell
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
  }
}
npm run seed:admin -- owner@example.com "StrongPassword123!" "My Business"
```

**Command Prompt** — there's no direct equivalent for loading a whole `.env`
file, so set the three required variables manually for that session:

```cmd
set NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npm run seed:admin -- owner@example.com "StrongPassword123!" "My Business"
```

Either way, this creates a confirmed auth user, sets their role to `owner`,
and creates a business row for them. Log in at `/login`, then visit `/admin`.

You can skip this entirely and just use the UI instead: sign up at `/signup`,
then go to `/business/signup` to register a store — this is the normal
self-serve path and needs no terminal commands at all.

---

## 5. Deploy ($0 monthly)

No Windows-specific steps here — this happens in the browser and on GitHub:

1. Push the project to GitHub. If you don't have Git set up yet, GitHub
   Desktop (desktop.github.com) is the easiest path on Windows — no command
   line needed.
2. vercel.com → New Project → import the repo.
3. Add every variable from `.env.local` into Vercel's Environment Variables
   settings (including the service role key — Vercel keeps it server-only
   since it's never referenced in client components).
4. Deploy, then update `NEXT_PUBLIC_SITE_URL` to your production URL and
   redeploy.

---

## 6. Common Windows-specific gotchas

- **Long path errors during `npm install`**: rare on modern Windows/Node, but
  if you hit `ENAMETOOLONG` or similar, move the project closer to your drive
  root (e.g. `C:\dev\velora` instead of a deeply nested folder) or enable long
  paths: `git config --system core.longpaths true` (as admin) and, if needed,
  enable the Windows long-paths group policy.
- **Line endings**: the schema and code files use LF line endings. If you edit
  `supabase\schema.sql` in an editor that converts to CRLF and then paste it
  into the Supabase SQL editor, it still runs fine — SQL isn't sensitive to
  this. Not a concern here.
- **Port already in use**: if `npm run dev` reports port 3000 is taken, either
  stop whatever's using it or run `npm run dev -- -p 3001` and visit that port
  instead.
- **`npm run seed:admin` "command not found" style errors**: make sure you're
  running it from inside the project folder (the one containing
  `package.json`), not a parent folder.

---

Everything past this point — database schema, payments integration, security
notes, what's stubbed — is identical to `README.md`; refer to that file for
the rest.
