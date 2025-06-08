
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Access your API key as an environment variable (see Firebase Functions config)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
let generativeModel: any = null; // Adjust 'any' to specific model type if known

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  generativeModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest", // Or your preferred Gemini model
     safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });
} else {
  logger.error(
    "GEMINI_API_KEY is not set. The 'generateMathematicalModel' function will not work."
  );
}

interface ModelSuggestion {
  name: string;
  rationale: string;
}

/**
 * Generates mathematical model suggestions based on a problem description using Gemini API.
 *
 * @param {string} data.problemDescription - The description of the problem.
 * @returns {Promise<{models: ModelSuggestion[]}>} An array of suggested models.
 * @throws HttpsError - Throws an error if problemDescription is not provided,
 *                      API key is missing, or Gemini API call fails.
 */
export const generateMathematicalModel = onCall<{ problemDescription: string }, Promise<{ models: ModelSuggestion[] }>>(
  async (request) => {
    logger.info("generateMathematicalModel called", { structuredData: true });

    if (!GEMINI_API_KEY || !generativeModel) {
      logger.error("generateMathematicalModel: GEMINI_API_KEY is not configured or model initialization failed.");
      throw new HttpsError(
        "failed-precondition",
        "The function is not configured correctly to use the AI model. Please contact support."
      );
    }

    const problemDescription = request.data.problemDescription;

    if (!problemDescription || typeof problemDescription !== "string") {
      logger.error(
        "generateMathematicalModel: problemDescription is missing or not a string.",
        request.data
      );
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'problemDescription' containing the problem description."
      );
    }

    logger.info("Received problem description:", problemDescription);

    const prompt = `
You are a helpful AI assistant specializing in mathematical modeling.
Given the problem description below, suggest three distinct mathematical models that could be used to analyze or solve it.
For each model, provide its common name and a brief (1-2 sentence) rationale explaining why it might be suitable.

Return your answer ONLY as a valid JSON string representing an array of objects. Each object in the array should have two keys: "name" (string) and "rationale" (string).
Do not include any introductory text, explanations, or markdown formatting outside of the JSON string itself.

Example JSON format:
[
  {"name": "Linear Regression", "rationale": "Suitable if there's an expected linear relationship between variables."},
  {"name": "Exponential Growth Model", "rationale": "Appropriate for scenarios where a quantity increases at a rate proportional to its current value."},
  {"name": "Network Flow Optimization", "rationale": "Useful for problems involving the optimal movement of resources through a network of nodes and edges."}
]

Problem Description:
"${problemDescription}"

JSON Response:
`;

    try {
      const result = await generativeModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      logger.info("Gemini API response text:", text);

      // Attempt to parse the JSON string from the response
      let models: ModelSuggestion[] = [];
      try {
        // Clean the response text if necessary (e.g., remove markdown backticks if present)
        const cleanedText = text.replace(/^```json\s*|\s*```$/g, "").trim();
        models = JSON.parse(cleanedText);
        
        // Validate the structure of the parsed models
        if (!Array.isArray(models) || !models.every(m => typeof m.name === 'string' && typeof m.rationale === 'string')) {
          throw new Error("Parsed response is not an array of {name: string, rationale: string}.");
        }
        if (models.length === 0) {
           throw new Error("AI returned an empty list of models.");
        }

      } catch (parseError: any) {
        logger.error("Failed to parse Gemini response as JSON or invalid structure:", {
          error: parseError.message,
          responseText: text,
        });
        throw new HttpsError(
          "internal",
          "The AI model returned an unexpected response format. Please try rephrasing your problem."
        );
      }

      return { models };

    } catch (error: any) {
      logger.error("Error calling Gemini API:", {
        errorMessage: error.message,
        errorDetails: error,
      });
      if (error.message && error.message.includes("quota")) {
          throw new HttpsError("resource-exhausted", "The AI service quota has been exceeded. Please try again later.");
      }
      throw new HttpsError(
        "internal",
        "An error occurred while generating model suggestions with the AI. Please try again."
      );
    }
  }
);
