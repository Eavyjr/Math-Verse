'use server';
/**
 * @fileOverview Suggests mathematical models for a problem description using Genkit.
 *
 * This replaces the standalone Firebase Cloud Function (`generateMathematicalModel`)
 * so all AI features share one in-process Genkit path.
 *
 * - generateMathematicalModel - Suggests candidate models for a problem.
 * - ModelGeneratorInput - The input type.
 * - ModelGeneratorOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModelGeneratorInputSchema = z.object({
  problemDescription: z.string().describe('A natural-language description of the problem to model.'),
});
export type ModelGeneratorInput = z.infer<typeof ModelGeneratorInputSchema>;

const ModelSuggestionSchema = z.object({
  name: z.string().describe('The common name of the suggested mathematical model.'),
  rationale: z.string().describe('A 1-2 sentence rationale for why the model suits the problem.'),
});

const ModelGeneratorOutputSchema = z.object({
  models: z.array(ModelSuggestionSchema).describe('A list of suggested mathematical models.'),
});
export type ModelGeneratorOutput = z.infer<typeof ModelGeneratorOutputSchema>;
export type ModelSuggestion = z.infer<typeof ModelSuggestionSchema>;

export async function generateMathematicalModel(
  input: ModelGeneratorInput
): Promise<ModelGeneratorOutput> {
  return generateMathematicalModelFlow(input);
}

const systemPrompt = `You are a helpful AI assistant specializing in mathematical modeling.
Given a problem description, suggest three distinct mathematical models that could be used to analyze or solve it.
For each model, provide its common name and a brief (1-2 sentence) rationale explaining why it might be suitable.
Always return exactly three distinct, relevant models.`;

const modelGeneratorPrompt = ai.definePrompt({
  name: 'modelGeneratorPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: { schema: ModelGeneratorInputSchema },
  output: { schema: ModelGeneratorOutputSchema },
  system: systemPrompt,
  prompt: `Problem Description:
"{{{problemDescription}}}"

Suggest three distinct mathematical models with a name and rationale for each.`,
  config: {
    temperature: 0.3,
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

const generateMathematicalModelFlow = ai.defineFlow(
  {
    name: 'generateMathematicalModelFlow',
    inputSchema: ModelGeneratorInputSchema,
    outputSchema: ModelGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await modelGeneratorPrompt(input);
    if (!output || !Array.isArray(output.models) || output.models.length === 0) {
      return { models: [] };
    }
    return output;
  }
);
