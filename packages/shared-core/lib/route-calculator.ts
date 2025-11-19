/**
 * Calculate driving distance and toll information using Google Routes API
 * Returns object with distance (miles) and estimated toll cost (USD), or null if calculation fails
 */
export async function calculateDrivingDistance(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): Promise<{ distance: number; estimatedTollCost: number | null } | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error("❌ [ROUTE] Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
      return null
    }

    // Call Google Routes API (replaces Directions API)
    const url = `https://routes.googleapis.com/directions/v2:computeRoutes`

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: startLat,
            longitude: startLng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: endLat,
            longitude: endLng,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      extraComputations: ["TOLLS"],
      routeModifiers: {
        vehicleInfo: {
          emissionType: "GASOLINE",
        },
        tollPasses: ["US_TX_TXTAG", "US_TX_EZTAG"], // Texas toll passes
      },
      units: "IMPERIAL",
    }

    console.log("🚗 [ROUTE] Calculating driving distance with tolls:", {
      origin: `${startLat},${startLng}`,
      destination: `${endLat},${endLng}`,
    })

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error("❌ [ROUTE] Google Routes API HTTP error:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("❌ [ROUTE] Error response body:", errorText)
      return null
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      console.error("❌ [ROUTE] Google Routes API returned no routes:", JSON.stringify(data, null, 2))
      return null
    }

    // Extract distance and toll information from first route
    const route = data.routes[0]
    const distanceInMeters = route.distanceMeters
    const distanceInMiles = distanceInMeters * 0.000621371 // Convert meters to miles

    // Extract toll information
    let estimatedTollCost: number | null = null
    if (route.travelAdvisory?.tollInfo) {
      const tollInfo = route.travelAdvisory.tollInfo
      // tollInfo.estimatedPrice contains array of price objects with currencyCode and units
      if (tollInfo.estimatedPrice && tollInfo.estimatedPrice.length > 0) {
        const price = tollInfo.estimatedPrice[0]
        // Convert from micros (price.units) to dollars
        estimatedTollCost = price.units ? price.units / 1000000 : null
        if (price.nanos) {
          estimatedTollCost = (estimatedTollCost || 0) + price.nanos / 1000000000
        }
      }
    }

    console.log("✅ [ROUTE] Calculated distance and tolls:", {
      meters: distanceInMeters,
      miles: distanceInMiles.toFixed(2),
      estimatedTollCost: estimatedTollCost ? `$${estimatedTollCost.toFixed(2)}` : "No tolls",
      duration: route.duration,
    })

    return {
      distance: Math.round(distanceInMiles * 100) / 100, // Round to 2 decimal places
      estimatedTollCost: estimatedTollCost ? Math.round(estimatedTollCost * 100) / 100 : null, // Round to 2 decimal places
    }
  } catch (error) {
    console.error("❌ [ROUTE] Error calculating driving distance:", error)
    return null
  }
}

