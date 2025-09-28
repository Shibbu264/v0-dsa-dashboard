import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { questionInput } = await request.json()

    if (!questionInput || !questionInput.trim()) {
      return NextResponse.json(
        { error: "Question input is required" },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error: "Gemini API key not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables.",
        },
        { status: 500 }
      )
    }

    const prompt = `
    You are an expert competitive programmer. Analyze the following input and extract/generate all the required information for a DSA question:

    Input: ${questionInput}

    You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text. The response must be parseable JSON.

    Required JSON format:
    {
      "name": "Question name/title",
      "platform": "LeetCode" or "Codeforces" or "Other",
      "link": "Full URL to the problem (if provided, otherwise generate a placeholder)",
      "topic": "DSA topic/category (e.g., 'Binary Search', 'Dynamic Programming', 'Graph', etc.)",
      "status": "Pending",
      "pinned": true,
      "description": "Brief description of the problem"
    }

    Guidelines:
    - If the input is a LeetCode URL, extract the problem name and set platform to "LeetCode"
    - If the input is a Codeforces URL, extract the problem name and set platform to "Codeforces"  
    - If the input is just a description, try to identify the platform and generate appropriate details
    - Always set pinned to true for newly added questions
    - Always set status to "Pending"
    - Make the topic specific and relevant to the problem type
    - If no link is provided, create a placeholder link
    `

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3,
      }
    })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log("Raw Gemini response for add question:", text.substring(0, 200))

    // Try to parse the JSON response
    let questionData
    try {
      // First try to find JSON wrapped in markdown code blocks
      let jsonString = text
      
      // Look for ```json...``` pattern
      const jsonCodeBlockMatch = text.match(/```json\s*\n([\s\S]*?)\n```/)
      if (jsonCodeBlockMatch) {
        jsonString = jsonCodeBlockMatch[1]
      } else {
        // Look for any JSON object in the text
        const jsonObjectMatch = text.match(/\{[\s\S]*\}/)
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0]
        }
      }
      
      // Clean up the JSON string
      jsonString = jsonString.trim()
      
      // Parse the JSON
      const parsedData = JSON.parse(jsonString)
      
      // Ensure all fields are properly formatted
      questionData = {
        name: typeof parsedData.name === 'string' ? parsedData.name : "Generated Question",
        platform: typeof parsedData.platform === 'string' ? parsedData.platform : "Other",
        link: typeof parsedData.link === 'string' ? parsedData.link : "#",
        topic: typeof parsedData.topic === 'string' ? parsedData.topic : "General",
        status: "Pending",
        pinned: true,
        description: typeof parsedData.description === 'string' ? parsedData.description : "Generated question from user input"
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
      console.error("Raw response:", text.substring(0, 500) + "...")
      
      // If JSON parsing fails, create a structured response from the text
      questionData = {
        name: "Generated Question",
        platform: "Other",
        link: "#",
        topic: "General",
        status: "Pending",
        pinned: true,
        description: text.substring(0, 200) + "..."
      }
    }

    return NextResponse.json(questionData)
  } catch (error) {
    console.error("Error generating question data:", error)
    return NextResponse.json({ error: "Failed to generate question data" }, { status: 500 })
  }
}
