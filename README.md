# MyQuery.AI Freelancer Timesheet

A comprehensive timesheet management application built for freelancers to track time spent on projects, manage clients, and generate reports.

## Features

- **Time Tracking**: Log hours worked on different projects
- **Client Management**: Organize projects by client
- **Project Dashboard**: View all ongoing projects and their status
- **Authentication**: Secure user accounts and data
- **Reports**: Generate time and billing reports

## Tech Stack

- **Framework**: [Next.js 13](https://nextjs.org/) with TypeScript
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with Neon Postgres
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **UI**: [Radix UI](https://www.radix-ui.com/) components styled with [Tailwind CSS](https://tailwindcss.com/)
- **Data Visualization**: [TanStack Table](https://tanstack.com/table)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PNPM package manager (recommended)
- PostgreSQL database (or Neon serverless Postgres)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd freelancer-timesheet
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
# Database
DATABASE_URL=your_postgres_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Set up the database:
```bash
# Push schema to database
pnpm db:push

# Apply migrations
pnpm apply-migration
```

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Database Management

- **Studio**: View your database with `pnpm db:studio`
- **Migrations**: Generate migrations with `pnpm generate-migration`
- **Apply Migrations**: Apply migrations with `pnpm apply-migration`

## Deployment

The application can be deployed to any platform that supports Next.js applications, such as Vercel, Netlify, or a self-hosted server.

## License

This project is licensed under the MIT License - see the LICENSE file for details.