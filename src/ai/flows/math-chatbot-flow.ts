
'use server';
/**
 * @fileOverview The Math Chatbot flow for handling user queries.
 *
 * - mathChatbotFlow - A function that processes user input and generates a bot response.
 * - MathChatbotInput - The input type for the mathChatbotFlow function.
 * - MathChatbotOutput - The return type for the mathChatbotFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define roles for chat history messages
const ChatMessageRoleSchema = z.enum(['user', 'model', 'system', 'tool']);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

// A part of a chat message is now just a string if it's text.
const ChatMessagePartSchema = z.string();
export type ChatMessagePart = z.infer<typeof ChatMessagePartSchema>;

const ChatHistoryMessageSchema = z.object({
  role: ChatMessageRoleSchema,
  content: z.array(ChatMessagePartSchema), // Now an array of strings
});
export type ChatHistoryMessage = z.infer<typeof ChatHistoryMessageSchema>;

const MathChatbotInputSchema = z.object({
  userInput: z.string().describe('The latest message from the user.'),
  history: z.array(ChatHistoryMessageSchema).optional().describe('The conversation history up to this point.'),
});
export type MathChatbotInput = z.infer<typeof MathChatbotInputSchema>;

const MathChatbotOutputSchema = z.object({
  botResponse: z.string().describe("The AI's response to the user."),
});
export type MathChatbotOutput = z.infer<typeof MathChatbotOutputSchema>;


export async function getMathChatbotResponse(
  input: MathChatbotInput
): Promise<MathChatbotOutput> {
  return mathChatbotFlow(input);
}

const systemInstruction = "You are MathVerse AI, a friendly and helpful math assistant. Your primary goal is to assist users with their mathematical questions, explain concepts, and guide them on how to use the MathVerse application. Be concise and clear. If a user asks for a complex calculation that a dedicated workstation page can handle (like integration, matrix operations, differentiation, DEs, statistics, algebra simplification), gently guide them to that page rather than trying to perform the full calculation yourself. You can answer general math questions, trivia, or provide explanations of concepts.";

const mathChatbotPrompt = ai.definePrompt({
  name: 'mathChatbotPrompt',
  input: { schema: MathChatbotInputSchema },
  output: { schema: MathChatbotOutputSchema },
  system: systemInstruction,
  prompt: (input) => {
    const messages: ChatHistoryMessage[] = [];
    if (input.history) {
      messages.push(...input.history);
    }
    // New user message content is now an array of strings
    messages.push({ role: 'user', content: [input.userInput] }); 
    return messages;
  },
  config: {
    model: 'googleai/gemini-2.0-flash',
    temperature: 0.7,
    candidateCount: 1,
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const mathChatbotFlow = ai.defineFlow(
  {
    name: 'mathChatbotFlow',
    inputSchema: MathChatbotInputSchema,
    outputSchema: MathChatbotOutputSchema,
  },
  async (input) => {
    const { output } = await mathChatbotPrompt(input);
    
    if (!output || !output.botResponse || output.botResponse.trim() === "") {
      console.error("MathChatbotFlow: AI model returned null, undefined, or empty response.");
      return { botResponse: "I'm sorry, I couldn't process that request. Could you try rephrasing?" };
    }
    
    return { botResponse: output.botResponse };
  }
);
