
'use server';
/**
 * @fileOverview Preprocesses a user's natural language query into a WolframAlpha-compatible integration query.
 *
 * - preprocessWolframQuery - A function that refines a user query.
 * - PreprocessWolframQueryInput - The input type.
 * - PreprocessWolframQueryOutput - The output type (string of the cleaned query).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PreprocessWolframQueryInputSchema = z.object({
  userQuery: z.string().describe('The user\'s natural language query for an integration problem.'),
});
export type PreprocessWolframQueryInput = z.infer<typeof PreprocessWolframQueryInputSchema>;

const PreprocessWolframQueryOutputSchema = z.object({
  cleanedQuery: z.string().describe('A concise query suitable for WolframAlpha\'s integration solver. E.g., "integrate x^2 dx from 0 to 1" or "integrate sin(x) dx".'),
});
export type PreprocessWolframQueryOutput = z.infer<typeof PreprocessWolframQueryOutputSchema>;

export async function preprocessWolframQuery(
  input: PreprocessWolframQueryInput
): Promise<PreprocessWolframQueryOutput> {
  return preprocessWolframQueryFlow(input);
}

const preprocessWolframQueryPrompt = ai.definePrompt({
  name: 'preprocessWolframQueryPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: PreprocessWolframQueryInputSchema },
  output: { schema: PreprocessWolframQueryOutputSchema },
  prompt: `Given the user's query about an integration problem, rephrase it into a concise query string suitable for WolframAlpha's integration engine.
The output should be in a format like "integrate [expression] dx" for indefinite integrals, or "integrate [expression] dx from [lower_bound] to [upper_bound]" for definite integrals.
Extract the core mathematical expression, the variable of integration (assume 'dx' if not specified or clear), and any bounds.

User Query: {{{userQuery}}}

Cleaned WolframAlpha Query:`,
  config: {
    temperature: 0.2,
     safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const preprocessWolframQueryFlow = ai.defineFlow(
  {
    name: 'preprocessWolframQueryFlow',
    inputSchema: PreprocessWolframQueryInputSchema,
    outputSchema: PreprocessWolframQueryOutputSchema,
  },
  async (input) => {
    const { output } = await preprocessWolframQueryPrompt(input);
    if (!output || !output.cleanedQuery) {
      console.warn('preprocessWolframQueryFlow: AI returned null or malformed output. Using original query as fallback.');
      return { cleanedQuery: input.userQuery }; // Fallback
    }
    return output;
  }
);
