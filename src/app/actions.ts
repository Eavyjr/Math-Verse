
'use server';

import { classifyExpression, type ClassifyExpressionInput, type ClassifyExpressionOutput } from '@/ai/flows/classify-expression';
import { performAlgebraicOperation, type AlgebraicOperationInput, type AlgebraicOperationOutput } from '@/ai/flows/perform-algebraic-operation';

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
    const input: ClassifyExpressionInput = { expression };
    const result = await classifyExpression(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error classifying expression:', e);
    let errorMessage = 'An error occurred while processing your request. Please try again.';
    if (e instanceof Error) {
        if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this expression. Please try a different expression or operation.';
        } else {
            errorMessage = e.message; // Or a generic message
        }
    }
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
             // Potentially sensitive error messages should not be directly exposed.
             // Consider logging e.message server-side and returning a generic client-facing error.
            errorMessage = `An AI processing error occurred. Please check your expression or try again. Details: ${e.message}`;
        }
    }
    return { data: null, error: errorMessage };
  }
}
