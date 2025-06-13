'use server';
/**
 * @fileOverview The Math Chatbot flow for handling user queries.
 * This version uses ai.generate() directly and is now RAG-enabled.
 *
 * - getMathChatbotResponse - A function that processes user input and generates a bot response.
 * - MathChatbotInput - The input type for the getMathChatbotResponse function.
 * - MathChatbotOutput - The return type for the getMathChatbotResponse function (string).
 */
import { ai } from '@/ai/genkit'; // Use our project's Genkit instance
import { z } from 'zod';

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
  retrievedContext: z.string().optional().describe("Optional context retrieved from personalized data sources (e.g., PDFs, websites) to inform the chatbot's response."),
});

const systemInstruction = `You are MathVerse AI, a friendly and helpful math assistant. Your primary goal is to assist users with their mathematical questions, explain concepts, and guide them on how to use the MathVerse application. Be concise and clear. If a user asks for a complex calculation that a dedicated workstation page can handle (like integration, matrix operations, differentiation, DEs, statistics, algebra simplification), gently guide them to that page rather than trying to perform the full calculation yourself. You can answer general math questions, trivia, or provide explanations of concepts.

{{#if retrievedContext}}
IMPORTANT: Use the following information to help answer the user's question:
---
{{{retrievedContext}}}
---
Always prioritize information from this context if it's relevant to the user's query.
{{/if}}
`;

export async function getMathChatbotResponse(input: MathChatbotInput): Promise<MathChatbotOutput> {
  console.log("[Flow:getMathChatbotResponse] Received input:", input);
  // For now, we call the flow without retrievedContext.
  // In a full RAG setup, you would retrieve context based on input.userInput here,
  // and then pass it to mathChatbotFlow.
  const result = await mathChatbotFlow({ userInput: input.userInput });
  console.log("[Flow:getMathChatbotResponse] Returning result:", result);
  return result;
}

const mathChatbotFlow = ai.defineFlow(
  {
    name: 'mathChatbotFlow',
    inputSchema: InternalFlowInputSchema, 
    outputSchema: z.string().describe('The AI\'s textual response.'),
  },
  async (input) => { 
    console.log("[Flow:mathChatbotFlow] Processing input:", input.userInput);
    if (input.retrievedContext) {
      console.log("[Flow:mathChatbotFlow] Using retrieved context:", input.retrievedContext.substring(0,100) + "...");
    }

    // Construct the prompt to include context if available
    let fullPrompt = input.userInput;
    // The system instruction now handles the context through Handlebars

    try {
      console.log("[Flow:mathChatbotFlow] Calling ai.generate()...");
      const response = await ai.generate({
        model: 'googleai/gemini-2.0-flash', // or your preferred model
        prompt: fullPrompt, // The system instruction will prepend context if available.
        system: systemInstruction,
        input: { // Provide input for Handlebars templating in system prompt
          retrievedContext: input.retrievedContext,
        },
        config: {
          temperature: 0.7,
          candidateCount: 1,
        },
      });
      console.log("[Flow:mathChatbotFlow] Received response from ai.generate().");

      const botText = response.text;
      console.log("[Flow:mathChatbotFlow] Extracted botText:", botText);

      if (!botText || botText.trim() === "") {
        console.error("[Flow:mathChatbotFlow] AI model returned null, undefined, or empty text.");
        throw new Error("AI model provided no usable text response.");
      }
      return botText;
    } catch (e: any) {
      console.error("[Flow:mathChatbotFlow] Error during ai.generate() or text processing:", e);
      throw new Error(`AI processing error in mathChatbotFlow: ${e.message || e.toString()}`);
    }
  }
);
