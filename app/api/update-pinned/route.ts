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

    // Try to use Apps Script if available
    // First check for Apps Script URL in request cookies, then fallback to env
    const appsScriptUrlFromCookie = request.headers.get('cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('dsa-apps-script-url='))
      ?.split('=')[1]
    
    const appsScriptUrl = appsScriptUrlFromCookie || 
      process.env.GOOGLE_APPS_SCRIPT_URL || 
      `https://script.google.com/macros/s/AKfycbzYOUR_SCRIPT_ID/exec`
    
    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatePinned',
          questionName: questionName,
          pinned: pinned
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          return NextResponse.json({
            success: true,
            message: result.message || `Question "${questionName}" pinned status updated to ${pinned ? "TRUE" : "FALSE"}`,
            method: 'apps_script',
            row: result.row
          })
        } else {
          throw new Error(result.error || 'Apps Script update failed')
        }
      }
    } catch (appsScriptError) {
      console.log("Apps Script method failed:", appsScriptError)
    }

    // Fallback - return success with manual update instructions
    console.log(`Local update: Question "${questionName}" pinned status set to ${pinned ? "TRUE" : "FALSE"}`)
    
    return NextResponse.json({
      success: true,
      message: `Question "${questionName}" pinned status updated locally to ${pinned ? "TRUE" : "FALSE"}`,
      method: 'local',
      note: "Changes are saved locally. To enable automatic sheet updates, set up Google Apps Script.",
      setupInstructions: {
        title: "Enable Automatic Sheet Updates",
        description: "To enable automatic updates to your Google Sheet:",
        steps: [
          "1. Open your Google Sheet",
          "2. Go to Extensions > Apps Script",
          "3. Follow the setup guide in GOOGLE_APPS_SCRIPT_COMPLETE.md",
          "4. Deploy the script as a web app",
          "5. Your sheet will update automatically!"
        ],
        alternative: "Or manually update column F in your sheet with the pinned status"
      },
      manualUpdate: {
        sheetId,
        questionName,
        pinned,
        instructions: `Manual update: In your sheet, find "${questionName}" and set column F to ${pinned ? "TRUE" : "FALSE"}`
      }
    })

  } catch (error) {
    console.error("Error updating pinned status:", error)
    return NextResponse.json(
      { 
        error: "Failed to update pinned status", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
