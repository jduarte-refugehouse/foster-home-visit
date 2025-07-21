import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .query("SELECT CLIENT_NET_ADDRESS FROM SYS.DM_EXEC_CONNECTIONS WHERE SESSION_ID = @@SPID")
    const clientIp = result.recordset[0].CLIENT_NET_ADDRESS

    // In a real application, you would add this IP to your Azure SQL Firewall
    // This is a placeholder for demonstration purposes.
    console.log(`Current client IP address: ${clientIp}. You would add this to your Azure SQL firewall.`)

    return NextResponse.json({
      success: true,
      ipAddress: clientIp,
      message: "IP address retrieved. Add this to your Azure SQL firewall.",
    })
  } catch (error: any) {
    console.error("Error getting client IP:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log("=== 🔧 Adding current IP to firewall recommendations ===")

    // Get current IP
    let currentIP = "Unknown"
    try {
      const pool = await getConnection()
      const result = await pool
        .request()
        .query("SELECT CLIENT_NET_ADDRESS FROM SYS.DM_EXEC_CONNECTIONS WHERE SESSION_ID = @@SPID")
      currentIP = result.recordset[0].CLIENT_NET_ADDRESS
      console.log("Current IP detected:", currentIP)
    } catch (error) {
      console.error("Failed to get current IP:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to detect current IP address",
        },
        { status: 500 },
      )
    }

    // Generate Azure CLI commands to add the IP
    const azureCliCommands = [
      `# Add current Vercel IP to Azure SQL firewall`,
      `az sql server firewall-rule create \\`,
      `  --resource-group "your-resource-group" \\`,
      `  --server "refugehouse-bifrost-server" \\`,
      `  --name "Vercel-Current-${new Date().toISOString().split("T")[0]}" \\`,
      `  --start-ip-address "${currentIP}" \\`,
      `  --end-ip-address "${currentIP}"`,
      ``,
      `# Or use PowerShell:`,
      `New-AzSqlServerFirewallRule \\`,
      `  -ResourceGroupName "your-resource-group" \\`,
      `  -ServerName "refugehouse-bifrost-server" \\`,
      `  -FirewallRuleName "Vercel-Current-${new Date().toISOString().split("T")[0]}" \\`,
      `  -StartIpAddress "${currentIP}" \\`,
      `  -EndIpAddress "${currentIP}"`,
    ]

    // Generate manual steps for Azure Portal
    const manualSteps = [
      `1. Go to Azure Portal → SQL Server → refugehouse-bifrost-server → Networking`,
      `2. Click "Add your client IPv4 address (${currentIP})"`,
      `3. Or manually add a firewall rule:`,
      `   - Rule name: Vercel-Current-${new Date().toISOString().split("T")[0]}`,
      `   - Start IP: ${currentIP}`,
      `   - End IP: ${currentIP}`,
      `4. Click "Save"`,
      `5. Wait 2-3 minutes for changes to take effect`,
    ]

    return NextResponse.json({
      success: true,
      currentIP,
      timestamp: new Date().toISOString(),
      azureCliCommands,
      manualSteps,
      message: `Current IP ${currentIP} needs to be added to Azure SQL firewall`,
    })
  } catch (error) {
    console.error("Failed to generate IP management commands:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
