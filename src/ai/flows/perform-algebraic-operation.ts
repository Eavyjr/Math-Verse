
'use server';
/**
 * @fileOverview Performs algebraic operations using an AI model.
 *
 * - performAlgebraicOperation - A function that handles various algebraic calculations.
 * - AlgebraicOperationInput - The input type for the performAlgebraicOperation function.
 * - AlgebraicOperationOutput - The return type for the performAlgebraicOperation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AlgebraicOperationInputSchema = z.object({
  expression: z.string().describe('The mathematical expression to operate on.'),
  operation: z
    .enum([
      'simplify',
      'factor',
      'derive',
      'integrate',
      'zeroes',
      'expand',
      'log',
      'trigsimplify',
    ])
    .describe(
      'The algebraic operation to perform (simplify, factor, derive, integrate, zeroes, expand, log, trigsimplify).'
    ),
});
export type AlgebraicOperationInput = z.infer<typeof AlgebraicOperationInputSchema>;

const AlgebraicOperationOutputSchema = z.object({
  operation: z.string().describe('The operation that was performed.'),
  expression: z.string().describe('The original expression.'),
  result: z
    .string()
    .describe(
      'The result of the algebraic operation. This should be purely the mathematical expression or value, suitable for LaTeX rendering.'
    ),
});
export type AlgebraicOperationOutput = z.infer<typeof AlgebraicOperationOutputSchema>;

export async function performAlgebraicOperation(
  input: AlgebraicOperationInput
): Promise<AlgebraicOperationOutput> {
  return performAlgebraicOperationFlow(input);
}

const systemPrompt = `You are an advanced algebraic calculator.
Given the mathematical expression and the operation, perform the operation and return ONLY the resulting mathematical expression or value.
Your response should be directly usable for LaTeX rendering (e.g., "x^2 + 2*x + 1" or "2 \\sin(x)"). Do not include any explanations, apologies, or conversational text.

Operation specific instructions:
- simplify: Simplify the expression as much as possible.
- factor: Factor the expression.
- derive: Find the derivative of the expression with respect to the primary variable (usually x).
- integrate: Find the indefinite integral of the expression with respect to the primary variable (usually x). Add "+ C" for indefinite integrals.
- zeroes: Find the zeros (roots) of the expression. List them comma-separated if multiple.
- expand: Expand the expression.
- log: Calculate the logarithm.
  - If the expression is in the format "base:number" (e.g., "2:8"), calculate log_base(number).
  - Otherwise, assume natural logarithm (ln) of the expression.
- trigsimplify: Simplify the trigonometric expression.

Ensure the output is concise and strictly the mathematical result.
`;

const performAlgebraicOperationPrompt = ai.definePrompt({
  name: 'performAlgebraicOperationPrompt',
  input: {schema: AlgebraicOperationInputSchema},
  output: {schema: AlgebraicOperationOutputSchema},
  system: systemPrompt,
  prompt: `Expression: {{{expression}}}
Operation: {{{operation}}}

Return the result for the operation '{{{operation}}}' on the expression '{{{expression}}}'.`,
  config: {
    // Higher temperature might be needed for creative problem solving but could reduce accuracy for pure math.
    // Let's start with a lower temperature for more deterministic math results.
    temperature: 0.2, 
  }
});

const performAlgebraicOperationFlow = ai.defineFlow(
  {
    name: 'performAlgebraicOperationFlow',
    inputSchema: AlgebraicOperationInputSchema,
    outputSchema: AlgebraicOperationOutputSchema,
  },
  async (input) => {
    const {output} = await performAlgebraicOperationPrompt(input);
    if (!output) {
      throw new Error('AI model did not return a valid output for the algebraic operation.');
    }
    // The prompt is designed to return the result directly in the 'result' field of the output schema.
    // We need to ensure the 'operation' and 'expression' fields are also populated in the final output.
    return {
      operation: input.operation,
      expression: input.expression,
      result: output.result,
    };
  }
);
