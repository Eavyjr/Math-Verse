
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Sigma, Percent, Calculator, FileText, UploadCloud, ClipboardPaste, Download, Loader2, XCircle, Info, List, LineChart as LineChartIcon, Brain, Variable } from 'lucide-react';
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine, Scatter, ScatterChart, Line as RechartsLine, ReferenceDot, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { create, all, type MathJsStatic } from 'mathjs';

// Initialize mathjs
const math: MathJsStatic = create(all);

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
  correlationCoefficient: number | null; 
}

interface HistogramData {
  name: string; 
  count: number;
}

interface BoxPlotChartDataItem {
  name: string; 
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

interface NormalCurvePoint {
  x: number;
  pdf: number;
  cdf?: number; 
}

const WhiskerBarShape = (props: any) => {
  const { x, y, height, fill } = props;
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

  // Normal Distribution State
  const [normalMean, setNormalMean] = useState<string>('0');
  const [normalStdDev, setNormalStdDev] = useState<string>('1');
  const [normalXValue, setNormalXValue] = useState<string>('');
  const [normalXLower, setNormalXLower] = useState<string>('');
  const [normalXUpper, setNormalXUpper] = useState<string>('');
  
  const [pdfAtX, setPdfAtX] = useState<number | null>(null);
  const [cdfAtX, setCdfAtX] = useState<number | null>(null);
  const [cdfUpperTailAtX, setCdfUpperTailAtX] = useState<number | null>(null);
  const [cdfRangeProb, setCdfRangeProb] = useState<number | null>(null);

  const [normalCurveData, setNormalCurveData] = useState<NormalCurvePoint[]>([]);
  const [isNormalCalculating, setIsNormalCalculating] = useState<boolean>(false);
  const [normalError, setNormalError] = useState<string | null>(null);


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
      count: data.length, mean: meanVal, median: medianVal, mode: modeVal, range: rangeVal, min: minVal, max: maxVal, q1: q1, q3: q3, iqr: iqrVal, varianceSample: varianceSampleVal, stdDevSample: stdDevSampleVal, variancePopulation: variancePopulationVal, stdDevPopulation: stdDevPopulationVal, frequencyTable: frequencyTableVal, skewness: skewnessVal, kurtosis: kurtosisVal,
    };
  };

  const calculateMean = (data: number[]): number | null => data.length === 0 ? null : data.reduce((acc, val) => acc + val, 0) / data.length;
  const calculateMedian = (data: number[]): number | null => {
    if (data.length === 0) return null;
    const sortedData = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sortedData.length / 2);
    return sortedData.length % 2 !== 0 ? sortedData[mid] : (sortedData[mid - 1] + sortedData[mid]) / 2;
  };
  const getFrequencyMap = (data: number[]): Record<number, number> => data.reduce((acc, val) => ({ ...acc, [val]: (acc[val] || 0) + 1 }), {} as Record<number, number>);
  const calculateMode = (data: number[], frequencyMap: Record<number, number>): string | null => {
    if (data.length === 0) return null;
    let maxFreq = 0; Object.values(frequencyMap).forEach(freq => { if (freq > maxFreq) maxFreq = freq; });
    if (maxFreq === 0) return "N/A";
    if (maxFreq === 1 && data.length > 1 && new Set(data).size === data.length) return "No mode";
    const modes = Object.keys(frequencyMap).filter(key => frequencyMap[Number(key)] === maxFreq).map(Number);
    return modes.length > 0 ? modes.sort((a,b) => a-b).join(', ') : "No mode";
  };
  const calculateRange = (data: number[]): { range: number | null, min: number | null, max: number | null } => {
    if (data.length === 0) return { range: null, min: null, max: null };
    const minVal = Math.min(...data); const maxVal = Math.max(...data);
    return { range: maxVal - minVal, min: minVal, max: maxVal };
  };
  const calculateQuartiles = (data: number[]): { q1: number | null, q3: number | null } => {
    if (data.length < 1) return { q1: null, q3: null };
    const sortedData = [...data].sort((a, b) => a - b);
    const getPercentile = (p: number): number | null => {
        if (sortedData.length === 0) return null;
        const pos = (sortedData.length -1) * p; const base = Math.floor(pos); const rest = pos - base;
        return (sortedData[base + 1] !== undefined) ? sortedData[base] + rest * (sortedData[base + 1] - sortedData[base]) : sortedData[base];
    };
    return { q1: getPercentile(0.25), q3: getPercentile(0.75) };
  };
  const calculateVariance = (data: number[], meanVal: number | null, isSample: boolean): number | null => {
    if (data.length === 0 || meanVal === null || (isSample && data.length < 2) || (!isSample && data.length < 1)) return null;
    const sumSquaredDiff = data.reduce((acc, val) => acc + Math.pow(val - meanVal, 2), 0);
    const divisor = isSample ? data.length - 1 : data.length;
    return divisor > 0 ? sumSquaredDiff / divisor : null;
  };
  const calculateStdDev = (varianceVal: number | null): number | null => (varianceVal === null || varianceVal < 0) ? null : Math.sqrt(varianceVal);
  const calculateFrequencyTable = (frequencyMap: Record<number, number>): { value: number; count: number }[] | null => Object.keys(frequencyMap).length === 0 ? null : Object.entries(frequencyMap).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => a.value - b.value);
  const calculateSkewness = (data: number[], mean: number | null, stdDevSample: number | null): number | null => (data.length < 3 || mean === null || stdDevSample === null || stdDevSample === 0) ? null : data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDevSample, 3), 0) / data.length;
  const calculateKurtosis = (data: number[], mean: number | null, stdDevSample: number | null): number | null => (data.length < 4 || mean === null || stdDevSample === null || stdDevSample === 0) ? null : (data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDevSample, 4), 0) / data.length) - 3;

  const calculateSimpleLinearRegression = (dataX: number[], dataY: number[]): RegressionResults | null => {
    if (dataX.length !== dataY.length || dataX.length < 2) return null;
    const n = dataX.length;
    const sumX = dataX.reduce((acc, val) => acc + val, 0); const sumY = dataY.reduce((acc, val) => acc + val, 0);
    const sumXY = dataX.reduce((acc, val, i) => acc + val * dataY[i], 0); const sumX2 = dataX.reduce((acc, val) => acc + val * val, 0);
    const sumY2 = dataY.reduce((acc, val) => acc + val * val, 0);
    const slopeNumerator = n * sumXY - sumX * sumY; const slopeDenominator = n * sumX2 - sumX * sumX;
    if (slopeDenominator === 0) return { slope: null, intercept: null, rSquared: null, adjustedRSquared: null, equation: "Cannot calculate (denominator for slope is zero)", correlationCoefficient: null };
    const slope = slopeNumerator / slopeDenominator; const intercept = (sumY - slope * sumX) / n;
    const rNumerator = (n * sumXY - sumX * sumY); const rDenominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    let correlationCoefficient: number | null = rDenominator !== 0 ? rNumerator / rDenominator : null;
    const rSquared = correlationCoefficient !== null ? correlationCoefficient * correlationCoefficient : null;
    let adjustedRSquared: number | null = (rSquared !== null && n > 2) ? 1 - ((1 - rSquared) * (n - 1)) / (n - 2) : null; // p=1 for simple linear regression (1 independent var)
    const equation = (slope !== null && intercept !== null) ? `ŷ = ${formatNumber(intercept)} ${slope >= 0 ? '+' : '-'} ${formatNumber(Math.abs(slope))}X` : "N/A";
    return { slope, intercept, rSquared, adjustedRSquared, equation, correlationCoefficient };
  };

  const parseInputData = (rawData: string): number[] => rawData.split(/[\s,;\n\t]+/).map(val => val.trim()).filter(val => val !== '').map(val => parseFloat(val));

  const handleProcessData = () => {
    setIsLoading(true); setError(null); setParsedDataX([]); setParsedDataY([]); setStatsX(null); setStatsY(null);
    setRegressionResults(null); setHistogramDataX([]); setBoxPlotChartDataX([]); setScatterPlotData([]);
    const numbersX = parseInputData(rawDataX); const numbersY = parseInputData(rawDataY);
    if (numbersX.some(isNaN) || (rawDataY.trim() && numbersY.some(isNaN))) { setError("Invalid input: Data contains non-numeric values."); setIsLoading(false); return; }
    if (numbersX.length === 0 && !rawDataY.trim()) { setError("Please enter data for Dataset X."); setIsLoading(false); return; }
    if (numbersX.length === 0 && rawDataY.trim() && numbersY.length === 0) { setError("Please enter valid data for Dataset Y, or provide data for Dataset X."); setIsLoading(false); return; }
    let processedX = false;
    if (numbersX.length > 0) {
        setParsedDataX(numbersX); const currentStatsX = calculateDescriptiveStats(numbersX); setStatsX(currentStatsX);
        if (currentStatsX && currentStatsX.min !== null && currentStatsX.max !== null) { setHistogramDataX(prepareHistogramData(numbersX, currentStatsX.min, currentStatsX.max)); }
        setBoxPlotChartDataX(prepareBoxPlotData(currentStatsX)); processedX = true;
    }
    let processedY = false;
    if (rawDataY.trim() && numbersY.length > 0) {
        setParsedDataY(numbersY); const currentStatsY = calculateDescriptiveStats(numbersY); setStatsY(currentStatsY); processedY = true;
    }
    if (processedX && rawDataY.trim() && processedY) {
        if (numbersX.length !== numbersY.length) { setError("For regression analysis, Data Set X and Data Set Y must have the same number of data points."); }
        else if (numbersX.length >= 2) { const regResults = calculateSimpleLinearRegression(numbersX, numbersY); setRegressionResults(regResults); setScatterPlotData(numbersX.map((xVal, i) => ({ x: xVal, y: numbersY[i] }))); }
        else { setError("Regression analysis requires at least two data points for both X and Y datasets."); }
    } else if (!processedX && processedY) { setError("Please provide Data Set X for analysis."); }
    toast({ title: "Data Processed", description: `Processed ${numbersX.length} points for X, ${numbersY.length} points for Y.` });
    setIsLoading(false);
  };
  
  const calculateNormalPdf = (x: number, mean: number, stdDev: number): number | null => {
    if (stdDev <= 0) return null;
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  const calculateNormalCdf = (x: number, mean: number, stdDev: number): number | null => {
    if (stdDev <= 0) return null;
    try {
      const z = (x - mean) / (stdDev * Math.sqrt(2));
      // Ensure math.erf is used correctly
      const erfValue = math.erf(z);
      if (typeof erfValue !== 'number' || isNaN(erfValue)) {
          console.error("math.erf did not return a valid number for z =", z);
          return null;
      }
      return 0.5 * (1 + erfValue);
    } catch(e) {
      console.error("Error in math.erf or CDF calculation:", e);
      return null;
    }
  };

  const generateNormalCurveData = (mean: number, stdDev: number): NormalCurvePoint[] => {
    if (stdDev <= 0) return [];
    const data: NormalCurvePoint[] = [];
    const range = 4 * stdDev; // Plot from μ - 4σ to μ + 4σ
    const step = range / 50; // ~50 points for the curve
    for (let i = -range; i <= range; i += step) {
      const x = mean + i;
      const pdf = calculateNormalPdf(x, mean, stdDev);
      const cdf = calculateNormalCdf(x,mean, stdDev);
      if (pdf !== null) {
        data.push({ x, pdf, cdf: cdf !== null ? cdf : undefined });
      }
    }
    return data;
  };

  const handleCalculateNormalDistribution = () => {
    setIsNormalCalculating(true);
    setNormalError(null);
    setPdfAtX(null);
    setCdfAtX(null);
    setCdfUpperTailAtX(null);
    setCdfRangeProb(null);
    setNormalCurveData([]);

    const mean = parseFloat(normalMean);
    const stdDev = parseFloat(normalStdDev);

    if (isNaN(mean) || isNaN(stdDev)) {
      setNormalError("Mean and Standard Deviation must be valid numbers.");
      setIsNormalCalculating(false);
      return;
    }
    if (stdDev <= 0) {
      setNormalError("Standard Deviation must be positive.");
      setIsNormalCalculating(false);
      return;
    }

    setNormalCurveData(generateNormalCurveData(mean, stdDev));

    if (normalXValue.trim() !== '') {
      const xVal = parseFloat(normalXValue);
      if (isNaN(xVal)) {
        setNormalError("X Value for PDF/CDF must be a valid number if provided.");
      } else {
        setPdfAtX(calculateNormalPdf(xVal, mean, stdDev));
        const cdfVal = calculateNormalCdf(xVal, mean, stdDev);
        setCdfAtX(cdfVal);
        if (cdfVal !== null) setCdfUpperTailAtX(1 - cdfVal);
      }
    }

    if (normalXLower.trim() !== '' && normalXUpper.trim() !== '') {
      const xLow = parseFloat(normalXLower);
      const xUpp = parseFloat(normalXUpper);
      if (isNaN(xLow) || isNaN(xUpp)) {
        setNormalError("Lower and Upper X values for range probability must be valid numbers if provided.");
      } else if (xLow >= xUpp) {
        setNormalError("Lower X value must be less than Upper X value for range probability.");
      } else {
        const cdfLow = calculateNormalCdf(xLow, mean, stdDev);
        const cdfUpp = calculateNormalCdf(xUpp, mean, stdDev);
        if (cdfLow !== null && cdfUpp !== null) {
          setCdfRangeProb(cdfUpp - cdfLow);
        }
      }
    }
    toast({title: "Normal Distribution Calculated", description: "PDF, CDF values, and plot updated."});
    setIsNormalCalculating(false);
  };


  const prepareHistogramData = (data: number[], minVal: number | null, maxVal: number | null): HistogramData[] => {
    if (data.length === 0 || minVal === null || maxVal === null) return [];
    const n = data.length; const numBins = Math.max(1, Math.ceil(Math.sqrt(n))); 
    const binWidth = (maxVal - minVal) / numBins || 1; const bins: HistogramData[] = [];
    for (let i = 0; i < numBins; i++) { const binStart = minVal + i * binWidth; const binEnd = minVal + (i + 1) * binWidth; bins.push({ name: `${formatNumber(binStart,1)}-${formatNumber(i === numBins -1 ? maxVal : binEnd,1)}`, count: 0 }); }
    if (bins.length === 0 && n > 0 && minVal === maxVal) { bins.push({ name: `${formatNumber(minVal,1)}-${formatNumber(maxVal,1)}`, count: n }); }
    data.forEach(val => { if (binWidth === 0 && val === minVal && bins.length > 0) { bins[0].count++; return; }
      let binIndex = Math.floor((val - minVal) / binWidth); if (val === maxVal) binIndex = numBins - 1; 
      if (binIndex >= 0 && binIndex < numBins) { bins[binIndex].count++; } else if (binIndex === -1 && val === minVal) { bins[0].count++; }
    }); return bins;
  };
  const prepareBoxPlotData = (s: DescriptiveStats | null): BoxPlotChartDataItem[] => (!s || s.min === null || s.q1 === null || s.median === null || s.q3 === null || s.max === null) ? [] : [{ name: "Dataset X", min: s.min, q1: s.q1, median: s.median, q3: s.q3, max: s.max, box: [s.q1, s.q3] }];
  const handleClearData = () => { setRawDataX(''); setRawDataY(''); setParsedDataX([]); setParsedDataY([]); setError(null); setStatsX(null); setStatsY(null); setRegressionResults(null); setHistogramDataX([]); setBoxPlotChartDataX([]); setScatterPlotData([]); toast({ title: "Data Cleared" }); };
  const formatNumber = (num: number | null | undefined, decimalPlaces: number = 2): string => (num === null || num === undefined || isNaN(num)) ? 'N/A' : num.toFixed(decimalPlaces);
  const chartConfig = { count: { label: "Frequency", color: "hsl(var(--chart-1))" }, datasetX: { label: "Dataset X", color: "hsl(var(--chart-2))" }, datasetY: { label: "Dataset Y", color: "hsl(var(--chart-3))" }, regressionLine: { label: "Regression Line", color: "hsl(var(--destructive))" }, pdf: {label: "PDF", color: "hsl(var(--chart-4))"} } satisfies Record<string, any>;

  const renderDescriptiveStatsTable = (statsToDisplay: DescriptiveStats | null, datasetName: string) => {
    if (!statsToDisplay) return <p className="text-muted-foreground">No data for {datasetName}.</p>;
    return (<>
      <h3 className="text-lg font-semibold mb-2">Descriptive Statistics for {datasetName}</h3>
      <Table><TableHeader><TableRow><TableHead className="w-[400px]">Measure</TableHead><TableHead>Value</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="font-medium">Count</TableCell><TableCell>{statsToDisplay.count}</TableCell></TableRow><TableRow><TableCell className="font-medium">Mean</TableCell><TableCell>{formatNumber(statsToDisplay.mean)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Median</TableCell><TableCell>{formatNumber(statsToDisplay.median)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Mode</TableCell><TableCell>{statsToDisplay.mode || 'N/A'}</TableCell></TableRow><TableRow><TableCell className="font-medium">Min</TableCell><TableCell>{formatNumber(statsToDisplay.min)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Max</TableCell><TableCell>{formatNumber(statsToDisplay.max)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Range</TableCell><TableCell>{formatNumber(statsToDisplay.range)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Q1</TableCell><TableCell>{formatNumber(statsToDisplay.q1)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Q3</TableCell><TableCell>{formatNumber(statsToDisplay.q3)}</TableCell></TableRow><TableRow><TableCell className="font-medium">IQR</TableCell><TableCell>{formatNumber(statsToDisplay.iqr)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Variance (Sample)</TableCell><TableCell>{formatNumber(statsToDisplay.varianceSample, 4)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Std Dev (Sample)</TableCell><TableCell>{formatNumber(statsToDisplay.stdDevSample, 4)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Variance (Pop.)</TableCell><TableCell>{formatNumber(statsToDisplay.variancePopulation, 4)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Std Dev (Pop.)</TableCell><TableCell>{formatNumber(statsToDisplay.stdDevPopulation, 4)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Skewness</TableCell><TableCell>{formatNumber(statsToDisplay.skewness, 4)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Kurtosis (Excess)</TableCell><TableCell>{formatNumber(statsToDisplay.kurtosis, 4)}</TableCell></TableRow></TableBody></Table>
      {statsToDisplay.frequencyTable && statsToDisplay.frequencyTable.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center"><List className="mr-2 h-5 w-5 text-primary" /> Frequency Table for {datasetName}</h3>
          <Card className="max-h-60 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Value</TableHead><TableHead className="text-right">Frequency</TableHead></TableRow></TableHeader><TableBody>{statsToDisplay.frequencyTable.map((item) => (<TableRow key={item.value}><TableCell>{item.value}</TableCell><TableCell className="text-right">{item.count}</TableCell></TableRow>))}</TableBody></Table></Card>
        </div>
      )}
    </>);
  };

  return (
    <div className="space-y-8">
      <Link href="/workstations" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workstations
      </Link>
      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center"><Sigma className="h-8 w-8 mr-3" />Basic Statistics Analyzer</CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">Analyze data, calculate stats, visualize distributions, and perform regression.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-xl">Data Input</CardTitle><CardDescription>Enter numeric data separated by commas, spaces, newlines, tabs, or semicolons.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="rawDataX" className="text-md font-semibold">Data Set X (Independent Variable):</Label><Textarea id="rawDataX" value={rawDataX} onChange={(e) => setRawDataX(e.target.value)} placeholder="e.g., 1, 2, 3, 4, 5" className="min-h-[100px] text-base focus:ring-accent focus:border-accent" rows={4}/></div>
                <div><Label htmlFor="rawDataY" className="text-md font-semibold">Data Set Y (Dependent Variable):</Label><Textarea id="rawDataY" value={rawDataY} onChange={(e) => setRawDataY(e.target.value)} placeholder="e.g., 2, 4, 5, 4, 6 (Optional)" className="min-h-[100px] text-base focus:ring-accent focus:border-accent" rows={4}/></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleProcessData} disabled={isLoading} className="flex-grow">{isLoading ? <Loader2 className="animate-spin mr-2" /> : <Calculator className="mr-2 h-5 w-5" />}{isLoading ? 'Processing...' : 'Calculate Descriptive Stats & Regression'}</Button>
                <Button onClick={handleClearData} variant="outline" className="flex-grow sm:flex-grow-0"><XCircle className="mr-2 h-5 w-5" />Clear Data</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"> <Button variant="outline" disabled className="w-full"><UploadCloud className="mr-2 h-5 w-5" /> Upload CSV (Soon)</Button> <Button variant="outline" disabled className="w-full"><ClipboardPaste className="mr-2 h-5 w-5" /> Paste (Soon)</Button> </div>
              {error && (<Alert variant="destructive" className="mt-4"><Info className="h-5 w-5" /><AlertTitle>Input Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
            </CardContent>
          </Card>

          { (statsX || statsY || regressionResults || normalCurveData.length > 0) && !isLoading && (
            <Tabs defaultValue="descriptive" className="w-full">
              <div className="overflow-x-auto no-scrollbar border-b bg-card">
                  <TabsList className="inline-flex w-full min-w-max justify-start rounded-none bg-transparent p-0">
                    <TabsTrigger value="descriptive" className="whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-sm"><BarChart3 className="mr-2 h-5 w-5"/>Descriptive</TabsTrigger>
                    <TabsTrigger value="visualizations" className="whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-sm"><LineChartIcon className="mr-2 h-5 w-5"/>Visualizations</TabsTrigger>
                    <TabsTrigger value="regression" className="whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Percent className="mr-2 h-5 w-5"/>Regression</TabsTrigger>
                    <TabsTrigger value="probability" className="whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Brain className="mr-2 h-5 w-5"/>Probability</TabsTrigger>
                  </TabsList>
              </div>
              <TabsContent value="descriptive" className="mt-4"><Card><CardHeader><CardTitle className="text-xl">Descriptive Statistics</CardTitle><CardDescription>Summary of dataset(s).</CardDescription></CardHeader><CardContent className="space-y-6">{statsX && renderDescriptiveStatsTable(statsX, "Dataset X")}{statsY && rawDataY.trim() && renderDescriptiveStatsTable(statsY, "Dataset Y")}{!statsX && (!rawDataY.trim() || !statsY) && <p className="text-muted-foreground">Enter data and calculate.</p>}</CardContent></Card></TabsContent>
              <TabsContent value="visualizations" className="mt-4"><Card><CardHeader><CardTitle className="text-xl">Data Visualizations</CardTitle><CardDescription>Visuals for Dataset X. Scatter for X vs Y.</CardDescription></CardHeader><CardContent className="space-y-8">{histogramDataX.length > 0 ? (<Card className="bg-card"><CardHeader><CardTitle className="text-lg">Histogram (X)</CardTitle></CardHeader><CardContent className="h-[300px] w-full p-0"><ChartContainer config={chartConfig} className="h-full w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={histogramDataX} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} dy={5} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} dx={-5} /><RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent hideLabel />} /><Bar dataKey="count" fill={chartConfig.datasetX.color} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartContainer></CardContent></Card>) : ( <Alert><Info className="h-4 w-4"/><AlertTitle>Histogram (X)</AlertTitle><AlertDescription>No data for histogram.</AlertDescription></Alert> )}{boxPlotChartDataX.length > 0 && statsX && statsX.min !== null && statsX.q1 !== null && statsX.median !== null && statsX.q3 !== null && statsX.max !== null ? (<Card className="bg-card"><CardHeader><CardTitle className="text-lg">Box Plot (X)</CardTitle></CardHeader><CardContent className="h-[200px] w-full p-0"><ChartContainer config={chartConfig} className="h-full w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={boxPlotChartDataX} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" domain={[statsX.min!, statsX.max!]} /><YAxis type="category" dataKey="name" hide/><RechartsTooltip cursor={{fill: 'transparent'}} content={({ payload }) => payload && payload.length ? (<div className="bg-popover text-popover-foreground p-2 shadow-md rounded-md border text-xs"><p>Min: {formatNumber(payload[0].payload.min)}</p><p>Q1: {formatNumber(payload[0].payload.q1)}</p><p>Med: {formatNumber(payload[0].payload.median)}</p><p>Q3: {formatNumber(payload[0].payload.q3)}</p><p>Max: {formatNumber(payload[0].payload.max)}</p></div>) : null} /><Bar dataKey="box" fill={chartConfig.datasetX.color} barSize={30} stackId="a"/><Bar dataKey={(d: BoxPlotChartDataItem) => [d.min, d.q1]} stackId="a" fill="transparent" shape={<WhiskerBarShape fill="hsl(var(--foreground))" />} /><Bar dataKey={(d: BoxPlotChartDataItem) => [d.q3, d.max]} stackId="a" fill="transparent" shape={<WhiskerBarShape fill="hsl(var(--foreground))" />} />{statsX.median !== null && <ReferenceLine x={statsX.median} stroke="hsl(var(--destructive))" strokeWidth={2} />}</BarChart></ResponsiveContainer></ChartContainer><p className="text-xs text-muted-foreground p-2">Simplified Box Plot. Whiskers to data extremes.</p></CardContent></Card>) : ( <Alert><Info className="h-4 w-4"/><AlertTitle>Box Plot (X)</AlertTitle><AlertDescription>No data for box plot.</AlertDescription></Alert> )}{scatterPlotData.length > 0 && regressionResults && regressionResults.slope !== null && regressionResults.intercept !== null ? (<Card className="bg-card"><CardHeader><CardTitle className="text-lg">Scatter Plot (X vs Y) & Regression</CardTitle></CardHeader><CardContent className="h-[350px] w-full p-0"><ChartContainer config={chartConfig} className="h-full w-full"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}><CartesianGrid /><XAxis type="number" dataKey="x" name="X" label={{ value: "Dataset X", position: 'insideBottomRight', offset: -15 }} domain={['dataMin', 'dataMax']} /><YAxis type="number" dataKey="y" name="Y" label={{ value: "Dataset Y", angle: -90, position: 'insideLeft' }} domain={['dataMin', 'dataMax']} /><RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} /><Scatter name="Data Points" data={scatterPlotData} fill={chartConfig.datasetX.color} />{parsedDataX.length > 0 && regressionResults.slope !== null && regressionResults.intercept !== null && <RechartsLine type="monotone" dataKey="y" stroke={chartConfig.regressionLine.color} dot={false} activeDot={false} strokeWidth={2} name="Regression Line" legendType="none" data={[{ x: Math.min(...parsedDataX), y: regressionResults.intercept + regressionResults.slope * Math.min(...parsedDataX) }, { x: Math.max(...parsedDataX), y: regressionResults.intercept + regressionResults.slope * Math.max(...parsedDataX) }]} />}</ScatterChart></ResponsiveContainer></ChartContainer></CardContent></Card>) : rawDataY.trim() && (<Alert><Info className="h-4 w-4"/><AlertTitle>Scatter Plot</AlertTitle><AlertDescription>Insufficient data for scatter plot.</AlertDescription></Alert>)}</CardContent></Card></TabsContent>
              <TabsContent value="regression" className="mt-4"><Card><CardHeader><CardTitle className="text-xl">Simple Linear Regression (X vs Y)</CardTitle><CardDescription>Relationship analysis.</CardDescription></CardHeader><CardContent>{regressionResults ? (<Table><TableHeader><TableRow><TableHead className="w-[300px]">Measure</TableHead><TableHead>Value</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="font-medium">Equation</TableCell><TableCell>{regressionResults.equation || 'N/A'}</TableCell></TableRow><TableRow><TableCell className="font-medium">Intercept (a)</TableCell><TableCell>{formatNumber(regressionResults.intercept)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Slope (b)</TableCell><TableCell>{formatNumber(regressionResults.slope, 4)}</TableCell></TableRow><TableRow><TableCell className="font-medium">R²</TableCell><TableCell>{formatNumber(regressionResults.rSquared, 4)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Adjusted R²</TableCell><TableCell>{formatNumber(regressionResults.adjustedRSquared, 4)}</TableCell></TableRow><TableRow><TableCell className="font-medium">Correlation (r)</TableCell><TableCell>{formatNumber(regressionResults.correlationCoefficient, 4)}</TableCell></TableRow></TableBody></Table>) : (<Alert><Info className="h-4 w-4"/><AlertTitle>Regression Analysis</AlertTitle><AlertDescription>{rawDataY.trim() ? "Enter data for X & Y and calculate." : "Enter Y data for regression."}</AlertDescription></Alert>)}<p className="text-xs text-muted-foreground mt-4">More regression types soon.</p></CardContent></Card></TabsContent>
              
              <TabsContent value="probability" className="mt-4">
                <Card>
                    <CardHeader><CardTitle className="text-xl flex items-center"><Variable className="mr-2 h-5 w-5"/>Normal Distribution Tool</CardTitle><CardDescription>Calculate PDF, CDF, and visualize the Normal distribution.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="normalMean">Mean (μ)</Label><Input id="normalMean" type="number" value={normalMean} onChange={(e) => setNormalMean(e.target.value)} placeholder="e.g., 0"/></div>
                            <div><Label htmlFor="normalStdDev">Standard Deviation (σ)</Label><Input id="normalStdDev" type="number" value={normalStdDev} onChange={(e) => setNormalStdDev(e.target.value)} placeholder="e.g., 1"/></div>
                        </div>
                        <Card className="p-4 bg-muted/50">
                            <h4 className="text-md font-semibold mb-2">Point Calculations</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label htmlFor="normalXValue">X Value</Label><Input id="normalXValue" type="number" value={normalXValue} onChange={(e) => setNormalXValue(e.target.value)} placeholder="Value for PDF/CDF"/></div>
                            </div>
                            {pdfAtX !== null && <p className="mt-2 text-sm">PDF(X = {normalXValue}): <span className="font-semibold">{formatNumber(pdfAtX, 6)}</span></p>}
                            {cdfAtX !== null && <p className="text-sm">P(X ≤ {normalXValue}): <span className="font-semibold">{formatNumber(cdfAtX, 6)}</span></p>}
                            {cdfUpperTailAtX !== null && <p className="text-sm">P(X > {normalXValue}): <span className="font-semibold">{formatNumber(cdfUpperTailAtX, 6)}</span></p>}
                        </Card>
                         <Card className="p-4 bg-muted/50">
                            <h4 className="text-md font-semibold mb-2">Range Probability</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label htmlFor="normalXLower">Lower X Value</Label><Input id="normalXLower" type="number" value={normalXLower} onChange={(e) => setNormalXLower(e.target.value)} placeholder="e.g., -1"/></div>
                                <div><Label htmlFor="normalXUpper">Upper X Value</Label><Input id="normalXUpper" type="number" value={normalXUpper} onChange={(e) => setNormalXUpper(e.target.value)} placeholder="e.g., 1"/></div>
                            </div>
                            {cdfRangeProb !== null && <p className="mt-2 text-sm">P({normalXLower} &lt; X ≤ {normalXUpper}): <span className="font-semibold">{formatNumber(cdfRangeProb, 6)}</span></p>}
                        </Card>
                        <Button onClick={handleCalculateNormalDistribution} disabled={isNormalCalculating} className="w-full">
                            {isNormalCalculating ? <Loader2 className="animate-spin mr-2"/> : <Calculator className="mr-2 h-5 w-5"/>}
                            Calculate & Plot Normal Distribution
                        </Button>
                        {normalError && (<Alert variant="destructive" className="mt-4"><Info className="h-5 w-5" /><AlertTitle>Normal Distribution Error</AlertTitle><AlertDescription>{normalError}</AlertDescription></Alert>)}
                        
                        {normalCurveData.length > 0 && (
                            <Card className="mt-4">
                                <CardHeader><CardTitle className="text-lg">Normal Distribution PDF Plot</CardTitle></CardHeader>
                                <CardContent className="h-[350px] w-full p-0">
                                  <ChartContainer config={chartConfig} className="h-full w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={normalCurveData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} label={{ value: "X", position: 'insideBottom', offset: -15 }}/>
                                            <YAxis dataKey="pdf" label={{ value: "PDF", angle: -90, position: 'insideLeft' }} />
                                            <RechartsTooltip content={<ChartTooltipContent formatter={(value, name, props) => `${props.payload.x.toFixed(2)}: ${Number(value).toFixed(4)}`} />}/>
                                            <Area type="monotone" dataKey="pdf" stroke={chartConfig.pdf.color} fill={chartConfig.pdf.color} fillOpacity={0.3} name="PDF" />
                                            {parseFloat(normalMean) && !isNaN(parseFloat(normalMean)) && <ReferenceLine x={parseFloat(normalMean)} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: `μ=${formatNumber(parseFloat(normalMean))}`, position: 'top' }} />}
                                            {pdfAtX !== null && normalXValue.trim() !== '' && !isNaN(parseFloat(normalXValue)) && <ReferenceDot x={parseFloat(normalXValue)} y={pdfAtX} r={5} fill="hsl(var(--destructive))" stroke="hsl(var(--destructive-foreground))" isFront={true}><Label value={`P(X=${normalXValue})`} position="top" fill="hsl(var(--destructive))"/></ReferenceDot>}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                  </ChartContainer>
                                </CardContent>
                            </Card>
                        )}
                         <Alert className="mt-4">
                            <Brain className="h-4 w-4" />
                            <AlertTitle>Future Enhancements</AlertTitle>
                            <AlertDescription>
                                Visualizations for CDF, inverse CDF (quantile function), and tools for other distributions (Binomial, Poisson, etc.) are planned.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          <Card className="mt-6"><CardHeader><CardTitle className="text-xl">Export Results</CardTitle><CardDescription>Download summary or visualizations.</CardDescription></CardHeader><CardContent className="flex flex-col sm:flex-row gap-4"><Button variant="outline" disabled className="w-full sm:w-auto"><Download className="mr-2 h-5 w-5" /> CSV (Soon)</Button><Button variant="outline" disabled className="w-full sm:w-auto"><FileText className="mr-2 h-5 w-5" /> PDF (Soon)</Button></CardContent></Card>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t"><p className="text-sm text-muted-foreground">Ensure data is clean for accurate analysis.</p></CardFooter>
      </Card>
    </div>
  );
}

    