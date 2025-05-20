
'use server';
/**
 * @fileOverview Solves differential equations using an AI model.
 *
 * - solveDifferentialEquation - A function that handles DE solving.
 * - DESolutionInput - The input type for the solveDifferentialEquation function.
 * - DESolutionOutput - The return type for the solveDifferentialEquation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DESolutionInputSchema = z.object({
  equationString: z.string().describe('The differential equation to solve (e.g., "y\' + 2*y = x", "y\'\' - y = 0").'),
  dependentVariable: z.string().default('y').describe('The dependent variable (e.g., "y").'),
  independentVariable: z.string().default('x').describe('The independent variable (e.g., "x").'),
  initialConditions: z.array(z.object({
    condition: z.string().describe('The initial condition expression (e.g., "y(0)", "y\'(1)").'),
    value: z.string().describe('The value for the initial condition (e.g., "1", "0").')
  })).optional().describe('Optional initial conditions for an Initial Value Problem (IVP).')
});
export type DESolutionInput = z.infer<typeof DESolutionInputSchema>;

export const DESolutionOutputSchema = z.object({
  classification: z.string().describe('The classification of the differential equation (e.g., "First-Order Linear", "Second-Order Homogeneous with Constant Coefficients").'),
  solutionMethod: z.string().describe('The primary method used to solve the differential equation (e.g., "Integrating Factor", "Characteristic Equation").'),
  generalSolution: z.string().optional().describe('The general solution of the DE, formatted in LaTeX. Include constants like C, C1, C2. Use inline KaTeX delimiters \\(...\\). This might be omitted if only a particular solution is found or relevant.'),
  particularSolution: z.string().optional().describe('The particular solution if initial conditions were provided and a unique solution is found, formatted in LaTeX. Use inline KaTeX delimiters \\(...\\).'),
  steps: z.string().describe("A detailed step-by-step explanation of how the solution was obtained. For each step, clearly state the mathematical rule or principle applied (e.g., \"Separating variables\", \"Applying integrating factor IF = e^(integral(P(x)dx))\", \"Solving the characteristic equation r^2 - 1 = 0\"). Format as readable text. Mathematical expressions within steps should be written in simple LaTeX and enclosed in inline KaTeX delimiters \\(...\\)."),
  plotHint: z.string().optional().describe('A brief textual description of what a plot of the solution(s) might show (e.g., "A family of exponential curves", "A sinusoidal wave satisfying the initial condition y(0)=1").'),
  originalQuery: DESolutionInputSchema.describe("An echo of the original input parameters for the DE solving request."),
});
export type DESolutionOutput = z.infer<typeof DESolutionOutputSchema>;

export async function solveDifferentialEquation(input: DESolutionInput): Promise<DESolutionOutput> {
  return solveDifferentialEquationFlow(input);
}

const systemPrompt = `You are an expert mathematician specializing in solving ordinary differential equations (ODEs).
Given a differential equation, dependent and independent variables, and optional initial conditions, you will:
1.  **Classify the DE**: Determine its type (e.g., first-order linear, second-order homogeneous with constant coefficients, separable, exact).
2.  **Identify the Solution Method**: State the primary mathematical method suitable for solving this type of DE.
3.  **Provide a Detailed Step-by-Step Solution**:
    *   Clearly explain each step taken to arrive at the solution.
    *   For EACH step, you MUST explicitly state the mathematical rule, definition, theorem, or technique being applied (e.g., "Separation of variables", "Integrating factor method", "Method of undetermined coefficients", "Finding roots of the characteristic equation").
    *   All mathematical formulas, variables, and expressions within the steps MUST be written in simple LaTeX and enclosed in inline KaTeX delimiters, for example, \\(y' + P(x)y = Q(x)\\) or \\(\\int x dx = \\frac{x^2}{2}\\).
4.  **Provide the General Solution**: If applicable, present the general solution including constants of integration (e.g., C, C1, C2). Format this purely as a LaTeX expression using inline KaTeX delimiters \\(...\\).
5.  **Provide the Particular Solution**: If initial conditions are provided and a particular solution can be found, derive and present it. Format this purely as a LaTeX expression using inline KaTeX delimiters \\(...\\). If only a particular solution is relevant (e.g. definite answer from IVP), general solution might be omitted.
6.  **Provide a Plot Hint**: Briefly describe what a plot of the solution(s) might look like.

-   The 'generalSolution' and 'particularSolution' fields in your output MUST contain ONLY the resulting mathematical expression. Do not include any explanations, apologies, or conversational text in these fields. Ensure they are suitable for direct KaTeX rendering.
-   The 'steps' field should be a comprehensive explanation.
-   The 'originalQuery' field should accurately reflect the input parameters.

Handle common notations for derivatives: y', dy/dx, y'', d^2y/dx^2.
The independent variable is usually 'x' and dependent is 'y', unless specified otherwise.
If initial conditions are given, use them to find the particular solution. If not, provide the general solution.
If the DE is too complex or beyond standard solvable forms with elementary methods, clearly state that and explain why.
`;

const solveDifferentialEquationPrompt = ai.definePrompt({
  name: 'solveDifferentialEquationPrompt',
  input: {schema: DESolutionInputSchema},
  output: {schema: DESolutionOutputSchema},
  system: systemPrompt,
  prompt: \`Differential Equation: {{{equationString}}}
Dependent Variable: {{{dependentVariable}}}
Independent Variable: {{{independentVariable}}}
{{#if initialConditions.length}}
Initial Conditions:
{{#each initialConditions}}
  - {{{this.condition}}} = {{{this.value}}}
{{/each}}
{{else}}
No initial conditions provided.
{{/if}}

Analyze and solve the differential equation based on the details above.
Provide:
- Classification
- Solution Method
- General Solution (if applicable, using \\(...\\) LaTeX delimiters)
- Particular Solution (if IVP, using \\(...\\) LaTeX delimiters)
- Detailed Steps (stating rule for each step, using \\(...\\) LaTeX for math in steps)
- Plot Hint
- Echo of originalQuery

Ensure all LaTeX is correctly delimited for KaTeX (primarily inline \\(...\\) for solutions and steps).
The 'steps' need to be very explicit about the mathematical rule applied at each stage.\`,
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

const solveDifferentialEquationFlow = ai.defineFlow(
  {
    name: 'solveDifferentialEquationFlow',
    inputSchema: DESolutionInputSchema,
    outputSchema: DESolutionOutputSchema,
  },
  async (input) => {
    const {output} = await solveDifferentialEquationPrompt(input);
    if (!output) {
      throw new Error('AI model did not return a valid output for the differential equation.');
    }
    return {
        ...output,
        originalQuery: input
    };
  }
);

    