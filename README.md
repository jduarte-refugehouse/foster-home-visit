# Home Visits Application

This is an internal application designed to manage home visits and related data. It provides functionalities for viewing homes, scheduling visits, and administrative tasks.

## Features

- **Dashboard**: A central hub for quick access to key application modules.
- **Homes Management**: View and manage details of registered homes.
- **Interactive Map**: Visualize home locations and plan routes.
- **Visit Scheduling**: Efficiently schedule and track home visits.
- **User Management**: Administer user accounts, roles, and permissions (Admin only).
- **Database Diagnostics**: Test and monitor database connection and proxy setup.
- **Static IP Proxy Setup**: Configure and verify proxy settings for secure database connections.

## Technical Stack

- **Next.js**: React framework for building the web application.
- **React**: Frontend library for building user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: Reusable UI components built with Tailwind CSS.
- **MSSQL**: Database for storing application data.
- **Fixie**: Static IP SOCKS5 proxy for secure database connections.
- **Leaflet**: JavaScript library for interactive maps.
- **mssql**: Node.js driver for Microsoft SQL Server.
- **socks**: SOCKS proxy client for Node.js.

## Getting Started

### 1. Environment Variables

Ensure you have the following environment variables configured in your Vercel project or `.env.local` file:

- `POSTGRES_USER`: Your database username.
- `POSTGRES_PASSWORD`: Your database password.
- `POSTGRES_DATABASE`: Your database name.
- `POSTGRES_HOST`: Your database host.
- `FIXIE_SOCKS_HOST`: Your Fixie SOCKS proxy URL (e.g., `socks://user:password@host:port`).

### 2. Database Setup

This application connects to an MSSQL database. Ensure your database is accessible and its firewall rules are configured to allow connections from your Fixie static IP.

The `lib/db.ts` file contains the connection logic, including a custom connector for the Fixie SOCKS proxy.

### 3. Running Locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Deployment

This application is designed for deployment on Vercel. Ensure your environment variables are correctly configured in your Vercel project settings.

## Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable React components.
- `lib/`: Utility functions, including database connection logic (`db.ts`).
- `public/`: Static assets like images.

## Troubleshooting

- **Database Connection Issues**:
  - Check your `POSTGRES_*` environment variables.
  - Verify your database firewall rules allow connections from Fixie's static IP.
  - Use the `/diagnostics` page in the application to test the database connection and proxy configuration.
- **Proxy Issues**:
  - Ensure `FIXIE_SOCKS_HOST` is correctly set in your environment variables.
  - Double-check the Fixie proxy URL format (`socks://user:password@host:port`).
  - Refer to the `/proxy-setup` and `/fixie-setup` pages for guidance.
- **Image Loading Errors**:
  - Ensure the `LOGO_SRC` path in `app/page.tsx` is correct and the image file exists in `public/images/`.

## Contributing

Feel free to contribute to this project by submitting issues or pull requests.
