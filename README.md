# PrintQueue AI

**Don't join the queue.**

PrintQueue AI is a smart campus printing platform that connects students with approved campus print shops and turns uncertain waiting into a predictable, AI-driven pickup experience.

---

## Problem Statement

Students on every campus waste significant time physically visiting printing shops without knowing:
- If the shop is open
- How long the queue is
- What the cost will be
- When their documents will be ready

This leads to repeated trips, missed deadlines, and unnecessary frustration.

---

## Solution

PrintQueue AI provides a complete digital ordering platform:

1. Students select a campus location
2. AI recommends the best available shop based on queue, price, rating, and deadline
3. Students upload PDFs and configure print settings
4. Orders are placed with live cost calculation
5. Digital token + secure OTP are generated
6. Real-time order tracking via Supabase Realtime
7. Shop owner manages orders through a professional dashboard
8. Admin controls locations, shops, users and analytics

---

## Key Features

### For Students
- AI-powered shop recommendation with explainable reasoning
- Real-time order tracking (no page refresh needed)
- Digital token + 6-digit pickup OTP
- PDF upload with Supabase Storage
- Dynamic cost calculator with priority pricing
- Print presets: Notes, Assignment, Exam
- Order history with one-click reorder
- Eco score tracking
- Notifications (order placed, accepted, ready, picked up)
- Mobile-first responsive design with bottom navigation

### For Shop Owners
- Professional order management dashboard
- Real-time incoming order notifications
- Accept / Reject / Preparing / Ready / Complete workflow
- OTP verification for secure pickup
- Open/Closed toggle with instant student visibility update
- Daily revenue and analytics
- Shop profile management

### For Admins
- Platform-wide analytics with Recharts
- Shop approval workflow (approve/reject requests)
- Location management (add/disable campus areas)
- User management
- Order oversight

---

## AI Features

1. **Smart Shop Recommendation** — Scores shops by queue, rating, price, speed, and deadline compatibility
2. **Queue/Completion Prediction** — Calculates estimated ready time per shop
3. **Natural Language Explanation** — Gemini/OpenAI generates a clear explanation of why a shop was recommended
4. **Deadline Analysis** — Checks if the shop can meet the student's deadline
5. **AI Assistant** — Chat interface for printing-related questions (Tools page)

---

## User Roles

| Role | Permissions |
|------|-------------|
| Student | Browse shops, place orders, track orders, view history |
| Shop Owner | Manage their shop, accept/reject orders, verify OTP, view analytics |
| Admin | Full platform management, approve shops, manage locations, view all data |

All authorization checks are performed **server-side**. Client cannot escalate privileges.

---

## Architecture

```
Student / Owner / Admin
       ↓
   Next.js 16
   App Router
       ↓
Server Actions / Route Handlers
       ↓
      Supabase
  ↙      ↓      ↘
Auth  PostgreSQL  Storage
  ↓       ↓
 RLS   Realtime
           ↓
     AI Service
     (Gemini/OpenAI)
           ↓
  Smart Recommendation
           ↓
        Vercel
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI primitives, custom components |
| Icons | Lucide React |
| Backend | Next.js Server Actions, Route Handlers |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| AI | Google Gemini 1.5 Flash / OpenAI GPT-3.5 |
| Charts | Recharts |
| Form Validation | Zod |
| Deployment | Vercel |

---

## Database Schema

```
profiles          — User accounts with roles
locations         — Campus areas
shops             — Approved printing shops
shop_requests     — Shop registration requests
orders            — Print orders
payments          — Payment records
notifications     — User notifications
reviews           — Student reviews for shops
print_presets     — Saved print configurations
```

---

## Supabase Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **API keys**

### 2. Run Migrations
In the Supabase SQL Editor, run in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed_data.sql`

### 3. Configure Storage
1. Create a bucket named **`documents`** (private)
2. Add storage policies as described in `003_seed_data.sql`

### 4. Enable Realtime
In the SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
```

### 5. Create Demo Users
Register via the app UI:
- `admin@printqueue.ai` / `Admin@1234` → then run: `UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@printqueue.ai';`
- `owner1@printqueue.ai` / `Owner@1234` (select Shop Owner during registration)
- `student1@printqueue.ai` / `Student@1234` (select Student during registration)

---

## Environment Variables

```bash
# Copy .env.example to .env.local
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `AI_PROVIDER` | `gemini` or `openai` |
| `AI_API_KEY` | Your Gemini or OpenAI API key |

---

## Local Setup

```bash
# Clone the repository
git clone https://github.com/your-username/printqueue-ai.git
cd printqueue-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and AI credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## Deployment (Vercel)

1. Push code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy

The app uses Next.js App Router and is optimized for Vercel deployment.

---

## Demo Flow

| Step | Action |
|------|--------|
| 1 | Student registers and logs in |
| 2 | Selects Rathinam campus location |
| 3 | Enters deadline (e.g. today at 2 PM) |
| 4 | AI analyzes and recommends the best shop |
| 5 | Student uploads PDF |
| 6 | Selects: 50 pages, 2 copies, B&W |
| 7 | Chooses: Pay at Shop |
| 8 | Receives token PQ2048 and pickup OTP |
| 9 | Shop owner sees the order instantly |
| 10 | Owner accepts → Student sees "Accepted" live |
| 11 | Owner marks Ready → Student notified |
| 12 | Owner verifies OTP → Order complete |

---

## Future Improvements

- [ ] Razorpay / PayU payment integration
- [ ] Push notifications (Web Push API)
- [ ] Document preview before ordering
- [ ] Multi-page PDF page selection
- [ ] Loyalty points system
- [ ] Shop operating hours scheduler
- [ ] Student rating & review system (UI)
- [ ] Admin bulk operations
- [ ] WhatsApp/SMS notifications via Twilio
- [ ] Progressive Web App (PWA) support

---

## Security

- Supabase Auth for all authentication
- Row Level Security on every table
- Server-side authorization in all Server Actions
- No API keys exposed to client
- Input validation with Zod
- File type and size validation on upload
- OTP is hashed/hidden until needed
- Service role key used only server-side

---

*Built for national-level hackathon demonstration. PrintQueue AI — Don't join the queue.*
