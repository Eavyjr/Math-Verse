
'use server';
/**
 * @fileOverview The Math Chatbot flow for handling user queries.
 * This version uses ai.generate() directly for simplicity.
 *
 * - getMathChatbotResponse - A function that processes user input and generates a bot response.
 * - MathChatbotInput - The input type for the getMathChatbotResponse function.
 * - MathChatbotOutput - The return type for the getMathChatbotResponse function (string).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MathChatbotInputSchema = z.object({
  userInput: z.string().describe('The latest message from the user.'),
});
export type MathChatbotInput = z.infer<typeof MathChatbotInputSchema>;

// The output is a direct string from the AI.
export type MathChatbotOutput = string;

const systemInstruction = "You are MathVerse AI, a friendly and helpful math assistant. Your primary goal is to assist users with their mathematical questions, explain concepts, and guide them on how to use the MathVerse application. Be concise and clear. If a user asks for a complex calculation that a dedicated workstation page can handle (like integration, matrix operations, differentiation, DEs, statistics, algebra simplification), gently guide them to that page rather than trying to perform the full calculation yourself. You can answer general math questions, trivia, or provide explanations of concepts.";

export async function getMathChatbotResponse(
  input: MathChatbotInput
): Promise<MathChatbotOutput> {
  return mathChatbotFlow(input);
}

const mathChatbotFlow = ai.defineFlow(
  {
    name: 'mathChatbotFlowSimplified', // Renamed for clarity during debugging
    inputSchema: MathChatbotInputSchema,
    outputSchema: z.string(), // Expecting a string response
  },
  async (input) => {
    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.0-flash', // Explicitly set model
        prompt: input.userInput,
        system: systemInstruction,
        config: {
          temperature: 0.7,
          candidateCount: 1,
          // Safety settings temporarily removed for debugging "Unsupported Part type"
          // safetySettings: [
          //   { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          //   { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          //   { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          //   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          // ],
        },
        // No explicit output schema needed here if we're just taking response.text
      });

      const botText = response.text;

      if (!botText || botText.trim() === "") {
        console.error("MathChatbotFlow (ai.generate): AI model returned null, undefined, or empty text.");
        throw new Error("AI model provided no usable text response.");
      }
      return botText;
    } catch (e: any) {
      console.error("Error in mathChatbotFlow (using ai.generate):", e);
      // Re-throw the error to be caught by the action layer
      // The action layer will prepend "An AI processing error occurred: "
      throw e; 
    }
  }
);
