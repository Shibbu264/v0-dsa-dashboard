"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Eye, Loader2, CheckCircle, Clock, RefreshCw, Shuffle, Search, Pin, PinOff, Plus, Github, Settings, Save } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SheetConfig } from "@/components/sheet-config"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DSAQuestion {
  name: string
  platform: string
  link: string
  topic: string
  status: string
  pinned: boolean
}

interface Solution {
  questionLink: string
  description: string
  inputOutput: string
  approach: string
  cppSolution: string
}

export function DSADashboard() {
  const [questions, setQuestions] = useState<DSAQuestion[]>([])
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null)
  const [loadingSolution, setLoadingSolution] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false)
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({})
  const [localPinned, setLocalPinned] = useState<Record<string, boolean>>({})
  const [highlightedQuestion, setHighlightedQuestion] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<DSAQuestion | null>(null)
  const [searchResults, setSearchResults] = useState<{
    suggestedQuestion: string | null
    explanation: string
    alternativeMatches: string[]
  } | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [questionInput, setQuestionInput] = useState("")
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showAppsScriptSettings, setShowAppsScriptSettings] = useState(false)
  const [appsScriptUrl, setAppsScriptUrl] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const saved = localStorage.getItem("dsa-question-statuses")
    if (saved) {
      setLocalStatuses(JSON.parse(saved))
    }
    
    const savedPinned = localStorage.getItem("dsa-question-pinned")
    if (savedPinned) {
      setLocalPinned(JSON.parse(savedPinned))
    }

    // Check if sheet URL cookie exists, if not show config dialog
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null
      return null
    }

    const sheetUrl = getCookie("dsa-sheet-url")
    if (!sheetUrl) {
      setShowConfigDialog(true)
    }

    // Load Apps Script URL from cookies
    const savedAppsScriptUrl = getCookie("dsa-apps-script-url")
    if (savedAppsScriptUrl) {
      setAppsScriptUrl(savedAppsScriptUrl)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("dsa-question-statuses", JSON.stringify(localStatuses))
  }, [localStatuses])

  useEffect(() => {
    localStorage.setItem("dsa-question-pinned", JSON.stringify(localPinned))
  }, [localPinned])

  useEffect(() => {
    fetchQuestions()
  }, [])

  // Cleanup dialog state when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      // Small delay to allow dialog close animation
      const timer = setTimeout(() => {
        setSelectedSolution(null)
        setCurrentQuestion(null)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isDialogOpen])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true)
      console.log("[v0] Starting to fetch questions")

      // Get sheet URL from cookies
      const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null
        return null
      }

      const sheetUrl = getCookie("dsa-sheet-url")
      console.log("[v0] Sheet URL from cookie:", sheetUrl)

      const apiUrl = `/api/sheets${sheetUrl ? `?url=${encodeURIComponent(sheetUrl)}` : ""}`
      console.log("[v0] API URL:", apiUrl)

      const response = await fetch(apiUrl)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] API Error:", errorData)
        throw new Error(`Failed to fetch questions: ${errorData.details || response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Received data:", data)

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid data format received from API")
      }

      setQuestions(data.questions)
      console.log("[v0] Questions set successfully:", data.questions.length)
    } catch (error) {
      console.error("[v0] Error fetching questions:", error)
      // Show a more helpful error message
      setQuestions([])
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleSheetUrlChange = (url: string) => {
    // Refresh questions when sheet URL changes
    fetchQuestions()
    // Close the auto-shown config dialog
    setShowConfigDialog(false)
  }

  // Helper function to open Google Sheet
  const openGoogleSheet = () => {
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

    // Create simple URL that opens the sheet
    const sheetUrlToOpen = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
    
    // Open in new tab
    window.open(sheetUrlToOpen, '_blank')
  }

  const toggleStatus = async (questionName: string, currentStatus: string) => {
    const newStatus = currentStatus.toLowerCase() === "solved" ? "Pending" : "Solved"
    
    // Optimistically update the UI immediately
    setLocalStatuses((prev) => ({
      ...prev,
      [questionName]: newStatus,
    }))
    
    try {
      const response = await fetch("/api/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionName: questionName,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      const result = await response.json()
      console.log("Status update result:", result)
      
    } catch (error) {
      console.error("Error updating status:", error)
      
      // Revert the optimistic update on error
      setLocalStatuses((prev) => ({
        ...prev,
        [questionName]: currentStatus,
      }))
      
      // Show error toast
      const { toast } = require("@/hooks/use-toast")
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const togglePinned = async (questionName: string, currentPinned: boolean) => {
    const newPinnedStatus = !currentPinned
    
    // Optimistically update the UI immediately
    setLocalPinned((prev) => ({
      ...prev,
      [questionName]: newPinnedStatus,
    }))
    
    try {
      const response = await fetch("/api/update-pinned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionName: questionName,
          pinned: newPinnedStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update pinned status")
      }

      const result = await response.json()
      console.log("Pinned update result:", result)
      
    } catch (error) {
      console.error("Error updating pinned status:", error)
      
      // Revert the optimistic update on error
      setLocalPinned((prev) => ({
        ...prev,
        [questionName]: currentPinned,
      }))
      
      // Show error toast
      const { toast } = require("@/hooks/use-toast")
      toast({
        title: "Error",
        description: "Failed to update pinned status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getEffectiveStatus = (question: DSAQuestion) => {
    return localStatuses[question.name] || question.status
  }

  const getEffectivePinned = (question: DSAQuestion) => {
    return localPinned[question.name] !== undefined ? localPinned[question.name] : question.pinned
  }

  const handleAddQuestion = async () => {
    if (!questionInput.trim()) return

    setAddingQuestion(true)
    try {
      const response = await fetch("/api/add-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionInput: questionInput.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add question")
      }

      const newQuestion = await response.json()
      
      if (newQuestion.method === 'apps_script') {
        // Question was added to Google Sheet, refresh the data
        console.log("Question added to Google Sheet:", newQuestion)
        // Refresh questions from the sheet
        fetchQuestions()
      } else {
        // Add the new question to the local state only
        setQuestions(prev => [newQuestion, ...prev])
        
        // Set the question as pinned locally
        setLocalPinned(prev => ({
          ...prev,
          [newQuestion.name]: true
        }))
        
        console.log("Question added locally:", newQuestion)
      }
      
      // Clear the input and close dialog
      setQuestionInput("")
      setIsAddQuestionDialogOpen(false)
      
      // Highlight the new question
      setHighlightedQuestion(newQuestion.name)
      setTimeout(() => {
        setHighlightedQuestion(null)
      }, 3000)
      
    } catch (error) {
      console.error("Error adding question:", error)
      alert("Failed to add question. Please try again.")
    } finally {
      setAddingQuestion(false)
    }
  }

  const fetchSolution = useCallback(async (question: DSAQuestion) => {
    setLoadingSolution(true)
    setCurrentQuestion(question)
    setSelectedSolution(null) // Clear previous solution for better UX
    setIsDialogOpen(true)

    try {
      const response = await fetch("/api/get-solution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionName: question.name,
          questionLink: question.link,
          platform: question.platform,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch solution")
      }

      const solution = await response.json()
      setSelectedSolution(solution)
    } catch (error) {
      console.error("Error fetching solution:", error)
      setSelectedSolution({
        questionLink: question.link,
        description: "Unable to fetch solution at this time. Please check your Gemini API configuration.",
        inputOutput: "N/A",
        approach: "N/A",
        cppSolution: "// Solution unavailable",
      })
    } finally {
      setLoadingSolution(false)
    }
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchQuery("")
      setSearchResults(null)
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    setSearchQuery(query)

    try {
      const response = await fetch("/api/search-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          questions: questions.map(q => ({
            name: q.name,
            topic: q.topic,
            platform: q.platform
          }))
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to search questions")
      }

      const searchResult = await response.json()
      setSearchResults(searchResult)
      setShowSearchResults(true)
    } catch (error) {
      console.error("Error searching questions:", error)
      setSearchResults({
        suggestedQuestion: null,
        explanation: "Error searching questions. Please try again.",
        alternativeMatches: []
      })
      setShowSearchResults(true)
    } finally {
      setSearchLoading(false)
    }
  }, [questions])

  const scrollToQuestion = useCallback((questionName: string) => {
    const foundQuestion = questions.find(q => q.name === questionName)
    if (foundQuestion) {
      setHighlightedQuestion(foundQuestion.name)
      const questionIndex = questions.findIndex(q => q.name === foundQuestion.name)
      setTimeout(() => {
        const element = document.getElementById(`question-${questionIndex}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
      
      setTimeout(() => {
        setHighlightedQuestion(null)
      }, 5000)
      
      // Hide search results after clicking
      setShowSearchResults(false)
      setSearchQuery("")
    }
  }, [questions])

  // Sort and filter questions based on active tab
  const sortedQuestions = useMemo(() => {
    let filteredQuestions = [...questions]
    
    // Filter based on active tab
    if (activeTab === "solved") {
      filteredQuestions = filteredQuestions.filter(q => getEffectiveStatus(q).toLowerCase() === "solved")
    } else if (activeTab === "pending") {
      filteredQuestions = filteredQuestions.filter(q => getEffectiveStatus(q).toLowerCase() === "pending")
    }
    
    // Sort to show pinned ones first
    return filteredQuestions.sort((a, b) => {
      const aPinned = getEffectivePinned(a)
      const bPinned = getEffectivePinned(b)
      
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      return 0
    })
  }, [questions, localPinned, activeTab])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "solved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "in progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "solved":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const pickRandomPendingQuestion = () => {
    const pendingQuestions = questions.filter((q) => getEffectiveStatus(q).toLowerCase() === "pending")

    if (pendingQuestions.length === 0) {
      return // No pending questions available
    }

    const randomIndex = Math.floor(Math.random() * pendingQuestions.length)
    const randomQuestion = pendingQuestions[randomIndex]

    // Highlight the selected question
    setHighlightedQuestion(randomQuestion.name)

    // Scroll to the question (find its position in the full list)
    const questionIndex = questions.findIndex((q) => q.name === randomQuestion.name)
    if (questionIndex !== -1) {
      // Use setTimeout to ensure the highlight is applied before scrolling
      setTimeout(() => {
        const element = document.getElementById(`question-${questionIndex}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    }

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedQuestion(null)
    }, 3000)
  }

  if (loadingQuestions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading questions from Google Sheets...</span>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">No questions loaded</div>
          <div className="flex items-center gap-2">
            <SheetConfig onSheetUrlChange={handleSheetUrlChange} />
            <Button variant="outline" size="sm" onClick={fetchQuestions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-lg font-medium">No DSA questions found</div>
              <div className="text-muted-foreground">
                Make sure your Google Sheet is public and contains the correct columns:
                <br />
                Problem Name, Platform, Link, Topic, Status
              </div>
              <div className="flex justify-center gap-2">
                <SheetConfig onSheetUrlChange={handleSheetUrlChange} />
                <Button onClick={fetchQuestions}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingCount = questions.filter((q) => getEffectiveStatus(q).toLowerCase() === "pending").length

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
      {/* Manual update notice */}
      {appsScriptUrl ? (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                Full Automation Enabled
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Click on pinned icons and status badges to toggle them automatically! </strong> 
                Questions are added directly to your Google Sheet. All changes sync in real-time.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">!</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Manual Sheet Updates Required
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Click on pinned icons and status badges to toggle them locally.</strong> 
                Questions can be added directly to your Google Sheet. 
                <br />
                <em className="text-xs">Note: For full automation, set up Google Apps Script in your sheet (see setup instructions below).</em>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Built by section */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-full border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <span>Vibecoded by</span>
            <a
              href="https://github.com/Shibbu264"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              <Github className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Shibbu264</span>
              <span className="sm:hidden">Shibbu</span>
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Stats and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <span>Total: {questions.length}</span>
              <span>•</span>
              <span>Solved: {questions.filter((q) => getEffectiveStatus(q).toLowerCase() === "solved").length}</span>
              <span>•</span>
              <span>Pending: {questions.filter((q) => getEffectiveStatus(q).toLowerCase() === "pending").length}</span>
            </div>
          </div>
          
          {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-wrap gap-2">
              <SheetConfig onSheetUrlChange={handleSheetUrlChange} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAppsScriptSettings(true)}
                title="Configure Apps Script URL"
                className="hidden sm:flex"
              >
                <Settings className="h-4 w-4 mr-2" />
                Apps Script
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAppsScriptSettings(true)}
                title="Configure Apps Script URL"
                className="sm:hidden"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddQuestionDialogOpen(true)}
                className="hidden sm:flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddQuestionDialogOpen(true)}
                className="sm:hidden"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={pickRandomPendingQuestion} disabled={pendingCount === 0} className="hidden sm:flex">
                <Shuffle className="h-4 w-4 mr-2" />
                Pick Random ({pendingCount})
              </Button>
              <Button variant="outline" size="sm" onClick={pickRandomPendingQuestion} disabled={pendingCount === 0} className="sm:hidden">
                <Shuffle className="h-4 w-4" />
                <span className="ml-1">({pendingCount})</span>
              </Button>
              <Button variant="outline" size="sm" onClick={fetchQuestions} className="hidden sm:flex">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={fetchQuestions} className="sm:hidden">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div ref={searchRef} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by question type or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery)
                }
              }}
              className="pl-10"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-3 border-b">
                  <p className="text-sm text-muted-foreground">{searchResults.explanation}</p>
                </div>
                
                {searchResults.suggestedQuestion && (
                  <div className="p-2">
                    <button
                      onClick={() => scrollToQuestion(searchResults.suggestedQuestion!)}
                      className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      <div className="font-medium text-sm">{searchResults.suggestedQuestion}</div>
                      <div className="text-xs text-muted-foreground">
                        {(() => {
                          const question = questions.find(q => q.name === searchResults.suggestedQuestion)
                          return question ? `${question.topic} • ${question.platform}` : 'Click to scroll to question'
                        })()}
                      </div>
                    </button>
                  </div>
                )}
                
                {searchResults.alternativeMatches && searchResults.alternativeMatches.length > 0 && (
                  <div className="p-2 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Other matches:</div>
                    {searchResults.alternativeMatches.map((questionName, index) => (
                      <button
                        key={index}
                        onClick={() => scrollToQuestion(questionName)}
                        className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                      >
                        <div className="font-medium text-sm">{questionName}</div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            const question = questions.find(q => q.name === questionName)
                            return question ? `${question.topic} • ${question.platform}` : 'Click to scroll to question'
                          })()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {!searchResults.suggestedQuestion && searchResults.alternativeMatches.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No matching questions found. Try different keywords.
                  </div>
                )}
              </div>
            )}
          </div>
          <Button 
            onClick={() => handleSearch(searchQuery)}
            disabled={searchLoading || !searchQuery.trim()}
            size="sm"
            className="w-full sm:w-auto"
          >
            {searchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2 sm:hidden">Search</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
            <span className="hidden sm:inline">All</span>
            <span className="sm:hidden">All</span>
            <span className="text-xs">({questions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="solved" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Solved</span>
            <span className="sm:hidden">Sol</span>
            <span className="text-xs">({questions.filter(q => getEffectiveStatus(q).toLowerCase() === "solved").length})</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Pen</span>
            <span className="text-xs">({questions.filter(q => getEffectiveStatus(q).toLowerCase() === "pending").length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4">
            {sortedQuestions.map((question, index) => {
              const effectiveStatus = getEffectiveStatus(question)
              const effectivePinned = getEffectivePinned(question)
              const isHighlighted = highlightedQuestion === question.name

              return (
                <Card
                  key={index}
                  id={`question-${index}`}
                  className={`hover:shadow-md transition-all duration-300 ${
                    isHighlighted ? "ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-950/20" : ""
                  } ${effectivePinned ? "border-l-4 border-l-yellow-500" : ""}`}
                >
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        {/* Mobile: Stack title and badges vertically, Desktop: Horizontal */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 transition-colors" 
                              title={`Click to toggle pinned status`}
                              onClick={() => togglePinned(question.name, effectivePinned)}
                            >
                              {effectivePinned ? (
                                <Pin className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              ) : (
                                <PinOff className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2">{question.name}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">{question.platform}</Badge>
                            <Badge 
                              className={`${getStatusColor(effectiveStatus)} cursor-pointer hover:opacity-80 transition-opacity text-xs`}
                              title={`Click to toggle status`}
                              onClick={() => toggleStatus(question.name, effectiveStatus)}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(effectiveStatus)}
                                <span className="hidden sm:inline">{effectiveStatus}</span>
                                <span className="sm:hidden">{effectiveStatus.charAt(0)}</span>
                              </div>
                            </Badge>
                          </div>
                        </div>

                        {question.topic && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            <span className="font-medium">Topic:</span> {question.topic}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <a
                            href={question.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View Problem
                          </a>
                        </div>
                      </div>

                      <Button onClick={() => fetchSolution(question)} className="w-full sm:w-auto">
                        <Eye className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">View Solution</span>
                        <span className="sm:hidden">Solution</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="solved" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4">
            {sortedQuestions.map((question, index) => {
              const effectiveStatus = getEffectiveStatus(question)
              const effectivePinned = getEffectivePinned(question)
              const isHighlighted = highlightedQuestion === question.name

              return (
                <Card
                  key={index}
                  id={`question-${index}`}
                  className={`hover:shadow-md transition-all duration-300 ${
                    isHighlighted ? "ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-950/20" : ""
                  } ${effectivePinned ? "border-l-4 border-l-yellow-500" : ""}`}
                >
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 transition-colors" 
                              title={`Click to toggle pinned status`}
                              onClick={() => togglePinned(question.name, effectivePinned)}
                            >
                              {effectivePinned ? (
                                <Pin className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              ) : (
                                <PinOff className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2">{question.name}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">{question.platform}</Badge>
                            <Badge 
                              className={`${getStatusColor(effectiveStatus)} cursor-pointer hover:opacity-80 transition-opacity text-xs`}
                              title={`Click to toggle status`}
                              onClick={() => toggleStatus(question.name, effectiveStatus)}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(effectiveStatus)}
                                <span className="hidden sm:inline">{effectiveStatus}</span>
                                <span className="sm:hidden">{effectiveStatus.charAt(0)}</span>
                              </div>
                            </Badge>
                          </div>
                        </div>

                        {question.topic && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            <span className="font-medium">Topic:</span> {question.topic}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <a
                            href={question.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View Problem
                          </a>
                        </div>
                      </div>

                      <Button onClick={() => fetchSolution(question)} className="w-full sm:w-auto">
                        <Eye className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">View Solution</span>
                        <span className="sm:hidden">Solution</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4">
            {sortedQuestions.map((question, index) => {
              const effectiveStatus = getEffectiveStatus(question)
              const effectivePinned = getEffectivePinned(question)
              const isHighlighted = highlightedQuestion === question.name

              return (
                <Card
                  key={index}
                  id={`question-${index}`}
                  className={`hover:shadow-md transition-all duration-300 ${
                    isHighlighted ? "ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-950/20" : ""
                  } ${effectivePinned ? "border-l-4 border-l-yellow-500" : ""}`}
                >
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 transition-colors" 
                              title={`Click to toggle pinned status`}
                              onClick={() => togglePinned(question.name, effectivePinned)}
                            >
                              {effectivePinned ? (
                                <Pin className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              ) : (
                                <PinOff className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2">{question.name}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">{question.platform}</Badge>
                            <Badge 
                              className={`${getStatusColor(effectiveStatus)} cursor-pointer hover:opacity-80 transition-opacity text-xs`}
                              title={`Click to toggle status`}
                              onClick={() => toggleStatus(question.name, effectiveStatus)}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(effectiveStatus)}
                                <span className="hidden sm:inline">{effectiveStatus}</span>
                                <span className="sm:hidden">{effectiveStatus.charAt(0)}</span>
                              </div>
                            </Badge>
                          </div>
                        </div>

                        {question.topic && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            <span className="font-medium">Topic:</span> {question.topic}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <a
                            href={question.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View Problem
                          </a>
                        </div>
                      </div>

                      <Button onClick={() => fetchSolution(question)} className="w-full sm:w-auto">
                        <Eye className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">View Solution</span>
                        <span className="sm:hidden">Solution</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Optimized Dialog - Single instance for better performance */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">
              Solution: {currentQuestion?.name || "Loading..."}
            </DialogTitle>
          </DialogHeader>

          {loadingSolution ? (
            <div className="flex flex-col sm:flex-row items-center justify-center py-8 gap-2">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
              <span className="text-sm sm:text-base text-center">Fetching solution from Gemini...</span>
            </div>
          ) : selectedSolution ? (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 sm:space-y-6 pr-2 sm:pr-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Question Link</h4>
                  <a
                    href={selectedSolution.questionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm break-all"
                  >
                    {selectedSolution.questionLink}
                  </a>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Brief Description</h4>
                  <p className="text-muted-foreground text-xs sm:text-sm">{selectedSolution.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Input-Output Example</h4>
                  <pre className="bg-muted p-2 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto">
                    {selectedSolution.inputOutput}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Approach</h4>
                  <p className="text-muted-foreground whitespace-pre-line text-xs sm:text-sm">{selectedSolution.approach}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Solution in C++</h4>
                  <pre className="bg-muted p-2 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto">
                    <code>{selectedSolution.cppSolution}</code>
                  </pre>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Add Question Dialog */}
      <Dialog open={isAddQuestionDialogOpen} onOpenChange={setIsAddQuestionDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Add New Question</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">
                Question Link or Description
              </label>
              <Input
                placeholder="Enter LeetCode/Codeforces link or describe the problem..."
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                className="w-full text-xs sm:text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can paste a LeetCode/Codeforces URL or just describe the problem. Our AI will generate all the details.
                <br />
                <strong>Note:</strong> Questions will be added to your Google Sheet automatically if Apps Script is set up, otherwise added locally.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddQuestionDialogOpen(false)
                  setQuestionInput("")
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddQuestion}
                disabled={addingQuestion || !questionInput.trim()}
                className="w-full sm:w-auto"
              >
                {addingQuestion ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto-shown Configuration Dialog when no sheet URL exists */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-sm sm:text-base">Configure Your DSA Sheet</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 sm:space-y-6 p-1 pr-4 pb-20">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 sm:p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">
                  📋 Setup Instructions
                </h4>
                <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p>To get started, you need to create your own copy of the DSA questions sheet:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2 sm:ml-4">
                    <li>Click the link below to open the template sheet</li>
                    <li>Click "File" → "Make a copy" to create your own copy</li>
                    <li>Make sure your copy is set to "Anyone with the link can view"</li>
                    <li>Copy the URL of your new sheet and paste it in the input below</li>
                  </ol>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <a
                  href="https://docs.google.com/spreadsheets/d/1M0NOBIbt0A6OmJvIKYmYU0d8ODaTEVmzenhGOLizhbg/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium break-all"
                >
                  Open Template Sheet →
                </a>
              </div>

              <SheetConfig onSheetUrlChange={handleSheetUrlChange} embedded={true} />
            </div>
          </div>
          
          {/* Floating Save Button */}
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Trigger save from SheetConfig
              const saveButton = document.querySelector('[data-save-config]') as HTMLButtonElement;
              if (saveButton) {
                saveButton.click();
              }
            }}>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apps Script Settings Dialog */}
      <Dialog open={showAppsScriptSettings} onOpenChange={setShowAppsScriptSettings}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Configure Apps Script URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="apps-script-url" className="text-xs sm:text-sm font-medium">
                Apps Script Web App URL
              </label>
              <Input
                id="apps-script-url"
                type="url"
                placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                className="mt-1 text-xs sm:text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your deployed Apps Script web app URL for full automation
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                How to get this URL:
              </h4>
              <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>1. Open your Google Sheet</li>
                <li>2. Go to Extensions → Apps Script</li>
                <li>3. Deploy as web app</li>
                <li>4. Copy the web app URL</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAppsScriptSettings(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Save to cookies
                  const setCookie = (name: string, value: string, days: number = 365) => {
                    if (typeof document === "undefined") return
                    const expires = new Date()
                    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
                    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
                  }
                  
                  if (appsScriptUrl.trim()) {
                    setCookie("dsa-apps-script-url", appsScriptUrl)
                  }
                  
                  setShowAppsScriptSettings(false)
                  
                  // Show success message
                  // Note: Toast will be handled by the parent component
                }}
                className="w-full sm:w-auto"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
