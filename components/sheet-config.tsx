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
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load saved sheet URL from cookies
    const savedUrl = getCookie("dsa-sheet-url")
    if (savedUrl) {
      setSheetUrl(savedUrl)
    }
    // Always leave input blank if no saved URL exists
  }, [])

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null
    return null
  }

  const setCookie = (name: string, value: string, days: number) => {
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

    // Save to cookies
    setCookie("dsa-sheet-url", sheetUrl, 365)

    // Notify parent component
    onSheetUrlChange(sheetUrl)

    if (!embedded) {
      setIsOpen(false)
    }
    toast({
      title: "Success",
      description: "Sheet URL saved successfully!",
    })
  }

  const getCurrentSheetId = () => {
    const savedUrl = getCookie("dsa-sheet-url")
    return savedUrl ? extractSheetId(savedUrl) : null
  }

  const content = (
    <div className="space-y-6">
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
              {getCookie("dsa-sheet-url") && (
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
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="sheet-url">Google Sheets URL</Label>
          <Input
            id="sheet-url"
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Make sure your Google Sheet is publicly accessible (Anyone with the link can view)
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

        <div className="flex justify-end gap-2">
          {!embedded && (
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Google Sheets Data Source</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
