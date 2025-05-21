
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { ArrowLeft, BarChartHorizontalBig, PlusCircle, Trash2, Calculator, Sigma, Ratio, Brain, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// TODO: Import a matrix library if needed, e.g., math.js

export default function MatrixOperationsPage() {
  const { toast } = useToast();
  const [matrixA, setMatrixA] = useState<number[][]>([[0, 0], [0, 0]]);
  const [matrixB, setMatrixB] = useState<number[][]>([[0, 0], [0, 0]]);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [result, setResult] = useState<number[][] | number | string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder for operations
  const operations = [
    { value: "add", label: "Addition (A + B)" },
    { value: "subtract", label: "Subtraction (A - B)" },
    { value: "multiply", label: "Multiplication (A * B)" },
    { value: "transposeA", label: "Transpose (A)" },
    { value: "determinantA", label: "Determinant (A)" },
    { value: "inverseA", label: "Inverse (A)" },
    // Add more operations here as per the spec
  ];

  const handleMatrixChange = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, rowIndex: number, colIndex: number, value: string) => {
    const numValue = parseFloat(value);
    matrixSetter(prevMatrix => {
      const newMatrix = prevMatrix.map(row => [...row]);
      newMatrix[rowIndex][colIndex] = isNaN(numValue) ? 0 : numValue; // Default to 0 if NaN
      return newMatrix;
    });
  };

  const addRow = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, matrix: number[][]) => {
    if (matrix.length > 0 && matrix[0].length > 0) {
        matrixSetter(prev => [...prev, Array(matrix[0].length).fill(0)]);
    } else {
        // Handle case for empty matrix or matrix with no columns (e.g., add a 1x1 row)
        matrixSetter(prev => [...prev, [0]]);
    }
  };

  const removeRow = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, matrix: number[][]) => {
    if (matrix.length > 1) {
      matrixSetter(prev => prev.slice(0, -1));
    }
  };

  const addCol = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>) => {
     matrixSetter(prev => prev.map(row => [...row, 0]));
  };

  const removeCol = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, matrix: number[][]) => {
    if (matrix.length > 0 && matrix[0].length > 1) {
      matrixSetter(prev => prev.map(row => row.slice(0, -1)));
    }
  };


  const renderMatrixInput = (matrix: number[][], setMatrix: React.Dispatch<React.SetStateAction<number[][]>>, label: string) => (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">{label}</h3>
      {matrix.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          {row.map((cell, colIndex) => (
            <Input
              key={colIndex}
              type="number"
              value={cell}
              onChange={(e) => handleMatrixChange(setMatrix, rowIndex, colIndex, e.target.value)}
              className="w-16 text-center"
            />
          ))}
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Button variant="outline" size="sm" onClick={() => addRow(setMatrix, matrix)}><PlusCircle className="mr-1 h-4 w-4" /> Row</Button>
        <Button variant="outline" size="sm" onClick={() => removeRow(setMatrix, matrix)} disabled={matrix.length <=1}><Trash2 className="mr-1 h-4 w-4" /> Row</Button>
        <Button variant="outline" size="sm" onClick={() => addCol(setMatrix)}><PlusCircle className="mr-1 h-4 w-4" /> Col</Button>
        <Button variant="outline" size="sm" onClick={() => removeCol(setMatrix, matrix)} disabled={matrix.length > 0 && matrix[0].length <=1}><Trash2 className="mr-1 h-4 w-4" /> Col</Button>
      </div>
    </div>
  );

  const handleCalculate = () => {
    if (!selectedOperation) {
      setError("Please select an operation.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    // TODO: Implement actual matrix calculations using a library or custom logic
    // This is a placeholder for now
    setTimeout(() => {
      try {
        toast({ title: "Calculation (Placeholder)", description: `Performing ${selectedOperation}...` });
        if (selectedOperation === "add") {
          // Basic placeholder for addition - assumes matrices are compatible
          if (matrixA.length !== matrixB.length || matrixA[0].length !== matrixB[0].length) {
            throw new Error("Matrices must have the same dimensions for addition.");
          }
          const res = matrixA.map((row, rIndex) => 
            row.map((cell, cIndex) => cell + matrixB[rIndex][cIndex])
          );
          setResult(res);
        } else {
          setResult(`Result for ${selectedOperation} will appear here.`);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleClear = () => {
    setMatrixA([[0,0],[0,0]]);
    setMatrixB([[0,0],[0,0]]);
    setSelectedOperation(null);
    setResult(null);
    setError(null);
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
            Perform various matrix operations, from basic arithmetic to complex decompositions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <SelectGroup>
                  <SelectLabel>Matrix Operations</SelectLabel>
                  {operations.map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
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
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-lg">
                {typeof result === 'string' ? (
                  <p>{result}</p>
                ) : Array.isArray(result) ? (
                  <div className="space-y-1">
                    {result.map((row, rIndex) => (
                      <div key={rIndex} className="flex gap-2">
                        <span className="font-mono">[</span>
                        {row.map((cell, cIndex) => (
                          <span key={cIndex} className="font-mono w-12 text-center">
                            {cell.toFixed(2)} {/* Basic formatting */}
                          </span>
                        ))}
                        <span className="font-mono">]</span>
                      </div>
                    ))}
                  </div>
                ) : typeof result === 'number' ? (
                   <p className="font-mono text-xl">{result.toFixed(4)}</p>
                ) : <p>Result format not recognized.</p>}
                 <p className="mt-4 text-xs text-muted-foreground italic">
                  Matrix results are displayed here. KaTeX rendering for matrices coming soon.
                </p>
              </CardContent>
            </Card>
          )}
          
          <Card className="mt-8">
            <CardHeader>
                <CardTitle className="text-xl">Matrix Properties (Coming Soon)</CardTitle>
                <CardDescription>Characteristics of the input matrices will be displayed here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Details like rank, dimensions, etc.</p>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
                <CardTitle className="text-xl">2x2 Matrix Visualization (Coming Soon)</CardTitle>
                <CardDescription>Visual representation of 2x2 matrices and transformations.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4">
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
                Enter matrix values, select an operation, and view the results. More operations and features coming soon.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    