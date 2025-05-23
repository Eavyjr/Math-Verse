// The classifyExpression flow classifies mathematical expressions and suggests solution strategies.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyExpressionInputSchema = z.object({
  expression: z.string().describe('The mathematical expression to classify.'),
});
export type ClassifyExpressionInput = z.infer<typeof ClassifyExpressionInputSchema>;

const ClassifyExpressionOutputSchema = z.object({
  originalExpression: z.string().describe('The original mathematical expression that was classified.'),
  classification: z.string().describe('The classification of the mathematical expression (e.g., polynomial, differential equation).'),
  solutionStrategies: z.string().describe('Suggested solution strategies for the given expression.'),
});
export type ClassifyExpressionOutput = z.infer<typeof ClassifyExpressionOutputSchema>;

export async function classifyExpression(
  input: ClassifyExpressionInput
): Promise<ClassifyExpressionOutput> {
  return classifyExpressionFlow(input);
}

const classifyExpressionPrompt = ai.definePrompt({
  name: 'classifyExpressionPrompt',
  input: {schema: ClassifyExpressionInputSchema},
  // Allow model to return null for these fields
  output: {schema: z.object({
    classification: z.string().nullable().describe('The classification of the mathematical expression (e.g., polynomial, differential equation).'),
    solutionStrategies: z.string().nullable().describe('Suggested solution strategies for the given expression.'),
  })},
  prompt: `You are a mathematical expert. Classify the following mathematical expression and suggest relevant solution strategies.\n\nExpression: {{{expression}}}`,
  config: {
    temperature: 0.3, // Slightly higher temp for more varied suggestions if appropriate
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  }
});

const classifyExpressionFlow = ai.defineFlow(
  {
    name: 'classifyExpressionFlow',
    inputSchema: ClassifyExpressionInputSchema,
    outputSchema: ClassifyExpressionOutputSchema, // Flow still guarantees strings
  },
  async input => {
    const {output: promptOutput} = await classifyExpressionPrompt(input);
    
    if (!promptOutput) {
      throw new Error("AI model did not return a valid output object for classification.");
    }

    // Ensure the flow returns strings as per ClassifyExpressionOutputSchema
    return {
      originalExpression: input.expression,
      classification: promptOutput.classification ?? "Classification not available.",
      solutionStrategies: promptOutput.solutionStrategies ?? "Solution strategies not available.",
    };
  }
);
