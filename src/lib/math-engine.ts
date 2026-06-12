/**
 * @fileOverview Deterministic math engine.
 *
 * Performs exact matrix and vector computations using mathjs instead of relying
 * on a language model. This guarantees correctness for well-defined operations.
 * Operations that mathjs cannot compute natively (QR, SVD, rank, characteristic
 * polynomial) report `handled: false` so callers can fall back to the AI flow.
 */

import {
  add,
  subtract,
  multiply,
  transpose,
  det,
  inv,
  eigs,
  lup,
  norm,
  dot,
  cross,
  divide,
  acos,
} from 'mathjs';

export type Matrix = number[][];
export type Vector = number[];

export interface EngineResult<T> {
  /** Whether the engine could compute this operation deterministically. */
  handled: boolean;
  /** The computed result (only meaningful when handled is true and error is null). */
  result?: T;
  /** A deterministic, human-readable explanation of the computation. */
  steps?: string;
  /** A validation/computation error message, if the operation is invalid. */
  error?: string;
}

/** Round floating point noise to a clean value (e.g. 0.9999999 -> 1). */
function clean(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round(value * 1e10) / 1e10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function cleanMatrix(m: Matrix): Matrix {
  return m.map((row) => row.map(clean));
}

function cleanVector(v: Vector): Vector {
  return v.map(clean);
}

/** Safely parse a "[[1,2],[3,4]]" style matrix string into a numeric 2D array. */
export function parseMatrix(input: string): Matrix {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error('Matrix must be valid JSON, e.g. "[[1,2],[3,4]]".');
  }
  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    !parsed.every(
      (row) =>
        Array.isArray(row) &&
        row.length > 0 &&
        row.every((n) => typeof n === 'number' && Number.isFinite(n))
    )
  ) {
    throw new Error('Matrix must be a non-empty 2D array of numbers.');
  }
  const width = (parsed[0] as number[]).length;
  if (!parsed.every((row) => (row as number[]).length === width)) {
    throw new Error('All matrix rows must have the same length.');
  }
  return parsed as Matrix;
}

const isSquare = (m: Matrix) => m.every((row) => row.length === m.length);

/**
 * Compute a matrix operation deterministically.
 * Returns `{ handled: false }` for operations not supported by mathjs.
 */
export function computeMatrixOperation(params: {
  matrixA: Matrix;
  matrixB?: Matrix;
  scalar?: number;
  operation: string;
}): EngineResult<string> {
  const { matrixA, matrixB, scalar, operation } = params;

  const asString = (value: unknown): string =>
    typeof value === 'number' ? String(clean(value)) : JSON.stringify(value);

  try {
    switch (operation) {
      case 'add':
      case 'subtract': {
        if (!matrixB) return { handled: true, error: 'Matrix B is required for this operation.' };
        if (matrixA.length !== matrixB.length || matrixA[0].length !== matrixB[0].length) {
          return { handled: true, error: 'Matrices must have the same dimensions to add or subtract.' };
        }
        const out = operation === 'add' ? add(matrixA, matrixB) : subtract(matrixA, matrixB);
        return {
          handled: true,
          result: asString(cleanMatrix(out as Matrix)),
          steps: `Performed element-wise ${operation === 'add' ? 'addition' : 'subtraction'} of two ${matrixA.length}x${matrixA[0].length} matrices.`,
        };
      }
      case 'scalarMultiply': {
        if (typeof scalar !== 'number') return { handled: true, error: 'A scalar value is required.' };
        const out = multiply(scalar, matrixA);
        return {
          handled: true,
          result: asString(cleanMatrix(out as Matrix)),
          steps: `Multiplied every entry of the matrix by the scalar ${scalar}.`,
        };
      }
      case 'multiply': {
        if (!matrixB) return { handled: true, error: 'Matrix B is required for multiplication.' };
        if (matrixA[0].length !== matrixB.length) {
          return { handled: true, error: 'Inner dimensions must match: columns of A must equal rows of B.' };
        }
        const out = multiply(matrixA, matrixB);
        return {
          handled: true,
          result: asString(cleanMatrix(out as Matrix)),
          steps: `Multiplied a ${matrixA.length}x${matrixA[0].length} matrix by a ${matrixB.length}x${matrixB[0].length} matrix using the row-by-column dot product rule.`,
        };
      }
      case 'transposeA': {
        const out = transpose(matrixA);
        return {
          handled: true,
          result: asString(cleanMatrix(out as Matrix)),
          steps: 'Swapped rows and columns so that entry (i, j) becomes entry (j, i).',
        };
      }
      case 'determinantA': {
        if (!isSquare(matrixA)) return { handled: true, error: 'Determinant requires a square matrix.' };
        return {
          handled: true,
          result: asString(clean(det(matrixA))),
          steps: 'Computed the determinant via cofactor/LU expansion.',
        };
      }
      case 'inverseA': {
        if (!isSquare(matrixA)) return { handled: true, error: 'Inverse requires a square matrix.' };
        if (clean(det(matrixA)) === 0) {
          return { handled: true, error: 'Matrix is singular (determinant is 0) and has no inverse.' };
        }
        const out = inv(matrixA);
        return {
          handled: true,
          result: asString(cleanMatrix(out as Matrix)),
          steps: 'Computed the inverse using Gauss-Jordan elimination (A multiplied by its inverse yields the identity matrix).',
        };
      }
      case 'eigenvaluesA': {
        if (!isSquare(matrixA)) return { handled: true, error: 'Eigenvalues require a square matrix.' };
        const { values } = eigs(matrixA) as { values: number[] };
        const cleaned = (values as number[]).map(clean);
        return {
          handled: true,
          result: cleaned.join(', '),
          steps: 'Solved the characteristic equation det(A - lambda*I) = 0 for lambda.',
        };
      }
      default:
        // rankA, eigenvectorsA, charPolynomialA, luDecompositionA, qrDecompositionA,
        // svdDecompositionA are delegated to the AI flow.
        return { handled: false };
    }
  } catch (e) {
    return {
      handled: true,
      error: e instanceof Error ? e.message : 'Failed to compute the matrix operation.',
    };
  }
}

/**
 * Compute a vector operation deterministically. All supported vector operations
 * are fully handled by mathjs.
 */
export function computeVectorOperation(params: {
  vectorA: Vector;
  vectorB?: Vector;
  scalar?: number;
  operation: string;
}): EngineResult<number | Vector> {
  const { vectorA, vectorB, scalar, operation } = params;
  const sameDim = vectorB ? vectorA.length === vectorB.length : false;

  try {
    switch (operation) {
      case 'magnitudeA':
        return {
          handled: true,
          result: clean(norm(vectorA) as number),
          steps: 'Magnitude = square root of the sum of squared components.',
        };
      case 'normalizeA': {
        const mag = norm(vectorA) as number;
        if (clean(mag) === 0) return { handled: true, error: 'Cannot normalize a zero vector.' };
        return {
          handled: true,
          result: cleanVector(divide(vectorA, mag) as Vector),
          steps: 'Divided each component by the vector magnitude to produce a unit vector.',
        };
      }
      case 'add':
      case 'subtract': {
        if (!vectorB) return { handled: true, error: 'Vector B is required for this operation.' };
        if (!sameDim) return { handled: true, error: 'Vectors must have the same dimension.' };
        const out = operation === 'add' ? add(vectorA, vectorB) : subtract(vectorA, vectorB);
        return {
          handled: true,
          result: cleanVector(out as Vector),
          steps: `Performed component-wise ${operation === 'add' ? 'addition' : 'subtraction'}.`,
        };
      }
      case 'scalarMultiplyA': {
        if (typeof scalar !== 'number') return { handled: true, error: 'A scalar value is required.' };
        return {
          handled: true,
          result: cleanVector(multiply(scalar, vectorA) as Vector),
          steps: `Multiplied each component by the scalar ${scalar}.`,
        };
      }
      case 'dotProduct': {
        if (!vectorB) return { handled: true, error: 'Vector B is required for the dot product.' };
        if (!sameDim) return { handled: true, error: 'Vectors must have the same dimension.' };
        return {
          handled: true,
          result: clean(dot(vectorA, vectorB) as number),
          steps: 'Summed the products of corresponding components.',
        };
      }
      case 'crossProduct': {
        if (!vectorB || vectorA.length !== 3 || vectorB.length !== 3) {
          return { handled: true, error: 'Cross product is only defined for two 3D vectors.' };
        }
        return {
          handled: true,
          result: cleanVector(cross(vectorA, vectorB) as Vector),
          steps: 'Applied the 3D cross product determinant formula.',
        };
      }
      case 'angleBetween': {
        if (!vectorB) return { handled: true, error: 'Vector B is required to measure an angle.' };
        if (!sameDim) return { handled: true, error: 'Vectors must have the same dimension.' };
        const magA = norm(vectorA) as number;
        const magB = norm(vectorB) as number;
        if (clean(magA) === 0 || clean(magB) === 0) {
          return { handled: true, error: 'Angle is undefined for zero vectors.' };
        }
        const cosTheta = Math.min(1, Math.max(-1, (dot(vectorA, vectorB) as number) / (magA * magB)));
        return {
          handled: true,
          result: clean(acos(cosTheta) as number),
          steps: 'Angle (radians) = arccos((A . B) / (|A| * |B|)).',
        };
      }
      default:
        return { handled: false };
    }
  } catch (e) {
    return {
      handled: true,
      error: e instanceof Error ? e.message : 'Failed to compute the vector operation.',
    };
  }
}
