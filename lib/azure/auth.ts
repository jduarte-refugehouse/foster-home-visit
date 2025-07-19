import { DefaultAzureCredential, ClientSecretCredential } from "@azure/identity"

export class AzureAuthService {
  private credential: DefaultAzureCredential | ClientSecretCredential

  constructor() {
    // Use DefaultAzureCredential for local development and managed identity in production
    if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID) {
      this.credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET,
      )
    } else {
      this.credential = new DefaultAzureCredential()
    }
  }

  async getAccessToken(scope = "https://database.windows.net/.default"): Promise<string> {
    try {
      const tokenResponse = await this.credential.getToken(scope)
      return tokenResponse.token
    } catch (error) {
      console.error("Failed to get access token:", error)
      throw error
    }
  }

  getCredential() {
    return this.credential
  }
}
