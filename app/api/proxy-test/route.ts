import { NextResponse } from "next/server"
import { SocksProxyAgent } from "socks-proxy-agent"
import https from "https"

export async function GET() {
  const fixieUrl = process.env.FIXIE_SOCKS_HOST

  if (!fixieUrl) {
    return NextResponse.json(
      { success: false, message: "FIXIE_SOCKS_HOST environment variable is not set." },
      { status: 400 },
    )
  }

  try {
    const agent = new SocksProxyAgent(fixieUrl)

    const options = {
      hostname: "api.ipify.org", // A simple public API to get your IP
      port: 443,
      path: "?format=json",
      method: "GET",
      agent: agent,
    }

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => {
          try {
            const ipInfo = JSON.parse(data)
            resolve(NextResponse.json({ success: true, proxyIp: ipInfo.ip, message: "Proxy connection successful." }))
          } catch (parseError) {
            resolve(
              NextResponse.json(
                { success: false, error: "Failed to parse IP response from proxy target." },
                { status: 500 },
              ),
            )
          }
        })
      })

      req.on("error", (e) => {
        console.error("Proxy test request failed:", e)
        resolve(NextResponse.json({ success: false, error: `Proxy connection failed: ${e.message}` }, { status: 500 }))
      })

      req.end()
    })
  } catch (error: any) {
    console.error("Error setting up proxy agent:", error)
    return NextResponse.json(
      { success: false, error: `Failed to set up proxy agent: ${error.message}` },
      { status: 500 },
    )
  }
}
