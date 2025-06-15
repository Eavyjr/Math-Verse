
'use server';

/**
 * @fileOverview Generates random math facts, puzzles, or historical insights.
 *
 * - generateMathTrivia - A function that generates math trivia.
 * - GenerateMathTriviaInput - The input type for the generateMathTrivia function.
 * - GenerateMathTriviaOutput - The return type for the generateMathTrivia function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMathTriviaInputSchema = z.object({
  topic: z
    .string()
    .default('general')
    .describe('The topic of the math trivia (e.g., general, algebra, calculus, geometry).'),
});
export type GenerateMathTriviaInput = z.infer<typeof GenerateMathTriviaInputSchema>;

const GenerateMathTriviaOutputSchema = z.object({
  trivia: z.string().describe('A random math fact, puzzle, or historical insight.'),
});
export type GenerateMathTriviaOutput = z.infer<typeof GenerateMathTriviaOutputSchema>;

export async function generateMathTrivia(input: GenerateMathTriviaInput): Promise<GenerateMathTriviaOutput> {
  return generateMathTriviaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMathTriviaPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {schema: GenerateMathTriviaInputSchema},
  output: {schema: GenerateMathTriviaOutputSchema},
  prompt: `You are a math trivia generator. Generate a random math fact, puzzle, or historical insight based on the topic: {{{topic}}}. Keep it concise and engaging.`,
});

const generateMathTriviaFlow = ai.defineFlow(
  {
    name: 'generateMathTriviaFlow',
    inputSchema: GenerateMathTriviaInputSchema,
    outputSchema: GenerateMathTriviaOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (output && output.trivia) {
        return output;
      }
      // Fallback if output is null or trivia field is missing, though schema should prevent this.
      console.warn('generateMathTriviaFlow: AI returned null or malformed output. Using fallback.');
      return { trivia: "Could not generate a fun fact at this moment. How about this: Did you know π (pi) is an irrational number?" };
    } catch (error: any) {
      console.error('Error in generateMathTriviaFlow:', error.message || error);
      // Check for specific error messages if needed, e.g., from Google API
      if (error.message && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
        return { trivia: "The math trivia service is currently busy. Please try again in a moment!" };
      }
      return { trivia: "Sorry, I couldn't fetch a new trivia fact right now. Please try again later." };
    }
  }
);

