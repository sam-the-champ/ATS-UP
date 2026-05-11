"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Initialize Gemini client
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
class AIService {
    /**
     * Scores a candidate resume against a job description
     * Returns a value between 0 - 100
     */
    static async scoreCandidate(resumeText, jobDescription) {
        // Safety check
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing in environment variables");
        }
        // Select model (fast + good for production)
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });
        // Prompt engineered for structured output
        const prompt = `
You are an expert HR recruiter and ATS system.

Your task:
Compare the candidate's resume with the job description.

Return ONLY valid JSON in this format:
{
  "score": number,   // 0 - 100
  "reasoning": string
}

Scoring rules:
- 0-40: poor match
- 41-70: average match
- 71-100: strong match

Focus on:
- skills match
- experience relevance
- education alignment
- project relevance

Job Description:
${jobDescription}

Resume:
${resumeText}
`;
        try {
            // Call Gemini
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            // Parse AI response
            const parsed = JSON.parse(responseText);
            // Validate score
            if (typeof parsed.score !== "number") {
                return 0;
            }
            return parsed.score;
        }
        catch (error) {
            console.error("Gemini AI error:", error);
            return 0;
        }
    }
}
exports.AIService = AIService;
