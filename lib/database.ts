import sql from "mssql"

// Database connection configuration
const config: sql.config = {
  server: process.env.PGHOST || process.env.AZURE_SQL_SERVER || "",
  database: process.env.POSTGRES_DATABASE || process.env.AZURE_SQL_DATABASE || "",
  user: process.env.POSTGRES_USER || process.env.AZURE_SQL_USERNAME || "",
  password: process.env.POSTGRES_PASSWORD || process.env.AZURE_SQL_PASSWORD || "",
  port: Number.parseInt(process.env.POSTGRES_URL?.includes("5432") ? "5432" : "1433"),
  options: {
    encrypt: true, // Use encryption for Azure SQL
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    try {
      pool = new sql.ConnectionPool(config)
      await pool.connect()
      console.log("Database connected successfully")
    } catch (error) {
      console.error("Database connection failed:", error)
      throw error
    }
  }
  return pool
}

export async function executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  const connection = await getConnection()
  const request = connection.request()

  // Add parameters if provided
  if (params) {
    params.forEach((param, index) => {
      request.input(`param${index}`, param)
    })
  }

  const result = await request.query(query)
  return result.recordset
}

// Test database connection
export async function testConnection(): Promise<{ success: boolean; message: string; data?: any[] }> {
  try {
    const connection = await getConnection()
    const result = await connection.request().query("SELECT 1 as test, GETDATE() as current_time")
    return {
      success: true,
      message: "Database connection successful",
      data: result.recordset,
    }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Close connection pool
export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}
