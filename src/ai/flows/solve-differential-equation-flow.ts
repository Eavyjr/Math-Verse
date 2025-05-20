
'use server';
/**
 * @fileOverview Solves differential equations using an AI model.
 * This version uses a simplified prompt returning a single string.
 */

import {ai} from '@/ai/genkit'; 
import {z} from 'genkit';

// Schema matching the user-provided prompt's input
// This schema is now internal to the file and not exported directly.
const DESolutionInputSchema = z.object({
  equationString: z.string().describe('The differential equation to solve.'),
  dependentVariable: z.string().default('y').describe('The dependent variable.'),
  independentVariable: z.string().default('x').describe('The independent variable.'),
  initialConditions: z.array(z.string()).optional().describe('Optional initial conditions, each as a string like "y(0)=1".'),
});
export type DESolutionInput = z.infer<typeof DESolutionInputSchema>;

// Output is now a single string as per the user's prompt definition
export type DESolutionOutput = string;


// User-provided prompt definition
const solveDifferentialEquationPrompt = ai.definePrompt({
  name: 'solveDifferentialEquationPrompt', 
  inputSchema: DESolutionInputSchema,
  output: { 
    schema: z.string(),
  },
  system: 'You are a helpful math assistant that solves differential equations. Provide the solution and steps clearly.',
  prompt: `
Differential Equation: {{{equationString}}}
Dependent Variable: {{{dependentVariable}}}
Independent Variable: {{{independentVariable}}}
{{#if initialConditions.length}}
Initial Conditions:
{{#each initialConditions}}
- {{{this}}}
{{/each}}
{{/if}}

Solve the equation and provide the solution. If possible, include steps.
`,
  config: {
    temperature: 0.2,
     safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  }
});

// Exported async wrapper function to call the prompt
export async function solveDifferentialEquation(input: DESolutionInput): Promise<DESolutionOutput> {
  const response = await solveDifferentialEquationPrompt(input);
  const resultString = response.output;

  if (resultString === undefined || resultString === null) {
    throw new Error('AI model did not return a valid output for the differential equation.');
  }
  return resultString;
}

