
'use server';

import { classifyExpression, type ClassifyExpressionInput, type ClassifyExpressionOutput } from '@/ai/flows/classify-expression';
import { performAlgebraicOperation, type AlgebraicOperationInput, type AlgebraicOperationOutput } from '@/ai/flows/perform-algebraic-operation';
import { performIntegration, type IntegrationInput, type IntegrationOutput } from '@/ai/flows/perform-integration-flow';
import { performDifferentiation, type DifferentiationInput, type DifferentiationOutput } from '@/ai/flows/perform-differentiation-flow';
import { solveDifferentialEquation, type DESolutionInput, type DESolutionOutput } from '@/ai/flows/solve-differential-equation-flow';
import { performMatrixOperation, type MatrixOperationInput, type MatrixOperationOutput } from '@/ai/flows/perform-matrix-operation';

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

export async function handleClassifyExpressionAction(
  expression: string
): Promise<ActionResult<ClassifyExpressionOutput>> {
  if (!expression || expression.trim() === '') {
    return { data: null, error: 'Expression cannot be empty.' };
  }

  try {
    console.log("handleClassifyExpressionAction: Calling classifyExpression flow for:", expression);
    const input: ClassifyExpressionInput = { expression };
    const result = await classifyExpression(input);
    console.log("handleClassifyExpressionAction: Received result from flow:", result);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error in handleClassifyExpressionAction:', e);
    let errorMessage = 'An error occurred while processing your request. Please try again.';
    if (e instanceof Error) {
        if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output') || e.message.includes('not available due to model error')) {
            errorMessage = 'The AI model could not process this expression. Please try a different expression.';
        } else {
            errorMessage = e.message || 'An unknown error occurred during classification.';
        }
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    console.error("handleClassifyExpressionAction: Returning error:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

export async function handlePerformAlgebraicOperationAction(
  expression: string,
  operation: AlgebraicOperationInput['operation']
): Promise<ActionResult<AlgebraicOperationOutput>> {
  if (!expression || expression.trim() === '') {
    return { data: null, error: 'Expression cannot be empty.' };
  }
  if (!operation) {
    return { data: null, error: 'Operation must be selected.' };
  }

  try {
    const input: AlgebraicOperationInput = { expression, operation };
    const result = await performAlgebraicOperation(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error performing algebraic operation:', e);
    let errorMessage = 'An error occurred while performing the operation. Please try again.';
     if (e instanceof Error) {
        if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this expression with this operation. Please try a different expression or operation.';
        } else {
            errorMessage = `An AI processing error occurred. Please check your expression or try again. Details: ${e.message}`;
        }
    }
    return { data: null, error: errorMessage };
  }
}

export async function handlePerformIntegrationAction(
  input: IntegrationInput
): Promise<ActionResult<IntegrationOutput>> {
  if (!input.functionString || input.functionString.trim() === '') {
    return { data: null, error: 'Function to integrate cannot be empty.' };
  }
  if (input.isDefinite) {
    if (!input.lowerBound || input.lowerBound.trim() === '') {
      return { data: null, error: 'Lower bound is required for definite integrals.' };
    }
    if (!input.upperBound || input.upperBound.trim() === '') {
      return { data: null, error: 'Upper bound is required for definite integrals.' };
    }
  }

  try {
    const result = await performIntegration(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error performing integration:', e);
    let errorMessage = 'An error occurred while performing the integration. Please try again.';
     if (e instanceof Error) {
        if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this integration. Please try a different function or check your bounds.';
        } else {
            errorMessage = `An AI processing error occurred. Please check your input or try again. Details: ${e.message}`;
        }
    }
    return { data: null, error: errorMessage };
  }
}

export async function handlePerformDifferentiationAction(
  input: DifferentiationInput
): Promise<ActionResult<DifferentiationOutput>> {
  if (!input.functionString || input.functionString.trim() === '') {
    return { data: null, error: 'Function to differentiate cannot be empty.' };
  }
  if (!input.variable || input.variable.trim() === '') {
    return { data: null, error: 'Variable of differentiation cannot be empty.' };
  }
  if (input.order < 1) {
    return { data: null, error: 'Order of derivative must be at least 1.' };
  }

  try {
    const result = await performDifferentiation(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error performing differentiation:', e);
    let errorMessage = 'An error occurred while performing the differentiation. Please try again.';
     if (e instanceof Error) {
        if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this differentiation. Please try a different function or order.';
        } else {
            errorMessage = `An AI processing error occurred. Please check your input or try again. Details: ${e.message}`;
        }
    }
    return { data: null, error: errorMessage };
  }
}

export async function handleSolveDifferentialEquationAction(
  input: DESolutionInput // Input type matches the updated DESolutionInputSchema
): Promise<ActionResult<DESolutionOutput>> { // Output type matches the updated DESolutionOutputSchema
  if (!input.equationString || input.equationString.trim() === '') {
    return { data: null, error: 'Differential equation cannot be empty.' };
  }
   if (!input.dependentVariable || input.dependentVariable.trim() === '') {
    return { data: null, error: 'Dependent variable cannot be empty.' };
  }
   if (!input.independentVariable || input.independentVariable.trim() === '') {
    return { data: null, error: 'Independent variable cannot be empty.' };
  }
  if (input.initialConditions) {
    for (const ic of input.initialConditions) {
      if (!ic || ic.trim() === '') { // Check if individual IC string is empty
        return { data: null, error: 'Initial condition string cannot be empty if provided.' };
      }
    }
  }

  try {
    const result = await solveDifferentialEquation(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error solving differential equation:', e);
    let errorMessage = 'An error occurred while solving the differential equation. Please try again.';
    if (e instanceof Error) {
      if (e.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (e.message.includes('model did not return a valid solution') || e.message.includes('received null or undefined') || e.message.includes('empty or whitespace-only') || e.message.includes('empty or insufficient response')) {
        errorMessage = 'The AI model could not process this differential equation. Please check your input or try a simpler equation. Details: ' + e.message;
      } else {
        errorMessage = `An AI processing error occurred. Details: ${e.message}`;
      }
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    return { data: null, error: errorMessage };
  }
}

export async function handlePerformMatrixOperationAction(
  matrixA: number[][],
  operation: MatrixOperationInput['operation'],
  matrixB?: number[][],
  scalarValue?: number
): Promise<ActionResult<MatrixOperationOutput>> {
  if (!matrixA || matrixA.length === 0 || matrixA[0].length === 0) {
    return { data: null, error: 'Matrix A cannot be empty.' };
  }
  if (!operation) {
    return { data: null, error: 'Operation must be selected.' };
  }

  const matrixAString = JSON.stringify(matrixA);
  let matrixBString: string | undefined = undefined;
  if (['add', 'subtract', 'multiply'].includes(operation)) {
    if (!matrixB || matrixB.length === 0 || matrixB[0].length === 0) {
      return { data: null, error: `Matrix B is required for operation: ${operation}.` };
    }
    matrixBString = JSON.stringify(matrixB);
  }

  if (operation === 'scalarMultiply') {
    if (scalarValue === undefined || scalarValue === null || isNaN(scalarValue)) {
        return { data: null, error: 'A valid scalar value is required for scalar multiplication.' };
    }
  }

  const input: MatrixOperationInput = {
    matrixAString,
    operation,
    ...(matrixBString && { matrixBString }),
    ...(scalarValue !== undefined && { scalarValue }),
  };

  try {
    const result = await performMatrixOperation(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error performing matrix operation:', e);
    let errorMessage = 'An error occurred while performing the matrix operation. Please try again.';
     if (e instanceof Error) {
        if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this matrix operation. Please check your input.';
        } else {
            errorMessage = `An AI processing error occurred. Details: ${e.message}`;
        }
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    return { data: null, error: errorMessage };
  }
}
