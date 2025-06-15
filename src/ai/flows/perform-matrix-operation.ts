
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
      'The result of the matrix operation. This could be a scalar number (as a string e.g. "5"), a string representation of the result matrix (e.g., "[[1,2],[3,4]]"), or a descriptive message. For decompositions (LU, QR, SVD), describe the resulting matrices using inline KaTeX for math notation.'
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
  - If the result is a matrix, return it as a stringified 2D array (e.g., "[[5,6],[7,8]]"). This stringified array should be directly parsable by JSON.parse().
  - For decompositions (LU, QR, SVD) or other descriptive results, if mathematical notation or matrices are part of the description in the 'result' field, they MUST be formatted using inline MathJax/KaTeX delimiters \\(...\\) (e.g., "L = \\(\\begin{bmatrix} 1 & 0 \\\\ 0.5 & 1 \\end{bmatrix}\\), U = \\(\\begin{bmatrix} 2 & 4 \\\\ 0 & 1 \\end{bmatrix}\\)"). Do NOT return a JSON stringified matrix in this case, use the descriptive KaTeX format.
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
- eigenvaluesA: Eigenvalues of Matrix A (must be square). List them comma-separated if multiple (e.g., "2, 5.5") within the 'result' string.
- eigenvectorsA: Eigenvectors of Matrix A (must be square). Represent each eigenvector as a stringified array or using KaTeX notation within the 'result' string.
- charPolynomialA: Characteristic polynomial of Matrix A (must be square). Present as a string in terms of lambda, e.g., "\\(\\lambda^2 - Tr(A)\\lambda + Det(A)\\)".
- luDecompositionA: LU decomposition of Matrix A. Output L and U matrices in the 'result' field using descriptive KaTeX format.
- qrDecompositionA: QR decomposition of Matrix A. Output Q and R matrices in the 'result' field using descriptive KaTeX format.
- svdDecompositionA: Singular Value Decomposition of Matrix A. Output U, Sigma (as a vector of singular values or a diagonal matrix), and V^T matrices in the 'result' field using descriptive KaTeX format.

Be precise with matrix formatting in the result when returning a JSON stringified matrix.
`;

const matrixOperationPrompt = ai.definePrompt({
  name: 'matrixOperationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
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
Ensure all mathematical expressions in 'steps' are formatted with inline MathJax/KaTeX delimiters \\(...\\).
For descriptive 'result' outputs (like decompositions), use inline KaTeX delimiters \\(...\\) for all mathematical notation.`,
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
    if (!output || !output.result || output.result.trim() === "") {
      // Fallback if AI gives truly empty or null result, which schema might allow if nullable was used
      // but our current schema makes 'result' required string.
      // This check handles if result is empty string.
      console.error("performMatrixOperationFlow: AI returned an empty or null result string.");
      return {
        result: "AI failed to produce a result for this operation.",
        originalQuery: input,
        steps: "No steps available due to AI error."
      };
    }
    return {
        ...output,
        originalQuery: input
    };
  }
);
