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
    let sheetId = "1v1LaGp7clblCR8IzRDiFHfglV7B-I4sx3perKvCL5IE" // Default sheet ID

    if (sheetUrl) {
      // Extract sheet ID from the provided URL
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        sheetId = match[1]
      }
    }

    // For now, we'll return a response that indicates the user needs to manually update
    // This is a temporary solution until Google Sheets API is properly configured
    
    console.log(`Would update question "${questionName}" pinned status to ${pinned ? "TRUE" : "FALSE"}`)
    console.log(`Sheet ID: ${sheetId}`)

    return NextResponse.json({ 
      success: true, 
      message: `Question "${questionName}" pinned status updated locally to ${pinned ? "TRUE" : "FALSE"}`,
      note: "To enable automatic sheet updates, please set up Google Sheets API authentication. See GOOGLE_SHEETS_SETUP.md for instructions.",
      manualUpdate: {
        sheetId,
        questionName,
        pinned,
        instructions: "You can manually update the sheet by opening it and changing the 'F' column for this question to " + (pinned ? "TRUE" : "FALSE")
      }
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
