
'use server';
/**
 * @fileOverview Performs matrix operations using an AI model.
 *
 * - performMatrixOperation - A function that handles various matrix calculations.
 * - MatrixOperationInput - The input type for the performMatrixOperation function.
 * - MatrixOperationOutput - The return type for the performMatrixOperation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatrixOperationInputSchema = z.object({
  matrixAString: z.string().describe('String representation of Matrix A, e.g., "[[1,2],[3,4]]".'),
  matrixBString: z.string().optional().describe('String representation of Matrix B (for binary operations).'),
  scalarValue: z.number().optional().describe('Scalar value for operations like scalar multiplication.'),
  operation: z
    .enum([
      'add',
      'subtract',
      'scalarMultiply',
      'multiply', // Matrix multiplication
      'transposeA',
      'determinantA',
      'inverseA',
      'rankA',
      'eigenvaluesA',
      'eigenvectorsA',
      'charPolynomialA',
      'luDecompositionA',
      'qrDecompositionA',
      'svdDecompositionA',
    ])
    .describe(
      'The matrix operation to perform.'
    ),
});
export type MatrixOperationInput = z.infer<typeof MatrixOperationInputSchema>;

const MatrixOperationOutputSchema = z.object({
  result: z
    .string()
    .describe(
      'The result of the matrix operation. This could be a scalar number, a string representation of the result matrix (e.g., "[[1,2],[3,4]]"), or a descriptive message. For decompositions (LU, QR, SVD), describe the resulting matrices.'
    ),
  steps: z.string().optional().describe("A detailed step-by-step explanation of how the result was obtained. For each step, clearly state the mathematical rule or principle applied. Use simple LaTeX for mathematical expressions within steps, ensuring they are wrapped in \\(...\\) delimiters."),
  originalQuery: MatrixOperationInputSchema.describe("The original input parameters for the operation."),
});
export type MatrixOperationOutput = z.infer<typeof MatrixOperationOutputSchema>;

export async function performMatrixOperation(
  input: MatrixOperationInput
): Promise<MatrixOperationOutput> {
  return performMatrixOperationFlow(input);
}

const systemPrompt = `You are an expert linear algebra assistant.
Given one or two matrices (as string representations of 2D arrays), a scalar value (if applicable), and a specified operation, perform the calculation.

- Input matrices will be provided as strings, e.g., "[[1, 2], [3, 4]]". You need to parse these.
- The 'result' field in your output MUST contain the result of the operation.
  - If the result is a scalar (e.g., determinant, rank), return it as a number string (e.g., "5").
  - If the result is a matrix, return it as a stringified 2D array (e.g., "[[5,6],[7,8]]").
  - For decompositions (LU, QR, SVD), describe the resulting matrices clearly. For example, "L = [[1,0],[0.5,1]], U = [[2,4],[0,1]]".
  - If an operation cannot be performed (e.g., inverse of a singular matrix, multiplication of incompatible matrices), provide a clear error message or explanation in the 'result' field. Do not just say "error".
- If possible and applicable, provide a detailed step-by-step explanation in the 'steps' field. For each step, clearly state the mathematical rule or principle applied. Use simple LaTeX for mathematical expressions within steps, such as those involving fractions or specific matrix elements, ensuring they are wrapped in inline MathJax/KaTeX delimiters \\(...\\).
- The 'originalQuery' field in the output should be an echo of the input you received.

Operation Specific Instructions:
- add: Matrix A + Matrix B. Ensure dimensions match.
- subtract: Matrix A - Matrix B. Ensure dimensions match.
- scalarMultiply: scalarValue * Matrix A.
- multiply: Matrix A * Matrix B (matrix multiplication). Ensure inner dimensions match.
- transposeA: Transpose of Matrix A.
- determinantA: Determinant of Matrix A (must be square).
- inverseA: Inverse of Matrix A (must be square and non-singular).
- rankA: Rank of Matrix A.
- eigenvaluesA: Eigenvalues of Matrix A (must be square). List them comma-separated if multiple (e.g., "2, 5.5").
- eigenvectorsA: Eigenvectors of Matrix A (must be square). Represent each eigenvector as a stringified array.
- charPolynomialA: Characteristic polynomial of Matrix A (must be square).
- luDecompositionA: LU decomposition of Matrix A. Output L and U matrices.
- qrDecompositionA: QR decomposition of Matrix A. Output Q and R matrices.
- svdDecompositionA: Singular Value Decomposition of Matrix A. Output U, Sigma (as a vector of singular values or a diagonal matrix), and V^T matrices.

Be precise with matrix formatting in the result. For example, for a 2x2 identity matrix, the result string should be "[[1,0],[0,1]]".
`;

const matrixOperationPrompt = ai.definePrompt({
  name: 'matrixOperationPrompt',
  input: {schema: MatrixOperationInputSchema},
  output: {schema: MatrixOperationOutputSchema},
  system: systemPrompt,
  prompt: `Matrix A: {{{matrixAString}}}
{{#if matrixBString}}Matrix B: {{{matrixBString}}}{{/if}}
{{#if scalarValue}}Scalar: {{{scalarValue}}}{{/if}}
Operation: {{{operation}}}

Perform the operation '{{{operation}}}'.
Return the result as specified (stringified matrix, number string, or descriptive text for decompositions/errors).
Provide detailed steps if applicable, stating the rule for each step.
Ensure 'originalQuery' in your output accurately reflects the input parameters.
Ensure all mathematical expressions in 'steps' are formatted with inline MathJax/KaTeX delimiters \\(...\\).`,
  config: {
    temperature: 0.1,
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const performMatrixOperationFlow = ai.defineFlow(
  {
    name: 'performMatrixOperationFlow',
    inputSchema: MatrixOperationInputSchema,
    outputSchema: MatrixOperationOutputSchema,
  },
  async (input) => {
    const {output} = await matrixOperationPrompt(input);
    if (!output) {
      throw new Error('AI model did not return a valid output for the matrix operation.');
    }
    return {
        ...output,
        originalQuery: input
    };
  }
);
