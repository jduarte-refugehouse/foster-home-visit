import { SecretClient } from "@azure/keyvault-secrets"
import { ClientSecretCredential } from "@azure/identity"

export class KeyVaultService {
  private client: SecretClient
  private credential: ClientSecretCredential

  constructor() {
    // Create credential using environment variables
    this.credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!,
    )

    // Create Key Vault client
    const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`
    this.client = new SecretClient(vaultUrl, this.credential)
  }

  // Get database connection string
  async getConnectionString(): Promise<string> {
    const secret = await this.client.getSecret("v0-db-connection-string")
    return secret.value || ""
  }

  // Get Clerk secret key
  async getClerkSecretKey(): Promise<string> {
    const secret = await this.client.getSecret("clerk-secret-key")
    return secret.value || ""
  }

  // Get any secret by name
  async getSecret(secretName: string): Promise<string> {
    try {
      const secret = await this.client.getSecret(secretName)
      return secret.value || ""
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error)
      throw error
    }
  }

  // Set a secret (useful for configuration management)
  async setSecret(secretName: string, secretValue: string): Promise<void> {
    try {
      await this.client.setSecret(secretName, secretValue)
      console.log(`Secret ${secretName} set successfully`)
    } catch (error) {
      console.error(`Failed to set secret ${secretName}:`, error)
      throw error
    }
  }

  // List all secrets (for admin purposes)
  async listSecrets(): Promise<string[]> {
    try {
      const secretNames: string[] = []
      for await (const secretProperties of this.client.listPropertiesOfSecrets()) {
        secretNames.push(secretProperties.name)
      }
      return secretNames
    } catch (error) {
      console.error("Failed to list secrets:", error)
      throw error
    }
  }

  // Get secret with metadata
  async getSecretWithMetadata(secretName: string) {
    try {
      const secret = await this.client.getSecret(secretName)
      return {
        name: secret.name,
        value: secret.value,
        properties: {
          createdOn: secret.properties.createdOn,
          updatedOn: secret.properties.updatedOn,
          enabled: secret.properties.enabled,
          expiresOn: secret.properties.expiresOn,
        },
      }
    } catch (error) {
      console.error(`Failed to get secret metadata for ${secretName}:`, error)
      throw error
    }
  }
}
