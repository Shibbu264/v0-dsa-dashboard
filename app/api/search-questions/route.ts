import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const { query, questions } = await request.json()

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error: "Gemini API key not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables.",
        },
        { status: 500 }
      )
    }

    if (!query || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Invalid request. Please provide query and questions array." },
        { status: 400 }
      )
    }

    const prompt = `
    You are an expert at helping users find relevant DSA (Data Structures and Algorithms) questions based on their search queries.

    User's search query: "${query}"
    
    Available questions:
    ${questions.map((q, index) => `${index + 1}. ${q.name} (Topic: ${q.topic}, Platform: ${q.platform})`).join('\n')}

    Based on the user's search query, find the most relevant question(s) that match their intent. Consider:
    1. Topic/algorithm type (e.g., "binary search", "dynamic programming", "graphs", "trees")
    2. Problem difficulty level
    3. Platform preference
    4. Question name similarity

    Return your response in the following JSON format:
    {
      "suggestedQuestion": "exact name of the most relevant question",
      "explanation": "brief explanation of why this question matches the search query",
      "alternativeMatches": ["list of other relevant question names if any"]
    }

    If no relevant questions are found, return:
    {
      "suggestedQuestion": null,
      "explanation": "No questions found matching your search criteria. Try different keywords like 'arrays', 'strings', 'trees', 'graphs', etc.",
      "alternativeMatches": []
    }
    `

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: prompt,
      temperature: 0.3,
      maxTokens: 500,
    })

    // Try to parse the JSON response
    let result
    try {
      // Extract JSON from the response if it's wrapped in markdown
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text
      result = JSON.parse(jsonString)
    } catch (parseError) {
      // If JSON parsing fails, create a fallback response
      result = {
        suggestedQuestion: null,
        explanation: "Unable to process search query. Please try rephrasing your search.",
        alternativeMatches: []
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error searching questions:", error)
    return NextResponse.json(
      { error: "Failed to search questions" },
      { status: 500 }
    )
  }
}
