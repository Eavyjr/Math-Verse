
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Sigma, Percent, Calculator, FileText, UploadCloud, ClipboardPaste, Download, Loader2, XCircle, Info, List, LineChart, Brain, Equal, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine, Scatter, ScatterChart, Line as RechartsLine } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";


interface DescriptiveStats {
  count: number | null;
  mean: number | null;
  median: number | null;
  mode: string | null;
  range: number | null;
  min: number | null;
  max: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  varianceSample: number | null;
  stdDevSample: number | null;
  variancePopulation: number | null;
  stdDevPopulation: number | null;
  frequencyTable: { value: number; count: number }[] | null;
  skewness: number | null;
  kurtosis: number | null;
}

interface RegressionResults {
  slope: number | null;
  intercept: number | null;
  rSquared: number | null;
  adjustedRSquared: number | null;
  equation: string | null;
  correlationCoefficient: number | null; // Pearson's r
}

interface HistogramData {
  name: string; // Bin label e.g., "0-10"
  count: number;
}

interface BoxPlotChartDataItem {
  name: string; // e.g., "Dataset"
  min: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  max: number | null;
  box: [number, number] | null;
}

interface ScatterPlotDataItem {
  x: number;
  y: number;
}

// Custom shape component for the whiskers in the box plot
const WhiskerBarShape = (props: any) => {
  const { x, y, height, fill } = props;
  // Recharts passes a payload that includes many things; we only care about layout props here.
  // Extract only valid SVG props for a rect to avoid warnings.
  const validRectProps = { x, y, height, fill, width: 2 };
  return <rect {...validRectProps} />;
};


export default function BasicStatisticsPage() {
  const { toast } = useToast();
  const [rawDataX, setRawDataX] = useState<string>('');
  const [rawDataY, setRawDataY] = useState<string>('');
  const [parsedDataX, setParsedDataX] = useState<number[]>([]);
  const [parsedDataY, setParsedDataY] = useState<number[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [statsX, setStatsX] = useState<DescriptiveStats | null>(null);
  const [statsY, setStatsY] = useState<DescriptiveStats | null>(null);
  
  const [regressionResults, setRegressionResults] = useState<RegressionResults | null>(null);
  
  const [histogramDataX, setHistogramDataX] = useState<HistogramData[]>([]);
  const [boxPlotChartDataX, setBoxPlotChartDataX] = useState<BoxPlotChartDataItem[]>([]);
  const [scatterPlotData, setScatterPlotData] = useState<ScatterPlotDataItem[]>([]);


  const calculateDescriptiveStats = (data: number[]): DescriptiveStats | null => {
    if (data.length === 0) return null;

    const frequencyMap = getFrequencyMap(data);
    const meanVal = calculateMean(data);
    const medianVal = calculateMedian(data);
    const modeVal = calculateMode(data, frequencyMap);
    const { range: rangeVal, min: minVal, max: maxVal } = calculateRange(data);
    const { q1, q3 } = calculateQuartiles(data);
    const iqrVal = (q1 !== null && q3 !== null) ? q3 - q1 : null;
    
    const varianceSampleVal = calculateVariance(data, meanVal, true);
    const stdDevSampleVal = calculateStdDev(varianceSampleVal);
    const variancePopulationVal = calculateVariance(data, meanVal, false);
    const stdDevPopulationVal = calculateStdDev(variancePopulationVal);
    const frequencyTableVal = calculateFrequencyTable(frequencyMap);
    const skewnessVal = calculateSkewness(data, meanVal, stdDevSampleVal);
    const kurtosisVal = calculateKurtosis(data, meanVal, stdDevSampleVal);

    return {
      count: data.length,
      mean: meanVal,
      median: medianVal,
      mode: modeVal,
      range: rangeVal,
      min: minVal,
      max: maxVal,
      q1: q1,
      q3: q3,
      iqr: iqrVal,
      varianceSample: varianceSampleVal,
      stdDevSample: stdDevSampleVal,
      variancePopulation: variancePopulationVal,
      stdDevPopulation: stdDevPopulationVal,
      frequencyTable: frequencyTableVal,
      skewness: skewnessVal, 
      kurtosis: kurtosisVal, 
    };
  };


  const calculateMean = (data: number[]): number | null => {
    if (data.length === 0) return null;
    return data.reduce((acc, val) => acc + val, 0) / data.length;
  };

  const calculateMedian = (data: number[]): number | null => {
    if (data.length === 0) return null;
    const sortedData = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sortedData.length / 2);
    return sortedData.length % 2 !== 0 ? sortedData[mid] : (sortedData[mid - 1] + sortedData[mid]) / 2;
  };

  const getFrequencyMap = (data: number[]): Record<number, number> => {
    const frequency: Record<number, number> = {};
    data.forEach(val => { frequency[val] = (frequency[val] || 0) + 1; });
    return frequency;
  };

  const calculateMode = (data: number[], frequencyMap: Record<number, number>): string | null => {
    if (data.length === 0) return null;
    
    let maxFreq = 0;
    for (const key in frequencyMap) {
      if (frequencyMap[key] > maxFreq) {
        maxFreq = frequencyMap[key];
      }
    }
    
    if (maxFreq === 0) return "N/A";
    if (maxFreq === 1 && data.length > 1 && new Set(data).size === data.length) return "No mode (all values unique)";

    const modes = Object.keys(frequencyMap)
      .filter(key => frequencyMap[Number(key)] === maxFreq)
      .map(Number);
    
    return modes.length > 0 ? modes.sort((a,b) => a-b).join(', ') : "No mode";
  };

  const calculateRange = (data: number[]): { range: number | null, min: number | null, max: number | null } => {
    if (data.length === 0) return { range: null, min: null, max: null };
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    return { range: maxVal - minVal, min: minVal, max: maxVal };
  };

  const calculateQuartiles = (data: number[]): { q1: number | null, q3: number | null } => {
    if (data.length < 1) return { q1: null, q3: null };
    const sortedData = [...data].sort((a, b) => a - b);
    
    const getPercentile = (p: number): number | null => {
        if (sortedData.length === 0) return null;
        const pos = (sortedData.length -1) * p;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sortedData[base + 1] !== undefined) {
            return sortedData[base] + rest * (sortedData[base + 1] - sortedData[base]);
        } else {
            return sortedData[base];
        }
    };
    const q1 = getPercentile(0.25);
    const q3 = getPercentile(0.75);

    return { q1, q3 };
  };
  
  const calculateVariance = (data: number[], meanVal: number | null, isSample: boolean): number | null => {
    if (data.length === 0 || meanVal === null) return null;
    if (isSample && data.length < 2) return null; 
    if (!isSample && data.length < 1) return null;

    const squaredDifferences = data.map(val => Math.pow(val - meanVal, 2));
    const sumSquaredDiff = squaredDifferences.reduce((acc, val) => acc + val, 0);
    
    const divisor = isSample ? data.length - 1 : data.length;
    return divisor > 0 ? sumSquaredDiff / divisor : null;
  };

  const calculateStdDev = (varianceVal: number | null): number | null => {
    if (varianceVal === null || varianceVal < 0) return null;
    return Math.sqrt(varianceVal);
  };

  const calculateFrequencyTable = (frequencyMap: Record<number, number>): { value: number; count: number }[] | null => {
    if (Object.keys(frequencyMap).length === 0) return null;
    return Object.entries(frequencyMap)
      .map(([value, count]) => ({ value: Number(value), count }))
      .sort((a, b) => a.value - b.value);
  };

  const calculateSkewness = (data: number[], mean: number | null, stdDevSample: number | null): number | null => {
    if (data.length < 3 || mean === null || stdDevSample === null || stdDevSample === 0) return null;
    const n = data.length;
    const sumOfCubedStdScores = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDevSample, 3), 0);
    return sumOfCubedStdScores / n;
  };

  const calculateKurtosis = (data: number[], mean: number | null, stdDevSample: number | null): number | null => {
    if (data.length < 4 || mean === null || stdDevSample === null || stdDevSample === 0) return null;
    const n = data.length;
    const sumOfQuarticStdScores = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDevSample, 4), 0);
    return (sumOfQuarticStdScores / n) - 3;
  };

  const calculateSimpleLinearRegression = (dataX: number[], dataY: number[]): RegressionResults | null => {
    if (dataX.length !== dataY.length || dataX.length < 2) return null;
    const n = dataX.length;

    const sumX = dataX.reduce((acc, val) => acc + val, 0);
    const sumY = dataY.reduce((acc, val) => acc + val, 0);
    const sumXY = dataX.reduce((acc, val, i) => acc + val * dataY[i], 0);
    const sumX2 = dataX.reduce((acc, val) => acc + val * val, 0);
    const sumY2 = dataY.reduce((acc, val) => acc + val * val, 0);

    const slopeNumerator = n * sumXY - sumX * sumY;
    const slopeDenominator = n * sumX2 - sumX * sumX;
    if (slopeDenominator === 0) return { slope: null, intercept: null, rSquared: null, adjustedRSquared: null, equation: "Cannot calculate (denominator for slope is zero)", correlationCoefficient: null };

    const slope = slopeNumerator / slopeDenominator;
    const intercept = (sumY - slope * sumX) / n;

    const rNumerator = (n * sumXY - sumX * sumY);
    const rDenominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    let correlationCoefficient: number | null = null;
    if (rDenominator !== 0) {
      correlationCoefficient = rNumerator / rDenominator;
    }
    
    const rSquared = correlationCoefficient !== null ? correlationCoefficient * correlationCoefficient : null;
    let adjustedRSquared: number | null = null;
    if (rSquared !== null && n > 2) { // p=1 for simple linear regression
        adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - 1 - 1);
    }
    
    const equation = (slope !== null && intercept !== null) ? `ŷ = ${formatNumber(intercept)} ${slope >= 0 ? '+' : '-'} ${formatNumber(Math.abs(slope))}X` : "N/A";

    return { slope, intercept, rSquared, adjustedRSquared, equation, correlationCoefficient };
  };

  const parseInputData = (rawData: string): number[] => {
    return rawData
      .split(/[\s,;\n\t]+/) 
      .map(val => val.trim())
      .filter(val => val !== '')
      .map(val => parseFloat(val));
  };

  const handleProcessData = () => {
    setIsLoading(true);
    setError(null);
    setParsedDataX([]);
    setParsedDataY([]);
    setStatsX(null);
    setStatsY(null);
    setRegressionResults(null);
    setHistogramDataX([]);
    setBoxPlotChartDataX([]);
    setScatterPlotData([]);

    const numbersX = parseInputData(rawDataX);
    const numbersY = parseInputData(rawDataY);

    if (numbersX.some(isNaN) || (rawDataY.trim() && numbersY.some(isNaN)) ) {
      setError("Invalid input: Data contains non-numeric values. Please enter numbers separated by commas, spaces, newlines, tabs or semicolons.");
      setIsLoading(false);
      return;
    }

    if (numbersX.length === 0 && !rawDataY.trim()) { 
        setError("Please enter data for Dataset X.");
        setIsLoading(false);
        return;
    }
     if (numbersX.length === 0 && rawDataY.trim() && numbersY.length === 0) { 
        setError("Please enter valid data for Dataset Y, or provide data for Dataset X.");
        setIsLoading(false);
        return;
    }


    let processedX = false;
    if (numbersX.length > 0) {
        setParsedDataX(numbersX);
        const currentStatsX = calculateDescriptiveStats(numbersX);
        setStatsX(currentStatsX);
        if (currentStatsX && currentStatsX.min !== null && currentStatsX.max !== null) {
          setHistogramDataX(prepareHistogramData(numbersX, currentStatsX.min, currentStatsX.max));
        }
        setBoxPlotChartDataX(prepareBoxPlotData(currentStatsX));
        processedX = true;
    }

    let processedY = false;
    if (rawDataY.trim() && numbersY.length > 0) {
        setParsedDataY(numbersY);
        const currentStatsY = calculateDescriptiveStats(numbersY);
        setStatsY(currentStatsY);
        processedY = true;
    }


    if (processedX && rawDataY.trim() && processedY) { 
        if (numbersX.length !== numbersY.length) {
            setError("For regression analysis, Data Set X and Data Set Y must have the same number of data points. Descriptive stats for each dataset are shown below.");
        } else if (numbersX.length >= 2) { 
            const regResults = calculateSimpleLinearRegression(numbersX, numbersY);
            setRegressionResults(regResults);
            const scatterData = numbersX.map((xVal, i) => ({ x: xVal, y: numbersY[i] }));
            setScatterPlotData(scatterData);
        } else {
            setError("Regression analysis requires at least two data points for both X and Y datasets.");
        }
    } else if (processedX && !rawDataY.trim()) {
        // Only X data provided, this is fine, no regression.
    } else if (!processedX && processedY) {
        setError("Please provide Data Set X for analysis. Dataset Y descriptive stats are shown below.");
    }


    toast({
      title: "Data Processed",
      description: `Successfully processed data. Found ${numbersX.length} points for X, ${numbersY.length} points for Y.`,
    });
    setIsLoading(false);
  };
  

  const prepareHistogramData = (data: number[], minVal: number | null, maxVal: number | null): HistogramData[] => {
    if (data.length === 0 || minVal === null || maxVal === null) return [];
    const n = data.length;
    const numBins = Math.max(1, Math.ceil(Math.sqrt(n))); 
    const binWidth = (maxVal - minVal) / numBins || 1;

    const bins: HistogramData[] = [];
    for (let i = 0; i < numBins; i++) {
      const binStart = minVal + i * binWidth;
      const binEnd = minVal + (i + 1) * binWidth;
      bins.push({ name: `${formatNumber(binStart,1)}-${formatNumber(i === numBins -1 ? maxVal : binEnd,1)}`, count: 0 });
    }
    
    if (bins.length === 0 && n > 0 && minVal === maxVal) {
        bins.push({ name: `${formatNumber(minVal,1)}-${formatNumber(maxVal,1)}`, count: n });
    }

    data.forEach(val => {
      if (binWidth === 0 && val === minVal && bins.length > 0) {
           bins[0].count++;
           return;
      }
      let binIndex = Math.floor((val - minVal) / binWidth);
      if (val === maxVal) binIndex = numBins - 1; // Ensure maxVal goes into the last bin
      if (binIndex >= 0 && binIndex < numBins) {
        bins[binIndex].count++;
      } else if (binIndex === -1 && val === minVal) { // Handles potential floating point issue for minVal
        bins[0].count++;
      }
    });
    return bins;
  };
  
  const prepareBoxPlotData = (s: DescriptiveStats | null): BoxPlotChartDataItem[] => {
    if (!s || s.min === null || s.q1 === null || s.median === null || s.q3 === null || s.max === null) return [];
    return [{ name: "Dataset X", min: s.min, q1: s.q1, median: s.median, q3: s.q3, max: s.max, box: [s.q1, s.q3] }];
  };

  const handleClearData = () => {
    setRawDataX('');
    setRawDataY('');
    setParsedDataX([]);
    setParsedDataY([]);
    setError(null);
    setStatsX(null);
    setStatsY(null);
    setRegressionResults(null);
    setHistogramDataX([]);
    setBoxPlotChartDataX([]);
    setScatterPlotData([]);
    toast({ title: "Data Cleared", description: "Input fields and results have been cleared." });
  };

  const formatNumber = (num: number | null | undefined, decimalPlaces: number = 2): string => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    return num.toFixed(decimalPlaces);
  };

  const chartConfig = {
    count: { label: "Frequency", color: "hsl(var(--chart-1))" },
    datasetX: { label: "Dataset X", color: "hsl(var(--chart-2))" }, 
    datasetY: { label: "Dataset Y", color: "hsl(var(--chart-3))" },
    regressionLine: { label: "Regression Line", color: "hsl(var(--destructive))" },
  } satisfies Record<string, any>;


  const renderDescriptiveStatsTable = (statsToDisplay: DescriptiveStats | null, datasetName: string) => {
    if (!statsToDisplay) {
      return <p className="text-muted-foreground">No data processed for {datasetName}, or data is insufficient for statistics.</p>;
    }
    return (
      <>
        <h3 className="text-lg font-semibold mb-2">Descriptive Statistics for {datasetName}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Measure</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell className="font-medium">Count</TableCell><TableCell>{statsToDisplay.count}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Mean (Average)</TableCell><TableCell>{formatNumber(statsToDisplay.mean)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Median (Middle Value)</TableCell><TableCell>{formatNumber(statsToDisplay.median)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Mode (Most Frequent)</TableCell><TableCell>{statsToDisplay.mode || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Minimum</TableCell><TableCell>{formatNumber(statsToDisplay.min)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Maximum</TableCell><TableCell>{formatNumber(statsToDisplay.max)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Range (Max - Min)</TableCell><TableCell>{formatNumber(statsToDisplay.range)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Q1 (First Quartile)</TableCell><TableCell>{formatNumber(statsToDisplay.q1)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Q3 (Third Quartile)</TableCell><TableCell>{formatNumber(statsToDisplay.q3)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">IQR (Interquartile Range)</TableCell><TableCell>{formatNumber(statsToDisplay.iqr)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Variance (Sample, s²)</TableCell><TableCell>{formatNumber(statsToDisplay.varianceSample, 4)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Standard Deviation (Sample, s)</TableCell><TableCell>{formatNumber(statsToDisplay.stdDevSample, 4)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Variance (Population, σ²)</TableCell><TableCell>{formatNumber(statsToDisplay.variancePopulation, 4)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Standard Deviation (Population, σ)</TableCell><TableCell>{formatNumber(statsToDisplay.stdDevPopulation, 4)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Skewness (Sample)</TableCell><TableCell>{formatNumber(statsToDisplay.skewness, 4)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Excess Kurtosis (Sample)</TableCell><TableCell>{formatNumber(statsToDisplay.kurtosis, 4)}</TableCell></TableRow>
          </TableBody>
        </Table>

        {statsToDisplay.frequencyTable && statsToDisplay.frequencyTable.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <List className="mr-2 h-5 w-5 text-primary" /> 
              Frequency Table for {datasetName}
            </h3>
            <Card className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Value</TableHead><TableHead className="text-right">Frequency</TableHead></TableRow></TableHeader>
                <TableBody>
                  {statsToDisplay.frequencyTable.map((item) => (
                    <TableRow key={item.value}><TableCell>{item.value}</TableCell><TableCell className="text-right">{item.count}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </>
    );
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
            <Sigma className="h-8 w-8 mr-3" />
            Basic Statistics Analyzer
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Analyze data, calculate descriptive statistics, visualize distributions, and perform regression analysis.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Data Input</CardTitle>
              <CardDescription>Enter numeric data separated by commas, spaces, newlines, tabs, or semicolons.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rawDataX" className="text-md font-semibold">
                    Data Set X (Independent Variable for Regression):
                  </Label>
                  <Textarea
                    id="rawDataX"
                    value={rawDataX}
                    onChange={(e) => setRawDataX(e.target.value)}
                    placeholder="e.g., 1, 2, 3, 4, 5"
                    className="min-h-[100px] text-base focus:ring-accent focus:border-accent"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="rawDataY" className="text-md font-semibold">
                    Data Set Y (Dependent Variable for Regression):
                  </Label>
                  <Textarea
                    id="rawDataY"
                    value={rawDataY}
                    onChange={(e) => setRawDataY(e.target.value)}
                    placeholder="e.g., 2, 4, 5, 4, 6 (Optional, for regression)"
                    className="min-h-[100px] text-base focus:ring-accent focus:border-accent"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleProcessData} disabled={isLoading} className="flex-grow">
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Calculator className="mr-2 h-5 w-5" />}
                  {isLoading ? 'Processing...' : 'Calculate Statistics & Regression'}
                </Button>
                <Button onClick={handleClearData} variant="outline" className="flex-grow sm:flex-grow-0">
                   <XCircle className="mr-2 h-5 w-5" />
                  Clear Data
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Button variant="outline" disabled className="w-full">
                  <UploadCloud className="mr-2 h-5 w-5" /> Upload CSV (Coming Soon)
                </Button>
                <Button variant="outline" disabled className="w-full">
                  <ClipboardPaste className="mr-2 h-5 w-5" /> Paste from Spreadsheet (Coming Soon)
                </Button>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <Info className="h-5 w-5" />
                  <AlertTitle>Input Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          { (statsX || statsY || regressionResults) && !isLoading && (
            <Tabs defaultValue="descriptive" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <TabsTrigger value="descriptive" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                    <BarChart3 className="mr-2 h-5 w-5"/>Descriptive Stats
                </TabsTrigger>
                <TabsTrigger value="visualizations" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                    <LineChart className="mr-2 h-5 w-5"/>Visualizations 
                </TabsTrigger>
                <TabsTrigger value="regression" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                    <Percent className="mr-2 h-5 w-5"/>Regression Analysis
                </TabsTrigger>
                <TabsTrigger value="probability" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                    <Brain className="mr-2 h-5 w-5"/>Probability Tools
                </TabsTrigger>
              </TabsList>

              <TabsContent value="descriptive" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Descriptive Statistics Results</CardTitle>
                    <CardDescription>
                        Summary of your dataset(s). Skewness and Kurtosis are sample estimators.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {statsX && renderDescriptiveStatsTable(statsX, "Dataset X")}
                    {statsY && rawDataY.trim() && renderDescriptiveStatsTable(statsY, "Dataset Y")}
                    {!statsX && (!rawDataY.trim() || !statsY) && <p className="text-muted-foreground">Enter data and click "Calculate" to see descriptive statistics.</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visualizations" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Data Visualizations</CardTitle>
                     <CardDescription>Visual representations of Dataset X. Scatter plot visualizes X vs Y.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {histogramDataX.length > 0 ? (
                       <Card className="bg-card">
                          <CardHeader><CardTitle className="text-lg">Histogram (Dataset X)</CardTitle><CardDescription>Distribution of values in Dataset X.</CardDescription></CardHeader>
                          <CardContent className="h-[300px] w-full p-0">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={histogramDataX} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" tickLine={false} axisLine={false} dy={5} />
                                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} dx={-5} />
                                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent hideLabel />} />
                                  <Bar dataKey="count" fill={chartConfig.datasetX.color} radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          </CardContent>
                       </Card>
                    ) : ( <Alert><Info className="h-4 w-4"/><AlertTitle>Histogram (Dataset X)</AlertTitle><AlertDescription>Not enough data in Dataset X to display histogram.</AlertDescription></Alert> )}

                    {boxPlotChartDataX.length > 0 && statsX && statsX.min !== null && statsX.q1 !== null && statsX.median !== null && statsX.q3 !== null && statsX.max !== null ? (
                       <Card className="bg-card">
                          <CardHeader><CardTitle className="text-lg">Box Plot (Dataset X)</CardTitle><CardDescription>Summary of Dataset X distribution.</CardDescription></CardHeader>
                          <CardContent className="h-[200px] w-full p-0">
                             <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={boxPlotChartDataX} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                    <XAxis type="number" domain={[statsX.min!, statsX.max!]} />
                                    <YAxis type="category" dataKey="name" hide/>
                                    <RechartsTooltip 
                                       cursor={{fill: 'transparent'}}
                                       content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const dataItem = payload[0].payload as BoxPlotChartDataItem;
                                            if (!dataItem) return null;
                                            return (
                                                <div className="bg-popover text-popover-foreground p-2 shadow-md rounded-md border text-xs">
                                                    <p>Min: {formatNumber(dataItem.min)}</p>
                                                    <p>Q1: {formatNumber(dataItem.q1)}</p>
                                                    <p>Median: {formatNumber(dataItem.median)}</p>
                                                    <p>Q3: {formatNumber(dataItem.q3)}</p>
                                                    <p>Max: {formatNumber(dataItem.max)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                       }}
                                    />
                                    <Bar dataKey="box" fill={chartConfig.datasetX.color} barSize={30} stackId="a"/>
                                    <Bar dataKey={(d: BoxPlotChartDataItem) => [d.min, d.q1]} stackId="a" fill="transparent" shape={<WhiskerBarShape fill="hsl(var(--foreground))" />} />
                                    <Bar dataKey={(d: BoxPlotChartDataItem) => [d.q3, d.max]} stackId="a" fill="transparent" shape={<WhiskerBarShape fill="hsl(var(--foreground))" />} />
                                    {statsX.median !== null && <ReferenceLine x={statsX.median} stroke="hsl(var(--destructive))" strokeWidth={2} />}
                                </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <p className="text-xs text-muted-foreground p-2">Note: Simplified Box Plot representation. Whiskers extend to data extremes.</p>
                          </CardContent>
                       </Card>
                    ) : ( <Alert><Info className="h-4 w-4"/><AlertTitle>Box Plot (Dataset X)</AlertTitle><AlertDescription>Not enough data in Dataset X for box plot.</AlertDescription></Alert> )}
                  
                    {scatterPlotData.length > 0 && regressionResults && regressionResults.slope !== null && regressionResults.intercept !== null ? (
                      <Card className="bg-card">
                        <CardHeader><CardTitle className="text-lg">Scatter Plot (X vs Y) with Regression Line</CardTitle></CardHeader>
                        <CardContent className="h-[350px] w-full p-0">
                          <ChartContainer config={chartConfig} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="x" name="X" label={{ value: "Dataset X (Independent)", position: 'insideBottomRight', offset: -15 }} domain={['dataMin', 'dataMax']} />
                                <YAxis type="number" dataKey="y" name="Y" label={{ value: "Dataset Y (Dependent)", angle: -90, position: 'insideLeft' }} domain={['dataMin', 'dataMax']} />
                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
                                <Scatter name="Data Points" data={scatterPlotData} fill={chartConfig.datasetX.color} />
                                {parsedDataX.length > 0 && regressionResults.slope !== null && regressionResults.intercept !== null &&
                                    <RechartsLine
                                        type="monotone"
                                        dataKey="y" 
                                        stroke={chartConfig.regressionLine.color}
                                        dot={false}
                                        activeDot={false}
                                        strokeWidth={2}
                                        name="Regression Line"
                                        legendType="none"
                                        data={[
                                            { x: Math.min(...parsedDataX), y: regressionResults.intercept + regressionResults.slope * Math.min(...parsedDataX) },
                                            { x: Math.max(...parsedDataX), y: regressionResults.intercept + regressionResults.slope * Math.max(...parsedDataX) }
                                        ]}
                                    />
                                }
                              </ScatterChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    ) : rawDataY.trim() && (
                       <Alert><Info className="h-4 w-4"/><AlertTitle>Scatter Plot</AlertTitle><AlertDescription>Insufficient data or regression results for scatter plot. Ensure both X and Y datasets have at least 2 corresponding points.</AlertDescription></Alert>
                    )}


                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="regression" className="mt-4">
                 <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Simple Linear Regression (X vs Y)</CardTitle>
                    <CardDescription>Analysis of the linear relationship between Dataset X and Dataset Y.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {regressionResults ? (
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-[300px]">Measure</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell className="font-medium">Regression Equation</TableCell><TableCell>{regressionResults.equation || 'N/A'}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Intercept (a)</TableCell><TableCell>{formatNumber(regressionResults.intercept)}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Slope (b)</TableCell><TableCell>{formatNumber(regressionResults.slope, 4)}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Coefficient of Determination (R²)</TableCell><TableCell>{formatNumber(regressionResults.rSquared, 4)}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Adjusted R-squared (Adjusted R²)</TableCell><TableCell>{formatNumber(regressionResults.adjustedRSquared, 4)}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Pearson Correlation Coefficient (r)</TableCell><TableCell>{formatNumber(regressionResults.correlationCoefficient, 4)}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    ) : (
                      <Alert>
                        <Info className="h-4 w-4"/>
                        <AlertTitle>Regression Analysis</AlertTitle>
                        <AlertDescription>
                            {rawDataY.trim() ? "Enter data for both X and Y datasets (with equal number of points) and click 'Calculate' to see regression analysis." : "Enter data for Dataset Y to perform regression analysis."}
                        </AlertDescription>
                      </Alert>
                    )}
                     <p className="text-xs text-muted-foreground mt-4">Multiple linear regression and more detailed analysis coming soon.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="probability" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Probability Tools</CardTitle>
                        <CardDescription>Explore various probability distributions and calculations. (Coming Soon)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <Brain className="h-4 w-4" />
                            <AlertTitle>Under Development</AlertTitle>
                            <AlertDescription>
                                This section will allow you to work with distributions like Normal, Binomial, and Poisson.
                                You'll be able to compute probabilities, view PDF/PMF, and CDF visualizations.
                            </AlertDescription>
                        </Alert>
                        {/* Placeholder for future inputs for distributions */}
                        <div className="p-4 border rounded-md space-y-2 bg-muted/30">
                            <h4 className="font-semibold">Example: Normal Distribution</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="number" placeholder="Mean (μ)" disabled />
                                <Input type="number" placeholder="Std Dev (σ)" disabled />
                            </div>
                            <Button disabled className="w-full">Calculate & Visualize (Soon)</Button>
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <Card className="mt-6">
            <CardHeader><CardTitle className="text-xl">Export Results</CardTitle><CardDescription>Download your statistical summary or visualizations.</CardDescription></CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" disabled className="w-full sm:w-auto"><Download className="mr-2 h-5 w-5" /> Download CSV (Soon)</Button>
              <Button variant="outline" disabled className="w-full sm:w-auto"><FileText className="mr-2 h-5 w-5" /> Download PDF (Soon)</Button>
            </CardContent>
          </Card>

        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-sm text-muted-foreground">
            This tool helps analyze basic statistical properties. For accurate analysis, ensure data is clean and appropriate.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
    

    
