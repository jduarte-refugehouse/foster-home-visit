import sql from "mssql"
import { SocksProxyAgent } from "socks-proxy-agent"

// This function parses the Fixie SOCKS proxy URL and returns the host, port, username, and password.
// It supports URLs like "socks://user:password@host:port" or "socks5://host:port".
function parseFixieUrl(fixieUrl: string) {
  const match = fixieUrl.match(/^(?:socks(?:5|4)?:\/\/)?([^:]+):([^@]+)@([^:]+):(\d+)/)
  if (!match) {
    throw new Error("Invalid Fixie URL format. Expected socks://user:password@host:port")
  }
  const [, username, password, host, port] = match
  return { username, password, host, port: Number.parseInt(port, 10) }
}

// Connection configuration for Azure SQL Database
const config: sql.config = {
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  server: process.env.POSTGRES_HOST || "localhost", // You might need to adjust this for Azure SQL
  database: process.env.POSTGRES_DATABASE,
  options: {
    encrypt: true, // Use true for Azure SQL Database to enforce encryption
    trustServerCertificate: false, // Change to true for local dev / self-signed certs
  },
}

// If FIXIE_SOCKS_HOST is provided, configure the agent
if (process.env.FIXIE_SOCKS_HOST) {
  try {
    const { username, password, host, port } = parseFixieUrl(process.env.FIXIE_SOCKS_HOST)
    const proxy = `socks://${username}:${password}@${host}:${port}`
    const agent = new SocksProxyAgent(proxy)

    // This is a custom property to pass the agent to mssql.
    // mssql's tedious driver supports an 'agent' option for proxying.
    ;(config as any).options.agent = agent
    console.log("Using Fixie SOCKS proxy for database connection.")
  } catch (error) {
    console.error("Failed to parse FIXIE_SOCKS_HOST or create proxy agent:", error)
    // Decide whether to throw or continue without proxy
    // For now, we'll log and let the connection attempt proceed without proxy if parsing fails
  }
} else {
  console.log("FIXIE_SOCKS_HOST not set. Connecting directly to the database.")
}

let pool: sql.ConnectionPool | null = null

export async function getConnection() {
  if (pool && pool.connected) {
    return pool
  }

  try {
    pool = await sql.connect(config)
    console.log("Database connected successfully!")
    return pool
  } catch (err) {
    console.error("Database connection failed:", err)
    throw err
  }
}

export async function closeConnection() {
  if (pool && pool.connected) {
    await pool.close()
    console.log("Database connection closed.")
  }
}
