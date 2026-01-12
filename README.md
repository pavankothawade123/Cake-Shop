# Cake Shop - Production-Ready E-Commerce Application

A full-stack, production-quality cake shop web application built with Next.js 14, TypeScript, and modern web technologies. This application is architected to be deployed with minimal changes while currently using free-tier tools and mock services.

<img width="1728" height="745" alt="Screenshot 2026-01-11 at 11 35 27 PM" src="https://github.com/user-attachments/assets/1d3af92d-750a-40fc-89e9-45f7bc205e97" />
<img width="1727" height="956" alt="Screenshot 2026-01-11 at 11 35 33 PM" src="https://github.com/user-attachments/assets/9c2ae2ca-de56-4d66-921a-442edfca27fd" />


## Features

### Customer Features
- **Browse Products**: View catalog with filtering, sorting, and search
- **Product Customization**: Customize cakes with size, flavor, frosting, eggless option, and custom messages
- **Shopping Cart**: Add, update, and remove items with persistent storage
- **Checkout Flow**: Complete order placement with delivery scheduling
- **Order Tracking**: View order history and real-time status updates
- **Reviews & Ratings**: Leave reviews for delivered orders
- **Guest Checkout**: Place orders without registration
- **User Authentication**: Secure login and registration

### Admin Features
- **Dashboard**: Overview of products, orders, and users
- **Product Management**: Create, update, and delete products
- **Order Management**: View all orders, filter by status, and update order status
- **User Management**: View user accounts and toggle account status
- **Review Moderation**: Delete inappropriate reviews

## Tech Stack

### Core
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)

### State Management
- **Server State**: TanStack Query (React Query)
- **Client State**: Zustand (cart & UI state)

### Database & ORM
- **Database**: PostgreSQL
- **ORM**: Prisma

### Authentication
- **Auth**: Auth.js (NextAuth) v5 beta
- **Strategy**: Credentials (email/password)
- **Security**: bcryptjs for password hashing

### Validation
- **Zod**: Shared validation schemas (frontend & backend)

### Services
- **Email**: Mock service (console logging)
- **Payment**: Mock service (simulated processing)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Cake-Shop
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cakeshop?schema=public"

# NextAuth
AUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

4. **Set up the database**

Create a PostgreSQL database, then run:

```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Using Local PostgreSQL

Install PostgreSQL and create a database:
```bash
createdb cakeshop
```

Update DATABASE_URL in `.env` with your credentials.

### Using Supabase (Free Tier)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string and update DATABASE_URL in `.env`

### Using Neon (Free Tier)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string and update DATABASE_URL in `.env`

## Creating Sample Data

### Create an Admin User

1. Register a new user via `/auth/register`
2. Connect to your database and update the user's role:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Create Categories

Use Prisma Studio:
```bash
npx prisma studio
```

Or directly in database:
```sql
INSERT INTO categories (id, name, slug, description, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Birthday Cakes', 'birthday-cakes', 'Celebration cakes for birthdays', NOW(), NOW()),
  (gen_random_uuid(), 'Wedding Cakes', 'wedding-cakes', 'Elegant cakes for weddings', NOW(), NOW()),
  (gen_random_uuid(), 'Custom Cakes', 'custom-cakes', 'Fully customized cakes', NOW(), NOW());
```

### Create Sample Products

Use the admin dashboard at `/admin` to create products after logging in as an admin.

## Service Abstraction

The application uses service layers that can be easily replaced:

### Email Service (`services/email.service.ts`)

Currently: Console logging
To replace: Implement the `EmailService` interface with providers like SendGrid, AWS SES, Resend, or Postmark.

### Payment Service (`services/payment.service.ts`)

Currently: Mock service with simulated processing
To replace: Implement the `PaymentService` interface with Stripe, PayPal, Square, or Razorpay.

**No UI changes required** - just swap the service implementation!

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
AUTH_SECRET="generate-a-new-secret-for-production"
AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Architecture Highlights

- **Clean Architecture**: Separation of concerns (UI, business logic, data)
- **Service Abstraction**: Easy to swap external services
- **Type Safety**: Full TypeScript coverage
- **Validation**: Shared Zod schemas for frontend/backend
- **Responsive Design**: Mobile-first approach
- **Performance**: Optimized images, code splitting, caching

## Security Features

- Password hashing with bcryptjs
- JWT-based sessions
- Role-based access control (RBAC)
- Protected API routes
- Input validation with Zod
- SQL injection prevention with Prisma

## License

MIT

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies
