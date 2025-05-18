// The classifyExpression flow classifies mathematical expressions and suggests solution strategies.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyExpressionInputSchema = z.object({
  expression: z.string().describe('The mathematical expression to classify.'),
});
export type ClassifyExpressionInput = z.infer<typeof ClassifyExpressionInputSchema>;

const ClassifyExpressionOutputSchema = z.object({
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
  output: {schema: ClassifyExpressionOutputSchema},
  prompt: `You are a mathematical expert. Classify the following mathematical expression and suggest relevant solution strategies.\n\nExpression: {{{expression}}}`,
});

const classifyExpressionFlow = ai.defineFlow(
  {
    name: 'classifyExpressionFlow',
    inputSchema: ClassifyExpressionInputSchema,
    outputSchema: ClassifyExpressionOutputSchema,
  },
  async input => {
    const {output} = await classifyExpressionPrompt(input);
    return output!;
  }
);
