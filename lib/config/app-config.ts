import { KeyVaultService } from "@/lib/azure/keyvault-service"

export class AppConfig {
  private keyVaultService: KeyVaultService
  private configCache: Map<string, { value: string; timestamp: number }> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.keyVaultService = new KeyVaultService()
  }

  // Get configuration with caching
  private async getCachedConfig(key: string, secretName: string): Promise<string> {
    const cached = this.configCache.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < this.cacheTimeout) {
      return cached.value
    }

    try {
      const value = await this.keyVaultService.getSecret(secretName)
      this.configCache.set(key, { value, timestamp: now })
      return value
    } catch (error) {
      // Fallback to environment variables
      const envValue = process.env[key]
      if (envValue) {
        console.warn(`Using environment variable fallback for ${key}`)
        return envValue
      }
      throw error
    }
  }

  // Database configuration
  async getDatabaseConnectionString(): Promise<string> {
    return this.getCachedConfig("DATABASE_CONNECTION_STRING", "v0-db-connection-string")
  }

  // Clerk configuration
  async getClerkSecretKey(): Promise<string> {
    return this.getCachedConfig("CLERK_SECRET_KEY", "clerk-secret-key")
  }

  // Custom application secrets
  async getAppSecret(secretName: string): Promise<string> {
    return this.keyVaultService.getSecret(secretName)
  }

  // Clear cache (useful for testing or forced refresh)
  clearCache(): void {
    this.configCache.clear()
  }

  // Get all configuration status
  async getConfigStatus(): Promise<{
    keyVaultConnected: boolean
    secretsCount: number
    cacheSize: number
  }> {
    try {
      const secrets = await this.keyVaultService.listSecrets()
      return {
        keyVaultConnected: true,
        secretsCount: secrets.length,
        cacheSize: this.configCache.size,
      }
    } catch (error) {
      return {
        keyVaultConnected: false,
        secretsCount: 0,
        cacheSize: this.configCache.size,
      }
    }
  }
}

// Singleton instance
export const appConfig = new AppConfig()
