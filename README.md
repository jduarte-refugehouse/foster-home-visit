# Family Visits Application

This is an internal application designed to streamline the management of family visits for social workers and agencies. It provides tools for managing homes, scheduling visits, and ensuring compliance with relevant regulations.

## Features

*   **Dashboard**: Overview of key metrics and quick access to main modules.
*   **Homes List**: Comprehensive list of all registered homes with detailed information.
*   **Homes Map**: Interactive map to visualize home locations and plan routes.
*   **Admin Panel**: Tools for administrative tasks, including user management.
*   **Visit Scheduling**: Efficiently schedule and track upcoming home visits.
*   **User Management**: Administer user accounts, roles, and permissions.
*   **Database Diagnostics**: Test and monitor database connectivity and proxy setup.
*   **Proxy Setup**: Configure and verify static IP proxy settings for secure connections.
*   **Connection Recipe**: View code and configuration for database connection.
*   **Coordinate Test**: Test access to coordinate data for homes.

## Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   pnpm (recommended package manager)
*   Access to an Azure SQL Database
*   Fixie SOCKS proxy credentials (if using a proxy)

### Environment Variables

Ensure you have the following environment variables configured in your `.env.local` file (for local development) and on Vercel (for deployment):

*   `POSTGRES_USER`: Your Azure SQL database username.
*   `POSTGRES_PASSWORD`: Your Azure SQL database password.
*   `POSTGRES_HOST`: Your Azure SQL server hostname.
*   `POSTGRES_DATABASE`: Your Azure SQL database name.
*   `FIXIE_SOCKS_HOST`: Your Fixie SOCKS proxy URL (e.g., `socks://username:password@host:port`).

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone <your-repo-url>
    cd foster-home-visit
    \`\`\`
2.  **Install dependencies:**
    \`\`\`bash
    pnpm install
    \`\`\`
3.  **Run the development server:**
    \`\`\`bash
    pnpm dev
    \`\`\`
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Deployment to Vercel

1.  **Ensure your `pnpm-lock.yaml` is up to date:**
    After making any changes to `package.json` (adding/removing/updating dependencies), always run `pnpm install` locally to regenerate `pnpm-lock.yaml`.
2.  **Commit your changes:**
    \`\`\`bash
    git add .
    git commit -m "Update project"
    git push
    \`\`\`
3.  **Deploy via Vercel CLI or Git Integration:**
    If connected to a Git repository, Vercel will automatically deploy on push.
    Alternatively, use the Vercel CLI:
    \`\`\`bash
    vercel --prod
    \`\`\`

## Project Structure

*   `app/`: Next.js App Router pages and API routes.
*   `components/`: Reusable React components (including shadcn/ui components).
*   `lib/db.ts`: Database connection logic, including Fixie proxy integration.
*   `public/images/`: Static assets like logos.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `app/globals.css`: Global CSS styles.

## Troubleshooting

*   **`ERR_PNPM_OUTDATED_LOCKFILE`**: This means your `pnpm-lock.yaml` file is not in sync with `package.json`. Run `pnpm install` locally, commit both files, and then redeploy.
*   **Database Connection Issues**: Check your environment variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`). Use the `/diagnostics` page in the app to test connectivity.
*   **Proxy Issues**: Ensure `FIXIE_SOCKS_HOST` is correctly formatted and accessible. Use the `/diagnostics` page to test the proxy connection.
