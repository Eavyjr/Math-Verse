
'use server';
/**
 * @fileOverview The Math Chatbot flow for handling user queries.
 * This version uses ai.generate() directly.
 *
 * - getMathChatbotResponse - A function that processes user input and generates a bot response.
 * - MathChatbotInput - The input type for the getMathChatbotResponse function.
 * - MathChatbotOutput - The return type for the getMathChatbotResponse function (string).
 */
import { defineFlow } from 'genkit'; // Corrected import
import { z } from 'zod';
import { ai } from '@/ai/genkit'; // Use our project's Genkit instance

// Schema for the input to the main exported function
const MathChatbotInputSchema = z.object({
  userInput: z.string().describe("The latest message from the user."),
});
export type MathChatbotInput = z.infer<typeof MathChatbotInputSchema>;

// The output is a direct string from the AI.
export type MathChatbotOutput = string;

// This schema is for the input to the internal 'mathChatbotFlow'
const InternalFlowInputSchema = z.object({
  userInput: z.string().describe("The user's message to the chatbot."),
});

const systemInstruction = `You are MathVerse AI, a friendly and helpful math assistant. Your primary goal is to assist users with their mathematical questions, explain concepts, and guide them on how to use the MathVerse application. Be concise and clear. If a user asks for a complex calculation that a dedicated workstation page can handle (like integration, matrix operations, differentiation, DEs, statistics, algebra simplification), gently guide them to that page rather than trying to perform the full calculation yourself. You can answer general math questions, trivia, or provide explanations of concepts.`;

export async function getMathChatbotResponse(input: MathChatbotInput): Promise<MathChatbotOutput> {
  // Pass the userInput directly to the flow.
  // The flow's inputSchema should match this structure.
  return mathChatbotFlow({ userInput: input.userInput });
}

const mathChatbotFlow = defineFlow(
  {
    name: 'mathChatbotFlow',
    inputSchema: InternalFlowInputSchema, // Use the internal schema expecting 'userInput'
    outputSchema: z.string().describe('The AI\'s textual response.'),
  },
  async (input) => { // input here will be { userInput: "..." }
    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.0-flash', // Explicitly set model
        prompt: input.userInput, // Use input.userInput here
        system: systemInstruction,
        config: {
          temperature: 0.7,
          candidateCount: 1,
          // safetySettings can be added here if needed
        },
      });

      const botText = response.text;

      if (!botText || botText.trim() === "") {
        console.error("MathChatbotFlow (ai.generate): AI model returned null, undefined, or empty text.");
        // Throw an error that can be caught by the action layer
        throw new Error("AI model provided no usable text response.");
      }
      return botText;
    } catch (e: any) {
      console.error("Error in mathChatbotFlow (using ai.generate):", e);
      // Re-throw the error to be caught by the action layer
      throw e; 
    }
  }
);
