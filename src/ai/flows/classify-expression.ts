
'use server';
/**
 * @fileOverview The classifyExpression flow classifies mathematical expressions and suggests solution strategies.
 *
 * - classifyExpression - A function that handles the expression classification.
 * - ClassifyExpressionInput - The input type for the classifyExpression function.
 * - ClassifyExpressionOutput - The return type for the classifyExpression function.
 */

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
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: ClassifyExpressionInputSchema},
  output: {
    schema: z.object({
      classification: z.string().nullable().describe('The classification of the mathematical expression (e.g., polynomial, differential equation).'),
      solutionStrategies: z.string().nullable().describe('Suggested solution strategies for the given expression.'),
    }),
  },
  prompt: `You are a mathematical expert.
Task: Classify the following mathematical expression and suggest relevant solution strategies.
Expression: {{{expression}}}

Provide the classification (e.g., "Polynomial", "First-order linear differential equation", "Trigonometric identity", "Matrix operation") and suggest 2-3 concise solution strategies or relevant concepts to explore for the given expression.
If the expression is trivial or too simple for detailed strategies, provide a brief comment.
If the expression is malformed or unclassifiable, state that.
`,
  config: {
    temperature: 0.3,
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
    outputSchema: ClassifyExpressionOutputSchema,
  },
  async (input) => {
    const {output: promptOutput} = await classifyExpressionPrompt(input);
    
    if (!promptOutput) {
      // This case implies the model call itself failed fundamentally or returned nothing matching the schema.
      console.error("classifyExpressionFlow: AI model did not return a valid output object.");
      return {
        originalExpression: input.expression,
        classification: "Classification not available due to model error.",
        solutionStrategies: "Solution strategies not available due to model error.",
      };
    }

    return {
      originalExpression: input.expression,
      classification: promptOutput.classification ?? "Classification not available.",
      solutionStrategies: promptOutput.solutionStrategies ?? "Solution strategies not available.",
    };
  }
);
