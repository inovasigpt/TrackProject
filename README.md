# TrackProject

**TrackProject** is a modern Project Management Office (PMO) application designed to streamline project tracking, task management, and team collaboration. Built with a robust Monorepo architecture, it separates concerns between a high-performance Frontend and a scalable Backend.

## 🚀 Features

-   **Dashboard & Analytics**: Real-time project status and phase tracking.
-   **User Management**: Complete user lifecycle management with RBAC.
-   **Inbox System**: Integrated messaging and notification system.
-   **Project Timeline**: Visual timeline for ongoing projects.
-   **Modern UI/UX**: Responsive design with Dark/Light mode support.

## 🛠 Tech Stack

### Frontend (`apps/web`)
-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **State/Data**: React Hooks + Local Storage (migrating to API)

### Backend (`apps/api`)
-   **Runtime**: [Node.js](https://nodejs.org/) (Hono)
-   **Framework**: [Hono](https://hono.dev/)
-   **Database**: PostgreSQL
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **Authentication**: JWT & Bcrypt

## 📋 Prerequisites

Ensure you have the following installed:
-   **Node.js** (v18 or higher)
-   **pnpm** (preferred package manager)
-   **PostgreSQL** (Active database instance)

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/inovasigpt/TrackProject.git
    cd TrackProject
    ```

2.  **Install Dependencies**
    ```bash
    pnpm install
    ```

3.  **Environment Configuration**

    Create `.env` files in both `apps/web` and `apps/api` based on `.env.example` (if available) or use the following template:

    **`apps/api/.env`**
    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/trackproject
    JWT_SECRET=your_super_secret_key
    PORT=3000
    ```

    **`apps/web/.env`**
    ```env
    VITE_API_URL=http://localhost:3000
    ```

4.  **Database Setup**
    Navigate to the api folder and run migrations:
    ```bash
    cd apps/api
    pnpm db:generate
    pnpm db:migrate
    # Optional: Seed initial data
    # pnpm run seed
    ```

## 🚀 Running the Application

You can run both the frontend and backend concurrently from the root (if workspace scripts are configured) or individually.

### Run Frontend
```bash
# In one terminal
cd apps/web
pnpm dev
```
> Frontend will be available at `http://localhost:5173`

### Run Backend
```bash
# In another terminal
cd apps/api
pnpm dev
```
> Backend API will be available at `http://localhost:3000`

## 🤝 Contributing

1.  Checkout the `feature/fe-be-separation` branch.
2.  Make your changes.
3.  Commit and push to the repository.
