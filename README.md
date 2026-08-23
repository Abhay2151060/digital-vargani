# Digital Vargani - Mandal Fund & Receipt Management Platform

Digital Vargani is a modern, full-stack monorepo application designed for managing Ganesh Utsav and Mandal funds, receipt generation, volunteer allocations, and expense analytics with Role-Based Access Control (RBAC).

---

## 🏗️ Monorepo Architecture

This project is built as a **Turborepo** monorepo:

```text
├── apps/
│   ├── api/          # NestJS REST API backend (Port 4000)
│   └── web/          # Next.js 14 App Router frontend (Port 3000)
├── packages/
│   └── db/           # Prisma ORM schema, migrations, & seed scripts
├── docker-compose.yml # PostgreSQL database container setup
└── turbo.json        # Turborepo task pipeline configuration
```

- **`apps/web`**: Responsive Next.js web portal supporting Admin, Volunteer, and Public views.
- **`apps/api`**: NestJS backend providing JWT authentication, RBAC authorization, transaction handling, and dashboard reporting.
- **`packages/db`**: Shared Prisma database package handling schema definitions, migrations, and seed scripts.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons
- **Backend**: NestJS, TypeScript, Passport JWT, Role-Based Access Control (RBAC)
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Monorepo Tooling**: Turborepo, npm workspaces
- **Containerization**: Docker Compose (PostgreSQL 14)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Optional, for running local PostgreSQL)

### 2. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/YOUR_USERNAME/digital-vargani.git
cd digital-vargani
npm install
```

### 3. Environment Configuration
Copy `.env.example` to create a local `.env` file:
```bash
cp .env.example .env
```

Review and adjust variables in `.env` if necessary:
```env
DATABASE_URL="postgresql://vargani_user:vargani_password@localhost:5432/vargani_db"
PORT=4000
NODE_ENV=development
JWT_SECRET=vargani-jwt-secret-key-2024-production-secure
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Database Setup & Seeding
Start the PostgreSQL container via Docker Compose (or use a local PostgreSQL instance):
```bash
docker-compose up -d
```

Run database migrations and seed default data (Admin & Volunteer credentials):
```bash
npm run db:setup
```

### 5. Running the Application
Start both the API server and Web application concurrently using Turborepo:
```bash
npm run dev
```

- **Web Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Backend**: [http://localhost:4000](http://localhost:4000)

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both Web and API in development mode concurrently |
| `npm run build` | Builds all applications and packages via Turborepo |
| `npm run test` | Runs test suites across all workspaces |
| `npm run lint` | Lints all code files across the monorepo |
| `npm run db:setup` | Configures database schema and seeds initial data |
| `npm run db:migrate` | Runs pending Prisma database migrations |
| `npm run db:seed` | Seeds database with initial test data |

---

## 🔐 License

This project is open-source and available under the [MIT License](LICENSE).
