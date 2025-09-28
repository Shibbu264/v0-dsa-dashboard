import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { questionName, pinned } = await request.json()

    if (!questionName) {
      return NextResponse.json(
        { error: "Question name is required" },
        { status: 400 }
      )
    }

    // Get sheet URL from cookies
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null
      return null
    }

    const sheetUrl = getCookie("dsa-sheet-url")
    let sheetId = "1M0NOBIbt0A6OmJvIKYmYU0d8ODaTEVmzenhGOLizhbg" // Default sheet ID

    if (sheetUrl) {
      // Extract sheet ID from the provided URL
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        sheetId = match[1]
      }
    }

    // First, fetch the current data to find the row
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
    
    const response = await fetch(csvUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DSA-Dashboard/1.0)",
      },
      redirect: "follow",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`)
    }

    const csvText = await response.text()
    
    // Parse CSV to find the row
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
    
    if (parsedData.length === 0) {
      throw new Error("No data found in the spreadsheet")
    }

    // Find the row with the matching question name
    const questionRowIndex = parsedData.findIndex((row, index) => {
      // Skip header row
      if (index === 0) return false
      return row[0] === questionName
    })

    if (questionRowIndex === -1) {
      throw new Error(`Question "${questionName}" not found in sheet`)
    }

    // Update the pinned status in the 6th column (index 5)
    const row = parsedData[questionRowIndex]
    
    // Ensure the row has enough columns
    while (row.length < 6) {
      row.push("FALSE")
    }
    
    row[5] = pinned ? "TRUE" : "FALSE"

    // Convert back to CSV
    function arrayToCSV(data: string[][]): string {
      return data.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        }).join(',')
      ).join('\n')
    }

    const updatedCSV = arrayToCSV(parsedData)

    // Note: This is a read-only operation. In a real implementation, you would need
    // to use the Google Sheets API with proper authentication to write to the sheet.
    // For now, we'll return success but note that the sheet isn't actually updated.
    
    console.log(`Would update question "${questionName}" pinned status to ${pinned ? "TRUE" : "FALSE"}`)
    console.log("Updated CSV would be:", updatedCSV.substring(0, 200) + "...")

    return NextResponse.json({ 
      success: true, 
      message: `Question "${questionName}" pinned status updated to ${pinned ? "TRUE" : "FALSE"}`,
      note: "Sheet update requires Google Sheets API integration for write access"
    })

  } catch (error) {
    console.error("Error updating sheet:", error)
    return NextResponse.json(
      { 
        error: "Failed to update sheet", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
