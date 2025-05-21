
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import katex from 'katex';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { ArrowLeft, BarChartHorizontalBig, PlusCircle, Trash2, Calculator, Sigma, Ratio, Brain, XCircle, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Helper function to render a single LaTeX string to HTML
const renderMath = (latexString: string | undefined, displayMode: boolean = false): string => {
  if (latexString === undefined || latexString === null) return "";
  try {
    return katex.renderToString(latexString, {
      throwOnError: false,
      displayMode: displayMode,
    });
  } catch (e) {
    console.error("Katex rendering error:", e);
    return latexString; // Fallback to raw string on error
  }
};

const initialMatrix = () => [[0, 0], [0, 0]];

export default function MatrixOperationsPage() {
  const { toast } = useToast();
  const [matrixA, setMatrixA] = useState<number[][]>(initialMatrix());
  const [matrixB, setMatrixB] = useState<number[][]>(initialMatrix());
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [result, setResult] = useState<number[][] | number | string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const operations = [
    {
      label: "Basic Operations",
      options: [
        { value: "add", label: "Addition (A + B)" },
        { value: "subtract", label: "Subtraction (A - B)" },
        { value: "scalarMultiply", label: "Scalar Multiplication (k * A)" }, // Will need scalar input
        { value: "multiply", label: "Matrix Multiplication (A * B)" },
        { value: "transposeA", label: "Transpose (A)" },
        { value: "determinantA", label: "Determinant (A)" },
        { value: "inverseA", label: "Inverse (A)" },
        { value: "rankA", label: "Rank (A)" },
      ]
    },
    {
      label: "Advanced Operations",
      options: [
        { value: "eigenvaluesA", label: "Eigenvalues (A)" },
        { value: "eigenvectorsA", label: "Eigenvectors (A)" },
        { value: "charPolynomialA", label: "Characteristic Polynomial (A)" },
        { value: "luDecompositionA", label: "LU Decomposition (A)" },
        { value: "qrDecompositionA", label: "QR Decomposition (A)" },
        { value: "svdDecompositionA", label: "SVD Decomposition (A)" },
      ]
    }
  ];

  const handleMatrixChange = (
    matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const numValue = parseFloat(value);
    matrixSetter(prevMatrix => {
      const newMatrix = prevMatrix.map(row => [...row]);
      newMatrix[rowIndex][colIndex] = isNaN(numValue) ? 0 : numValue;
      return newMatrix;
    });
    setError(null);
    setResult(null);
  };

  const addRow = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, matrix: number[][]) => {
    const numCols = matrix.length > 0 ? matrix[0].length : 1; // Default to 1 column if matrix is empty
    matrixSetter(prev => [...prev, Array(numCols).fill(0)]);
  };

  const removeRow = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, matrix: number[][]) => {
    if (matrix.length > 1) {
      matrixSetter(prev => prev.slice(0, -1));
    } else {
      toast({ title: "Cannot remove last row", variant: "destructive", description: "A matrix must have at least one row." });
    }
  };

  const addCol = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>) => {
     matrixSetter(prev => prev.map(row => [...row, 0]));
  };

  const removeCol = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, matrix: number[][]) => {
    if (matrix.length > 0 && matrix[0].length > 1) {
      matrixSetter(prev => prev.map(row => row.slice(0, -1)));
    } else {
       toast({ title: "Cannot remove last column", variant: "destructive", description: "A matrix must have at least one column." });
    }
  };

  const renderMatrixInput = (matrix: number[][], setMatrix: React.Dispatch<React.SetStateAction<number[][]>>, label: string) => (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-foreground mb-3">{label}</h3>
      <div className="space-y-2 overflow-x-auto">
        {matrix.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 items-center">
            {row.map((cell, colIndex) => (
              <Input
                key={colIndex}
                type="number"
                value={cell}
                onChange={(e) => handleMatrixChange(setMatrix, rowIndex, colIndex, e.target.value)}
                className="w-20 min-w-[5rem] text-center border-2 focus:border-accent focus:ring-accent"
                aria-label={`${label} row ${rowIndex + 1} col ${colIndex + 1}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => addRow(setMatrix, matrix)}><PlusCircle className="mr-1 h-4 w-4" /> Row</Button>
        <Button variant="destructiveOutline" size="sm" onClick={() => removeRow(setMatrix, matrix)} disabled={matrix.length <=1}><Trash2 className="mr-1 h-4 w-4" /> Row</Button>
        <Button variant="outline" size="sm" onClick={() => addCol(setMatrix)}><PlusCircle className="mr-1 h-4 w-4" /> Col</Button>
        <Button variant="destructiveOutline" size="sm" onClick={() => removeCol(setMatrix, matrix)} disabled={matrix.length > 0 && matrix[0].length <=1}><Trash2 className="mr-1 h-4 w-4" /> Col</Button>
      </div>
    </Card>
  );
  
  const handleCalculate = () => {
    if (!selectedOperation) {
      setError("Please select an operation.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    // TODO: Implement actual matrix calculations using a library or Genkit AI flow
    setTimeout(() => {
      try {
        toast({ title: "Calculation (Placeholder)", description: `Performing ${selectedOperation}...` });
        if (selectedOperation === "add") {
          if (matrixA.length !== matrixB.length || (matrixA.length > 0 && matrixA[0].length !== matrixB[0].length)) {
            throw new Error("Matrices must have the same dimensions for addition.");
          }
          const res = matrixA.map((row, rIndex) => 
            row.map((cell, cIndex) => cell + matrixB[rIndex][cIndex])
          );
          setResult(res);
        } else if (selectedOperation === "determinantA") {
           // Basic placeholder for 2x2 determinant
          if (matrixA.length === 2 && matrixA[0].length === 2) {
            setResult(matrixA[0][0] * matrixA[1][1] - matrixA[0][1] * matrixA[1][0]);
          } else {
            throw new Error("Determinant placeholder only supports 2x2 matrices.");
          }
        } else if (selectedOperation === "transposeA") {
            if (matrixA.length === 0) {
                setResult([[]]);
                return;
            }
            const rows = matrixA.length;
            const cols = matrixA[0].length;
            const transposed = Array.from({ length: cols }, () => Array(rows).fill(0));
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    transposed[j][i] = matrixA[i][j];
                }
            }
            setResult(transposed);
        } else {
          setResult(`Result for ${selectedOperation} will appear here (placeholder).`);
        }
      } catch (e: any) {
        setError(e.message);
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleClear = () => {
    setMatrixA(initialMatrix());
    setMatrixB(initialMatrix());
    setSelectedOperation(null);
    setResult(null);
    setError(null);
  };

  const formatMatrixForDisplay = (matrix: number[][]): string => {
    return matrix.map(row => `[ ${row.map(cell => cell.toFixed(2)).join(',\t')} ]`).join('\n');
  };

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workstations
      </Link>

      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <BarChartHorizontalBig className="h-8 w-8 mr-3" />
            Matrix Operations
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Perform various matrix operations. Adjust rows/columns and see results.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {renderMatrixInput(matrixA, setMatrixA, "Matrix A")}
            {renderMatrixInput(matrixB, setMatrixB, "Matrix B (for binary operations)")}
          </div>

          <div className="space-y-2">
            <label htmlFor="operation-select" className="block text-md font-semibold text-foreground">
              Select Operation:
            </label>
            <Select
              value={selectedOperation || ""}
              onValueChange={(value) => {
                setSelectedOperation(value);
                setError(null);
                setResult(null);
              }}
            >
              <SelectTrigger id="operation-select" className="text-lg p-3 h-auto">
                <SelectValue placeholder="Choose an operation..." />
              </SelectTrigger>
              <SelectContent>
                {operations.map(group => (
                  <SelectGroup key={group.label}>
                    <SelectLabel className="text-md">{group.label}</SelectLabel>
                    {group.options.map(op => (
                      <SelectItem key={op.value} value={op.value} className="text-base">
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleCalculate}
              disabled={isLoading || !selectedOperation}
              size="lg"
              className="flex-grow"
            >
              {isLoading ? <Sigma className="mr-2 h-5 w-5 animate-spin" /> : <Calculator className="mr-2 h-5 w-5" />}
              Calculate
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              size="lg"
              className="flex-grow sm:flex-grow-0"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Clear All
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-8 rounded-md bg-muted">
              <Sigma className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-xl font-medium text-foreground">
                Calculating...
              </p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mt-6">
              <Calculator className="h-5 w-5" />
              <AlertTitle className="font-semibold">Operation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result !== null && !isLoading && !error && (
            <Card className="mt-6 border-accent border-t-4 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center text-primary">
                  <Brain className="h-7 w-7 mr-2"/>
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-lg">
                {typeof result === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMath(result, true) }} />
                ) : Array.isArray(result) ? (
                  <pre className="p-3 bg-muted rounded-md overflow-x-auto text-sm">
                    <code>{formatMatrixForDisplay(result)}</code>
                  </pre>
                ) : typeof result === 'number' ? (
                   <div dangerouslySetInnerHTML={{ __html: renderMath(result.toString(), true) }} />
                ) : <p className="text-muted-foreground">Result format not recognized.</p>}
                 <p className="mt-4 text-xs text-muted-foreground italic">
                  Results are displayed here. KaTeX rendering for matrices may be simplified.
                </p>
              </CardContent>
            </Card>
          )}
          
          <Card className="mt-8 bg-secondary/30">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5"/>Matrix Properties (Coming Soon)</CardTitle>
                <CardDescription>Characteristics of the input matrices (e.g., shape, symmetric, invertible) will be displayed here after input.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Placeholder for rank, dimensions, etc.</p>
            </CardContent>
          </Card>

          <Card className="mt-8 bg-secondary/30">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5"/>2x2 Matrix Visualization (Coming Soon)</CardTitle>
                <CardDescription>Visual representation of 2x2 matrices and transformations on vectors/grids.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
                    <Image 
                        src="https://placehold.co/300x150.png" 
                        alt="Matrix visualization placeholder" 
                        width={300} 
                        height={150}
                        data-ai-hint="matrix grid"
                        className="opacity-50 mb-2 rounded"
                    />
                    <p className="text-sm text-muted-foreground">Interactive visualization canvas for 2x2 matrices.</p>
                </div>
            </CardContent>
          </Card>

        </CardContent>
         <CardFooter className="p-6 bg-secondary/50 border-t">
            <p className="text-sm text-muted-foreground">
                Enter matrix values, select an operation, and view the results. More operations and features (like CSV upload, live validation, and detailed properties) coming soon.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
