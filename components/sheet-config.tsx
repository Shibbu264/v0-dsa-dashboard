"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, Save, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SheetConfigProps {
  onSheetUrlChange: (url: string) => void
  embedded?: boolean
}

export function SheetConfig({ onSheetUrlChange, embedded = false }: SheetConfigProps) {
  const [sheetUrl, setSheetUrl] = useState("")
  const [appsScriptUrl, setAppsScriptUrl] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load saved sheet URL from cookies
    const savedUrl = getCookie("dsa-sheet-url")
    if (savedUrl) {
      setSheetUrl(savedUrl)
    }
    // Always leave input blank if no saved URL exists

    // Load saved Apps Script URL from cookies
    const savedAppsScriptUrl = getCookie("dsa-apps-script-url")
    if (savedAppsScriptUrl) {
      setAppsScriptUrl(savedAppsScriptUrl)
    }
  }, [])

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null
    return null
  }

  const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof document === "undefined") return
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  const handleSave = () => {
    if (!sheetUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Sheets URL",
        variant: "destructive",
      })
      return
    }

    const sheetId = extractSheetId(sheetUrl)
    if (!sheetId) {
      toast({
        title: "Error",
        description: "Invalid Google Sheets URL format",
        variant: "destructive",
      })
      return
    }

    // Save sheet URL to cookies
    setCookie("dsa-sheet-url", sheetUrl, 365)
    
    // Save Apps Script URL to cookies if provided
    if (appsScriptUrl.trim()) {
      setCookie("dsa-apps-script-url", appsScriptUrl, 365)
    }

    // Notify parent component
    onSheetUrlChange(sheetUrl)

    if (!embedded) {
      setIsOpen(false)
    }
    toast({
      title: "Success",
      description: "Configuration saved successfully!",
    })
  }

  const getCurrentSheetId = () => {
    const savedUrl = getCookie("dsa-sheet-url")
    return savedUrl ? extractSheetId(savedUrl) : null
  }

  const content = (
    <div className="space-y-6 p-1">
      {!embedded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Sheet ID:{" "}
                <code className="bg-muted px-2 py-1 rounded text-xs">{getCurrentSheetId() || "Not configured"}</code>
              </p>
              {getCookie("dsa-sheet-url") ? (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <a
                    href={getCookie("dsa-sheet-url") || ""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View Current Sheet
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
                      📋 Setup Instructions
                    </h4>
                    <div className="text-xs text-blue-800 dark:text-blue-200 space-y-2">
                      <p>To get started, you need to create your own copy of the DSA questions sheet:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Click the link below to open the template sheet</li>
                        <li>Click "File" → "Make a copy" to create your own copy</li>
                        <li>Make sure your copy is set to "Anyone with the link can view"</li>
                        <li>Copy the URL of your new sheet and paste it in the input below</li>
                      </ol>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <a
                      href="https://docs.google.com/spreadsheets/d/1v1LaGp7clblCR8IzRDiFHfglV7B-I4sx3perKvCL5IE/edit?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium break-all"
                    >
                      Open Template Sheet →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">🚀 Enable Full Automation (Recommended)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set up Google Apps Script to enable automatic updates, question addition, and real-time sync with your Google Sheet.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                📋 Step-by-Step Setup Instructions
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <div className="space-y-1">
                  <p><strong>Step 1:</strong> Open your Google Sheet</p>
                  <p><strong>Step 2:</strong> Go to <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Extensions</code> → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Apps Script</code></p>
                  <p><strong>Step 3:</strong> Delete any existing code and paste the Apps Script code (see below)</p>
                  <p><strong>Step 4:</strong> Click <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Deploy</code> → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">New deployment</code></p>
                  <p><strong>Step 5:</strong> Choose <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Web app</code> as type</p>
                  <p><strong>Step 6:</strong> Set <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Execute as: Me</code> and <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Who has access: Anyone</code></p>
                  <p><strong>Step 7:</strong> Click <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Deploy</code> and copy the web app URL</p>
                  <p><strong>Step 8:</strong> Add the URL to your environment variables as <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">GOOGLE_APPS_SCRIPT_URL</code></p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                📝 Apps Script Code
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Copy the complete Apps Script code from the setup guide and paste it into your Apps Script editor.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const code = `function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'addQuestion':
        return addQuestion(sheet, data);
      case 'updatePinned':
        return updatePinned(sheet, data);
      case 'updateStatus':
        return updateStatus(sheet, data);
      default:
        return createResponse({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function addQuestion(sheet, data) {
  const { name, platform, link, topic, status, pinned } = data;
  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;
  
  sheet.getRange(newRow, 1).setValue(name);
  sheet.getRange(newRow, 2).setValue(platform);
  sheet.getRange(newRow, 3).setValue(link);
  sheet.getRange(newRow, 4).setValue(topic);
  sheet.getRange(newRow, 5).setValue(status);
  sheet.getRange(newRow, 6).setValue(pinned);
  
  return createResponse({ success: true, message: \`Question "\${name}" added successfully\`, row: newRow });
}

function updatePinned(sheet, data) {
  const { questionName, pinned } = data;
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === questionName) {
      sheet.getRange(i + 1, 6).setValue(pinned ? 'TRUE' : 'FALSE');
      return createResponse({ success: true, message: \`Pinned status updated for "\${questionName}"\`, row: i + 1 });
    }
  }
  
  return createResponse({ success: false, error: \`Question "\${questionName}" not found\` });
}

function updateStatus(sheet, data) {
  const { questionName, status } = data;
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === questionName) {
      sheet.getRange(i + 1, 5).setValue(status);
      return createResponse({ success: true, message: \`Status updated for "\${questionName}"\`, row: i + 1 });
    }
  }
  
  return createResponse({ success: false, error: \`Question "\${questionName}" not found\` });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;
                    navigator.clipboard.writeText(code);
                    // You could add a toast notification here if you have a toast system
                  }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Code
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Click to copy the complete Apps Script code
                </span>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ✅ What This Enables
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Full automation:</strong> Add questions, toggle status/pinned with clicks, real-time sync with your Google Sheet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <Label htmlFor="sheet-url">Google Sheets URL</Label>
          <Input
            id="sheet-url"
            type="url"
            placeholder="https://docs.google.com/..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Make sure your Google Sheet is publicly accessible (Anyone with the link can view)
          </p>
        </div>

        <div>
          <Label htmlFor="apps-script-url">Apps Script URL (Optional)</Label>
          <Input
            id="apps-script-url"
            type="url"
            placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
            value={appsScriptUrl}
            onChange={(e) => setAppsScriptUrl(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter your deployed Apps Script web app URL for full automation
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Expected Sheet Format:</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Column A: Problem Name</p>
            <p>Column B: Platform (e.g., LeetCode, HackerRank)</p>
            <p>Column C: Link (Problem URL)</p>
            <p>Column D: Topic (e.g., Arrays, Dynamic Programming)</p>
            <p>Column E: Status (Solved, Pending, etc.)</p>
          </div>
        </div>

        {!embedded && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Configure Google Sheets Data Source</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="pb-20">
            {content}
          </div>
        </div>
        
        {/* Floating Save Button */}
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
