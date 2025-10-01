# Playmaker - Sports Facility Booking Platform

A comprehensive sports facility booking platform built with Next.js 15, featuring multi-tenant architecture, real-time booking management, and analytics dashboard.

## Features

### 🏟️ Platform Features
- **Facility Discovery**: Search and browse sports facilities across Slovenia
- **Real-time Booking**: Book facilities with instant confirmation
- **Advanced Search**: Filter by location, facility type, and availability
- **Responsive Design**: Mobile-first design with modern UI

### 🏢 Provider Dashboard
- **Facility Management**: Create and manage multiple facilities
- **Booking Management**: Handle bookings with status updates
- **Analytics Dashboard**: Track revenue, bookings, and facility performance
- **Team Management**: Invite and manage team members

### 👨‍💼 Admin Panel
- **Organization Management**: Oversee all organizations and facilities
- **User Management**: Manage users and permissions
- **System Analytics**: Platform-wide analytics and insights

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **UI Components**: Radix UI + Tailwind CSS
- **Internationalization**: next-intl
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd playmaker-nextjs
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/playmaker"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Email service (for notifications)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@playmaker.com"
```

5. Set up the database:
```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed the database with sample data
pnpm prisma db seed
```

6. Start the development server:
```bash
pnpm dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main entities:

- **Users**: System users with roles (admin, owner, user)
- **Organizations**: Facility provider organizations
- **Facilities**: Individual sports facilities
- **Bookings**: Facility reservations
- **Members**: Organization membership relationships

## API Endpoints

### Public Endpoints
- `GET /api/facilities` - List facilities with search/filter
- `POST /api/bookings` - Create new booking

### Protected Endpoints
- `PATCH /api/bookings/[id]` - Update booking status
- `GET /api/admin/organizations` - Admin organization management

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

1. Build the application:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

## Development

### Database Management

```bash
# View database in Prisma Studio
pnpm prisma studio

# Reset database (development only)
pnpm prisma migrate reset

# Deploy migrations to production
pnpm prisma migrate deploy
```

### Code Quality

```bash
# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Format code
pnpm format
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.
