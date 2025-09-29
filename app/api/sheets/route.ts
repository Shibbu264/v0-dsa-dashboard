export async function GET(request: Request) {
  try {
    console.log("[v0] Starting Google Sheets fetch")
    const { searchParams } = new URL(request.url)
    const sheetUrl = searchParams.get("url")

    let sheetId = "1v1LaGp7clblCR8IzRDiFHfglV7B-I4sx3perKvCL5IE" // Default sheet ID
    https://docs.google.com/spreadsheets/d/1v1LaGp7clblCR8IzRDiFHfglV7B-I4sx3perKvCL5IE/view
    if (sheetUrl) {
      // Extract sheet ID from the provided URL
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        sheetId = match[1]
        console.log("[v0] Using custom sheet ID:", sheetId)
      }
    }

    const urlsToTry = [
          `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
    ]

    let csvText = ""
    let lastError = null

    for (const csvUrl of urlsToTry) {
      try {
        console.log("[v0] Trying URL:", csvUrl)

        const response = await fetch(csvUrl, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; DSA-Dashboard/1.0)",
          },
          redirect: "follow", // Explicitly follow redirects
        })

        console.log("[v0] Response status:", response.status)

        if (response.ok) {
          csvText = await response.text()
          console.log("[v0] Successfully fetched CSV, length:", csvText.length)
          break
        } else {
          console.log("[v0] Response not OK:", response.status, response.statusText)
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.log("[v0] Error with URL:", csvUrl, error)
        lastError = error
        continue
      }
    }

    if (!csvText) {
      throw lastError || new Error("Failed to fetch data from any URL")
    }

    console.log("[v0] First 200 chars:", csvText.substring(0, 200))

    // Improved CSV parsing function
    function parseCSV(text: string): string[][] {
      const result: string[][] = []
      const lines = text.split("\n")

      for (const line of lines) {
        if (!line.trim()) continue

        const row: string[] = []
        let current = ""
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
          const char = line[i]

          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Handle escaped quotes
              current += '"'
              i++ // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes
            }
          } else if (char === "," && !inQuotes) {
            // End of field
            row.push(current.trim())
            current = ""
          } else {
            current += char
          }
        }

        // Add the last field
        row.push(current.trim())
        result.push(row)
      }

      return result
    }

    const parsedData = parseCSV(csvText)
    console.log("[v0] Parsed rows:", parsedData.length)

    if (parsedData.length === 0) {
      throw new Error("No data found in the spreadsheet")
    }

    const headers = parsedData[0]
    console.log("[v0] Headers:", headers)

    const questions = parsedData
      .slice(1)
      .map((row, index) => {
        if (index < 5) {
          console.log(`[v0] Row ${index + 1}:`, row)
        }

        const question = {
          name: row[0] || "",
          platform: row[1] || "",
          link: row[2] || "",
          topic: row[3] || "",
          status: row[4] || "Pending",
          pinned: row[5] === "TRUE" || row[5] === "true" || false,
        }
        return question
      })
      .filter((question, index) => {
        const hasContent = question.name.trim() || question.platform.trim() || question.link.trim()
        if (!hasContent && index < 10) {
          console.log(`[v0] Filtering out empty question at index ${index}:`, question)
        }
        return hasContent
      })

    console.log("[v0] Processed questions:", questions.length)
    console.log("[v0] Sample question:", questions[0])

    if (questions.length > 5) {
      console.log("[v0] Last few questions:", questions.slice(-3))
    }

    return Response.json({ questions })
  } catch (error) {
    console.error("[v0] Error fetching Google Sheets data:", error)
    return Response.json(
      {
        error: "Failed to fetch data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
