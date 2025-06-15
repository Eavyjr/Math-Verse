
'use server';
/**
 * @fileOverview Solves differential equations using an AI model, providing structured output.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const DESolutionInputSchema = z.object({
  equationString: z.string().describe('The differential equation to solve (e.g., "dy/dx = y", "y\'\' + y = sin(x)").'),
  dependentVariable: z.string().default('y').describe('The dependent variable (e.g., "y").'),
  independentVariable: z.string().default('x').describe('The independent variable (e.g., "x").'),
  initialConditions: z.array(z.string()).optional().describe('Optional initial conditions, each as a string like "y(0)=1", "y\'(0)=0".'),
});
export type DESolutionInput = z.infer<typeof DESolutionInputSchema>;

const DESolutionOutputSchema = z.object({
  classification: z.string().nullable().describe('The type of differential equation identified (e.g., "First-Order Linear", "Second-Order Homogeneous with Constant Coefficients").'),
  solutionMethod: z.string().nullable().describe('The primary method used to solve the DE (e.g., "Separation of Variables", "Integrating Factor", "Characteristic Equation").'),
  generalSolution: z.string().nullable().describe("The general solution to the DE, formatted in LaTeX. Include constants like C, C1, C2 as needed. Example: \\(y(x) = C e^x\\)"),
  particularSolution: z.string().optional().nullable().describe("The particular solution if initial conditions were provided and a unique solution is found, formatted in LaTeX. Example: \\(y(x) = 2e^x - x\\)"),
  steps: z.string().nullable().describe("A detailed step-by-step explanation of how the solution was obtained. Each step should clearly state the mathematical rule or principle applied. Mathematical expressions within steps should be in inline LaTeX using \\(...\\) delimiters. Example: Step 1: Identify the type of DE. This is a first-order linear DE of the form \\(y' + P(x)y = Q(x)\\)..."),
  plotHint: z.string().optional().nullable().describe("A brief textual description of what a plot of the solution(s) might look like (e.g., 'A family of exponential curves', 'A sinusoidal wave')."),
  originalQuery: DESolutionInputSchema.describe("An echo of the input parameters received."),
});
export type DESolutionOutput = z.infer<typeof DESolutionOutputSchema>;

const systemPrompt = `You are an expert calculus assistant specializing in solving differential equations.
Your task is to analyze the given differential equation, solve it, and provide a structured response including classification, method, solutions, and detailed steps.

Input Details:
- Equation: The differential equation string. You should be able to understand common derivative notations like y', dy/dx, y'', d^2y/dx^2, etc. Unless specified otherwise by the 'Dependent Variable' and 'Independent Variable' fields below, assume the dependent variable (often 'y') is a function of the independent variable (often 'x'), i.e., y = y(x).
- Dependent Variable: The main function variable (e.g., y).
- Independent Variable: The variable the function depends on (e.g., x).
- Initial Conditions: Optional. If provided, use them to find a particular solution.

Output Requirements (Provide all fields if possible, use null for a field if not applicable or cannot be determined):
1.  **classification**: Classify the DE (e.g., "First-Order Separable", "Second-Order Linear Homogeneous with Constant Coefficients").
2.  **solutionMethod**: State the primary method used (e.g., "Separation of Variables", "Integrating Factor", "Method of Undetermined Coefficients").
3.  **generalSolution**: Provide the general solution in LaTeX format. Include constants (C, C1, C2, etc.) as needed. Example: "y(x) = C e^x".
4.  **particularSolution**: If initial conditions are given AND a unique particular solution is found, provide it in LaTeX format. Example: "y(x) = 2e^x - x". If no ICs, or if they don't lead to a unique solution, this can be null.
5.  **steps**: Provide a comprehensive, step-by-step derivation of the solution, from start to finish.
    *   Start from identifying the equation type and method.
    *   Clearly state the mathematical rule, definition, or principle applied at each stage (e.g., "Integrating both sides...", "Applying the integrating factor \\(e^{\\int P(x)dx}\\)...", "Finding roots of the characteristic equation...").
    *   Show all significant intermediate calculations.
    *   Ensure mathematical expressions within the steps are formatted using inline LaTeX delimiters: \\(...\\). For example, a fraction should be \\(\\frac{a}{b}\\) and an exponent should be \\(x^2\\).
    *   The explanation should be detailed enough for a student to follow and should not be truncated.
6.  **plotHint**: A brief textual description of what a plot of the general solution (e.g., family of curves) or particular solution (a specific curve) might look like.

Ensure all LaTeX output for 'generalSolution' and 'particularSolution' fields is *only* the mathematical expression, without any surrounding text or delimiters. Mathematical notation within the 'steps' field *must* use \\(...\\) delimiters.
If the equation is too complex or unsolvable with standard methods, clearly state that in the 'classification' or 'steps' field and provide any possible simplification or analysis.
`;

const solveDifferentialEquationPrompt = ai.definePrompt({
  name: 'solveDifferentialEquationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: DESolutionInputSchema },
  output: {
    schema: DESolutionOutputSchema, 
  },
  prompt: systemPrompt + // Using system prompt in the main prompt for some models
  `
---
Solve the following differential equation based on the details provided:

Differential Equation: {{{equationString}}}
Dependent Variable: {{{dependentVariable}}}
Independent Variable: {{{independentVariable}}}
{{#if initialConditions.length}}
Initial Conditions:
{{#each initialConditions}}
- {{{this}}}
{{/each}}
{{else}}
No initial conditions provided (find general solution).
{{/if}}
---

Provide the structured output as specified in the system instructions.
`,
  config: {
    temperature: 0.2,
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, // Adjusted to MEDIUM from HIGH
    ],
  }
});

export async function solveDifferentialEquation(input: DESolutionInput): Promise<DESolutionOutput> {
  console.log("Calling solveDifferentialEquationPrompt with input:", input);
  const response = await solveDifferentialEquationPrompt(input);
  const output = response.output;

  if (output === null || output === undefined) {
    throw new Error('AI model did not return a valid solution (received null or undefined). This could be due to the complexity or phrasing of the equation, or safety filters. Please try rephrasing, simplifying the equation, or checking if the content might be restricted.');
  }

  // Check if all key informational fields are null or empty
  const allKeyFieldsEmpty = 
    (output.classification === null || (typeof output.classification === 'string' && output.classification.trim() === "")) &&
    (output.solutionMethod === null || (typeof output.solutionMethod === 'string' && output.solutionMethod.trim() === "")) &&
    (output.generalSolution === null || (typeof output.generalSolution === 'string' && output.generalSolution.trim() === "")) &&
    (output.particularSolution === null || output.particularSolution === undefined || (typeof output.particularSolution === 'string' && output.particularSolution.trim() === "")) &&
    (output.steps === null || (typeof output.steps === 'string' && output.steps.trim() === ""));

  if (allKeyFieldsEmpty) {
    throw new Error('AI model returned a response, but all key information fields (classification, method, solution, steps) were empty or null. Please try a different or more specific equation.');
  }
  
  return {...output, originalQuery: input };
}
