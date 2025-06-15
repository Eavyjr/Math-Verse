
'use server';
/**
 * @fileOverview Performs vector operations using an AI model.
 *
 * - performVectorOperation - A function that handles various vector calculations.
 * - VectorOperationInput - The input type for the performVectorOperation function.
 * - VectorOperationOutput - The return type for the performVectorOperation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VectorSchema = z.array(z.number()).describe('A vector represented as an array of numbers (e.g., [1, 2, 3] for a 3D vector).');

const VectorOperationInputSchema = z.object({
  vectorA: VectorSchema.describe('The first vector (Vector A).'),
  vectorB: VectorSchema.optional().describe('The second vector (Vector B), required for binary operations like dot product, cross product, addition, subtraction.'),
  scalar: z.number().optional().describe('A scalar value, required for scalar multiplication.'),
  operation: z
    .enum([
      'magnitudeA',
      'normalizeA',
      'add',
      'subtract',
      'scalarMultiplyA',
      'dotProduct',
      'crossProduct', // Typically for 3D vectors
      'angleBetween', // Angle between A and B
    ])
    .describe(
      'The vector operation to perform.'
    ),
});
export type VectorOperationInput = z.infer<typeof VectorOperationInputSchema>;

const VectorOperationOutputSchema = z.object({
  result: z.union([
    z.number(), 
    z.array(z.number()), 
    z.string() 
  ]).describe(
    'The result of the vector operation. This could be a scalar number (for magnitude, dot product, angle), a vector array (for normalize, add, subtract, scalarMultiply, crossProduct), or a descriptive string message (e.g., for errors like incompatible dimensions or cross product of non-3D vectors).'
  ),
  steps: z.string().optional().describe("A detailed step-by-step explanation of how the result was obtained. For each step, clearly state the mathematical rule or principle applied. Use simple LaTeX for mathematical expressions within steps, ensuring they are wrapped in \\\\(...\\\\) delimiters (e.g., \\\\(\\sqrt{x^2 + y^2}\\\\), \\\\(A \\cdot B\\\\))."),
  originalQuery: VectorOperationInputSchema.describe("The original input parameters for the operation."),
});
export type VectorOperationOutput = z.infer<typeof VectorOperationOutputSchema>;

export async function performVectorOperation(
  input: VectorOperationInput
): Promise<VectorOperationOutput> {
  return performVectorOperationFlow(input);
}

const systemPrompt = `You are an expert vector algebra assistant. Perform the requested operation on the given vector(s) and scalar.

Input Vectors are provided as arrays of numbers.

Output Requirements:
- 'result': This field should contain the direct mathematical result.
    - If the result is a scalar (e.g., magnitude, dot product, angle), return it as a number.
    - If the result is a vector (e.g., normalization, addition, cross product), return it as an array of numbers.
    - If an operation is invalid (e.g., cross product of 2D vectors, different dimensions for addition/dot product, angle with zero vector), the 'result' field should be a concise string explaining the error (e.g., "Error: Cross product is only defined for 3D vectors.").
- 'steps': Provide a detailed step-by-step explanation for how the result was obtained. Use LaTeX notation wrapped in \\\\(...\\\\) for all mathematical expressions, variables, and numbers within the steps. Clearly state the formula or rule used at each step.

Operation Specific Instructions:
- magnitudeA: Calculate the magnitude (length or norm) of Vector A. Formula: \\\\(|A| = \\sqrt{\\sum A_i^2}\\\\).
- normalizeA: Normalize Vector A to a unit vector. Formula: \\\\(\\hat{A} = \\frac{A}{|A|}\\\\). If magnitude is 0, result should be an error string "Error: Cannot normalize a zero vector."
- add: Add Vector A and Vector B. (e.g., \\\\(A+B = [A_x+B_x, A_y+B_y, ... ]\\\\)). Result is a vector. Vectors must have the same dimension, otherwise, result is an error string.
- subtract: Subtract Vector B from Vector A. (e.g., \\\\(A-B = [A_x-B_x, A_y+B_y, ... ]\\\\)). Result is a vector. Vectors must have the same dimension, otherwise, result is an error string.
- scalarMultiplyA: Multiply Vector A by the scalar 'k'. (e.g., \\\\(kA = [k A_x, k A_y, ... ]\\\\)). Result is a vector.
- dotProduct: Calculate the dot product (scalar product) of Vector A and Vector B. (e.g., \\\\(A \\cdot B = \\sum A_i B_i\\\\)). Result is a number. Vectors must have the same dimension, otherwise, result is an error string.
- crossProduct: Calculate the cross product of Vector A and Vector B. (e.g., \\\\(A \\times B\\\\)). Result is a vector. Both Vector A and Vector B MUST be 3D vectors. If not, result is an error string "Error: Cross product is only defined for 3D vectors." For \\\\(A = [A_x, A_y, A_z]\\\\) and \\\\(B = [B_x, B_y, B_z]\\\\), the result is \\\\([A_y B_z - A_z B_y, A_z B_x - A_x B_z, A_x B_y - A_y B_x]\\\\).
- angleBetween: Calculate the angle in RADIANS between Vector A and Vector B. Formula: \\\\(\\theta = \\arccos\\left(\\frac{A \\cdot B}{|A| |B|}\\right)\\\\\). Result is a number (radians). If either vector is a zero vector, result is an error string "Error: Angle is undefined for zero vectors." Vectors must have the same dimension.

Ensure mathematical notation in 'steps' is always wrapped in \\\\(...\\\\).
The 'originalQuery' field in the output should be an echo of the input you received.
If an input vector is empty or invalid based on the operation, the 'result' should be an error string.
`;

const vectorOperationPrompt = ai.definePrompt({
    name: 'vectorOperationPrompt',
    model: 'googleai/gemini-2.0-flash',
    input: { schema: VectorOperationInputSchema },
    output: { schema: VectorOperationOutputSchema.omit({ originalQuery: true }) }, 
    system: systemPrompt,
    prompt: `Vector A: {{{JSON.stringify vectorA}}}
    {{#if vectorB}}Vector B: {{{JSON.stringify vectorB}}}{{/if}}
    {{#if scalarValue}}Scalar: {{{scalarValue}}}{{/if}}
    Operation: {{{operation}}}

    Perform the operation '{{{operation}}}' based on the system instructions.
    Return the 'result' as a number, an array of numbers, or an error string.
    Provide detailed 'steps', ensuring all mathematical notation is wrapped in \\\\(...\\\\) delimiters.`,
    config: {
        temperature: 0.1,
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
    }
});

const performVectorOperationFlow = ai.defineFlow(
  {
    name: 'performVectorOperationFlow',
    inputSchema: VectorOperationInputSchema,
    outputSchema: VectorOperationOutputSchema,
  },
  async (input) => {
    // Basic input validation that might be too complex for Zod schema alone for some ops
    if ((input.operation === 'add' || input.operation === 'subtract' || input.operation === 'dotProduct' || input.operation === 'angleBetween') && !input.vectorB) {
        return { result: `Error: Vector B is required for ${input.operation} operation.`, originalQuery: input };
    }
    if (input.operation === 'scalarMultiplyA' && typeof input.scalar !== 'number') {
        return { result: "Error: Scalar value is required for scalar multiplication.", originalQuery: input };
    }
    if (input.operation === 'crossProduct' && (!input.vectorB || input.vectorA.length !== 3 || input.vectorB.length !== 3)) {
        return { result: "Error: Cross product is defined only for two 3D vectors.", originalQuery: input };
    }
    if ((input.operation === 'add' || input.operation === 'subtract' || input.operation === 'dotProduct' || input.operation === 'angleBetween') && input.vectorB && input.vectorA.length !== input.vectorB.length) {
        return { result: "Error: Vectors must have the same dimension for this operation.", originalQuery: input };
    }
    
    const promptInput = {
      ...input,
    };

    const { output } = await vectorOperationPrompt(promptInput);
    if (!output || output.result === undefined) { 
        throw new Error('AI model did not return valid output (result field missing) for vector operation.');
    }
    
    return {
        result: output.result, 
        steps: output.steps,
        originalQuery: input,
    };
  }
);

