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
  input: {schema: GenerateMathTriviaInputSchema},
  output: {schema: GenerateMathTriviaOutputSchema},
  prompt: `You are a math trivia generator. Generate a random math fact, puzzle, or historical insight based on the topic: {{{topic}}}.`,
});

const generateMathTriviaFlow = ai.defineFlow(
  {
    name: 'generateMathTriviaFlow',
    inputSchema: GenerateMathTriviaInputSchema,
    outputSchema: GenerateMathTriviaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
