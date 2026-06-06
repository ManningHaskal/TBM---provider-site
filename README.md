# TexBioMed Provider Portal

Invite-only web portal for medical providers to place peptide orders on behalf of patients.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Google Sheets (product catalog + order intake)
- Resend (staff email notifications)
- Vercel (hosting)

## Prototype checklist (what you still need)

The app code is ready. To run a **working prototype** end-to-end, you still need these external accounts and values:

| Item | Required? | Purpose |
|---|---|---|
| **Supabase project** | Yes | Login, patients, orders database |
| **Run SQL migrations** | Yes | `001_initial_schema.sql` (+ `002_patient_fields.sql` if upgrading) |
| **`.env.local` keys** | Yes | Supabase URL, anon key, service role key |
| **First admin account** | Yes | `npm run seed:admin` so reps can generate invites |
| **Google Cloud service account** | For live pricing sync | Lets staff edit prices in Google Sheets |
| **Products Google Sheet** | Optional at first | Import [`products-for-google-sheet.csv`](products-for-google-sheet.csv); without it the app uses bundled prices from your xlsx |
| **Orders Google Sheet** | Optional at first | Order intake for staff; orders still save in Supabase without it |
| **Resend API key** | Optional at first | Staff email on new orders; without it orders log to server console |
| **`ORDER_NOTIFICATION_EMAIL`** | If using email | e.g. `orders@texbiomed.us` or `manning@texbiomed.us` |
| **`APP_URL`** | Yes for invites/email | `http://localhost:3000` locally, Vercel URL when deployed |
| **Vercel deploy** | For sharing with reps | Free `*.vercel.app` URL works until you have a domain |

**Minimum local prototype (about 30 minutes):**

1. Create Supabase project → run migration SQL → copy keys to `.env.local`
2. `npm run seed:admin` with your email/password
3. `npm run dev` → sign in → `/admin/invites` → generate a test provider invite
4. Open invite in another browser → create provider account → add patient → submit test order

**Already integrated from your files:**

- TexBioMed logo → [`public/texbiomed-logo.webp`](public/texbiomed-logo.webp)
- 117 peptide variants + prices from your xlsx → [`src/data/products.json`](src/data/products.json)
- Patient fields: full name, email, phone, DOB, weight, height, shipping address, sex

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Create a Supabase project and run the SQL migration in [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) using the Supabase SQL editor.

4. Fill in `.env.local` with your Supabase, Google Sheets, and Resend credentials.

5. Seed the first admin account:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='your-secure-password' \
ADMIN_NAME='Admin Name' \
ADMIN_PRACTICE='TexBioMed' \
node scripts/seed-admin.mjs
```

6. Start the dev server:

```bash
npm run dev
```

## Google Sheets setup

### Products sheet

Create a sheet tab named `Products` with headers:

| name | sku | price | active | sort_order | category |

Share the sheet with your Google service account email (Viewer access is enough).

Set `GOOGLE_PRODUCTS_SHEET_ID` in `.env.local`.

If Sheets are not configured yet, the app reads products from [`Healthcare Provider Live Products & Prices.xlsx`](Healthcare%20Provider%20Live%20Products%20&%20Prices.xlsx) in the project root. After editing that file, run `npm run import:products` to refresh the bundled copy, or restart the dev server to pick up live reads.

### Orders sheet

Create a sheet tab named `Orders` with headers:

| submitted_at | order_id | provider_name | provider_email | patient_name | patient_email | patient_phone | shipping_address | line_items_summary | order_total | portal_url |

Share the sheet with your service account email (Editor access required).

Set `GOOGLE_ORDERS_SHEET_ID` in `.env.local`.

## Provider workflow

1. Admin signs in and opens `/admin/invites`.
2. Admin generates an invite link and sends it to the provider.
3. Provider opens the invite link, creates an account, and signs in.
4. Provider manages patients and submits orders from the portal.
5. Each submitted order is saved in Supabase, appended to the Orders Google Sheet, and emailed to TexBioMed staff.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add all environment variables from `.env.example`.
4. Set `APP_URL` to your Vercel deployment URL.
5. Deploy.
6. Run `scripts/seed-admin.mjs` against production Supabase credentials to create the first admin.
7. Sign in, generate a provider invite, and run an end-to-end test order.

## Verification checklist

- Unauthenticated users are redirected away from `/home`, `/patients`, and `/orders`.
- Signup requires a valid invite token.
- Product dropdown uses Google Sheet data when configured.
- Order submit writes to Supabase, the Orders sheet, and sends staff email.
- Reorder pre-fills the new order form.
- Providers only see their own patients and orders (Supabase RLS).
