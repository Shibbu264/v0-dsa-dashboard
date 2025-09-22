"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Eye, Loader2, CheckCircle, Clock, RefreshCw, Shuffle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SheetConfig } from "@/components/sheet-config"

interface DSAQuestion {
  name: string
  platform: string
  link: string
  topic: string
  status: string
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
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({})
  const [highlightedQuestion, setHighlightedQuestion] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("dsa-question-statuses")
    if (saved) {
      setLocalStatuses(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("dsa-question-statuses", JSON.stringify(localStatuses))
  }, [localStatuses])

  useEffect(() => {
    fetchQuestions()
  }, [])

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
  }

  const toggleStatus = (questionName: string, currentStatus: string) => {
    const newStatus = currentStatus.toLowerCase() === "solved" ? "Pending" : "Solved"
    setLocalStatuses((prev) => ({
      ...prev,
      [questionName]: newStatus,
    }))
  }

  const getEffectiveStatus = (question: DSAQuestion) => {
    return localStatuses[question.name] || question.status
  }

  const fetchSolution = async (question: DSAQuestion) => {
    setLoadingSolution(true)
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
  }

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Total: {questions.length} | Solved:{" "}
            {questions.filter((q) => getEffectiveStatus(q).toLowerCase() === "solved").length} | Pending:{" "}
            {questions.filter((q) => getEffectiveStatus(q).toLowerCase() === "pending").length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SheetConfig onSheetUrlChange={handleSheetUrlChange} />
          <Button variant="outline" size="sm" onClick={pickRandomPendingQuestion} disabled={pendingCount === 0}>
            <Shuffle className="h-4 w-4 mr-2" />
            Pick Random ({pendingCount})
          </Button>
          <Button variant="outline" size="sm" onClick={fetchQuestions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {questions.map((question, index) => {
          const effectiveStatus = getEffectiveStatus(question)
          const isHighlighted = highlightedQuestion === question.name

          return (
            <Card
              key={index}
              id={`question-${index}`}
              className={`hover:shadow-md transition-all duration-300 ${
                isHighlighted ? "ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-950/20" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">{question.name}</h3>
                      <Badge variant="outline">{question.platform}</Badge>
                      <Badge
                        className={`${getStatusColor(effectiveStatus)} cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => toggleStatus(question.name, effectiveStatus)}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(effectiveStatus)}
                          {effectiveStatus}
                        </div>
                      </Badge>
                    </div>

                    {question.topic && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Topic:</span> {question.topic}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={question.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Problem
                      </a>
                    </div>
                  </div>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => fetchSolution(question)} className="ml-4">
                        <Eye className="h-4 w-4 mr-2" />
                        View Solution
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Solution: {question.name}</DialogTitle>
                      </DialogHeader>

                      {loadingSolution ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="ml-2">Fetching solution from Gemini...</span>
                        </div>
                      ) : selectedSolution ? (
                        <ScrollArea className="h-[60vh]">
                          <div className="space-y-6 pr-4">
                            <div>
                              <h4 className="font-semibold mb-2">Question Link</h4>
                              <a
                                href={selectedSolution.questionLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {selectedSolution.questionLink}
                              </a>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Brief Description</h4>
                              <p className="text-muted-foreground">{selectedSolution.description}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Input-Output Example</h4>
                              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                                {selectedSolution.inputOutput}
                              </pre>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Approach</h4>
                              <p className="text-muted-foreground whitespace-pre-line">{selectedSolution.approach}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Solution in C++</h4>
                              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{selectedSolution.cppSolution}</code>
                              </pre>
                            </div>
                          </div>
                        </ScrollArea>
                      ) : null}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
