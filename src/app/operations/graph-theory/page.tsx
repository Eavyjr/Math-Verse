
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Trash2,
  Projector,
  TableIcon,
  Share2,
  Sigma,
  Network,
  Download,
  Settings2,
  HelpCircle,
  PlusCircle,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
// import { ReactFlow, Controls, Background, MiniMap, useNodesState, useEdgesState, MarkerType, type Node as RFNode, type Edge as RFEdge } from '@xyflow/react';


// Data structures for graph
interface Node {
  id: string;
  label: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  weight?: number;
}

interface GraphProperties {
  vertexCount: number;
  edgeCount: number;
  degrees: Record<string, { degree?: number; inDegree?: number; outDegree?: number }>;
  loops: Edge[];
}

// const initialRfNodes: RFNode[] = [];
// const initialRfEdges: RFEdge[] = [];
const initialRfNodes: any[] = []; // Placeholder for RFNode[]
const initialRfEdges: any[] = []; // Placeholder for RFEdge[]


export default function GraphTheoryPage() {
  const { toast } = useToast();
  const [isDirected, setIsDirected] = useState(false);
  const [isWeighted, setIsWeighted] = useState(false);
  
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]); // Derived nodes {id, label}

  const [newEdgeSource, setNewEdgeSource] = useState('');
  const [newEdgeTarget, setNewEdgeTarget] = useState('');
  const [newEdgeWeight, setNewEdgeWeight] = useState<string>('');

  const [adjacencyMatrix, setAdjacencyMatrix] = useState<number[][]>([]);
  const [incidenceMatrix, setIncidenceMatrix] = useState<number[][]>([]);
  const [graphProperties, setGraphProperties] = useState<GraphProperties>({
    vertexCount: 0,
    edgeCount: 0,
    degrees: {},
    loops: [],
  });

  // const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialRfNodes);
  // const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialRfEdges);
  const [rfNodes, setRfNodes] = useState(initialRfNodes); // Placeholder
  const [rfEdges, setRfEdges] = useState(initialRfEdges); // Placeholder
  const onNodesChange = (window as any).onNodesChange; // Placeholder
  const onEdgesChange = (window as any).onEdgesChange; // Placeholder


  // Effect to derive internal 'nodes' state from 'edges'
  useEffect(() => {
    const uniqueNodeIds = new Set<string>();
    edges.forEach(edge => {
      uniqueNodeIds.add(edge.source);
      uniqueNodeIds.add(edge.target);
    });
    const derivedNodes: Node[] = Array.from(uniqueNodeIds).map(id => ({ id, label: id }));
    setNodes(derivedNodes.sort((a,b) => a.id.localeCompare(b.id)));
  }, [edges]);

  // Effect to transform internal 'nodes' and 'edges' to React Flow format
  useEffect(() => {
    const newRfNodesData = nodes.map((node, index) => ({
      id: node.id,
      data: { label: node.label },
      position: { x: (index % 5) * 150, y: Math.floor(index / 5) * 100 }, 
      type: 'default', 
      style: { 
        background: 'hsl(var(--primary-foreground))', 
        color: 'hsl(var(--primary))', 
        border: '2px solid hsl(var(--primary))',
        borderRadius: '0.375rem', 
        padding: '0.5rem 1rem', 
      },
    }));

    const newRfEdgesData = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: isWeighted && edge.weight !== undefined ? edge.weight.toString() : undefined,
      animated: isDirected,
      // markerEnd: isDirected ? { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' } : undefined, // MarkerType needs import
      markerEnd: isDirected ? { type: 'ArrowClosed' as any, color: 'hsl(var(--primary))' } : undefined,
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 600 },
      labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.7 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 2,
    }));
    
    setRfNodes(newRfNodesData as any); // Cast to any for placeholder
    setRfEdges(newRfEdgesData as any); // Cast to any for placeholder
  }, [nodes, edges, isDirected, isWeighted, setRfNodes, setRfEdges]);


  // Effect to compute Adjacency Matrix
  useEffect(() => {
    if (nodes.length === 0) {
      setAdjacencyMatrix([]);
      return;
    }
    const nodeIndexMap = new Map(nodes.map((node, i) => [node.id, i]));
    const size = nodes.length;
    const matrix = Array(size).fill(null).map(() => Array(size).fill(0));

    edges.forEach(edge => {
      const sourceIdx = nodeIndexMap.get(edge.source);
      const targetIdx = nodeIndexMap.get(edge.target);
      if (sourceIdx === undefined || targetIdx === undefined) return;

      const value = isWeighted && edge.weight !== undefined ? edge.weight : 1;
      matrix[sourceIdx][targetIdx] = value;
      if (!isDirected && sourceIdx !== targetIdx) {
        matrix[targetIdx][sourceIdx] = value;
      }
    });
    setAdjacencyMatrix(matrix);
  }, [nodes, edges, isDirected, isWeighted]);

  // Effect to compute Incidence Matrix
  useEffect(() => {
    if (nodes.length === 0 || edges.length === 0) {
      setIncidenceMatrix([]);
      return;
    }
    const nodeIndexMap = new Map(nodes.map((node, i) => [node.id, i]));
    const matrix = Array(nodes.length).fill(null).map(() => Array(edges.length).fill(0));

    edges.forEach((edge, edgeIdx) => {
      const sourceIdx = nodeIndexMap.get(edge.source);
      const targetIdx = nodeIndexMap.get(edge.target);
      if (sourceIdx === undefined || targetIdx === undefined) return;

      const weightValue = isWeighted && edge.weight !== undefined ? edge.weight : 1;

      if (isDirected) {
        matrix[sourceIdx][edgeIdx] = weightValue; 
        if (sourceIdx !== targetIdx) { 
          matrix[targetIdx][edgeIdx] = -weightValue; 
        } else { 
           matrix[sourceIdx][edgeIdx] = weightValue;
        }
      } else { 
        matrix[sourceIdx][edgeIdx] = weightValue;
        if (sourceIdx !== targetIdx) { 
          matrix[targetIdx][edgeIdx] = weightValue; 
        }
      }
    });
    setIncidenceMatrix(matrix);
  }, [nodes, edges, isDirected, isWeighted]);

  // Effect to compute Graph Properties
  useEffect(() => {
    const newProperties: GraphProperties = {
      vertexCount: nodes.length,
      edgeCount: edges.length,
      degrees: {},
      loops: [],
    };

    nodes.forEach(node => {
      if (isDirected) {
        newProperties.degrees[node.id] = { inDegree: 0, outDegree: 0 };
      } else {
        newProperties.degrees[node.id] = { degree: 0 };
      }
    });

    edges.forEach(edge => {
      if (edge.source === edge.target) {
        newProperties.loops.push(edge);
      }

      const sourceDegree = newProperties.degrees[edge.source];
      const targetDegree = newProperties.degrees[edge.target];

      if (isDirected) {
        if(sourceDegree && sourceDegree.outDegree !== undefined) sourceDegree.outDegree++;
        if(targetDegree && targetDegree.inDegree !== undefined) targetDegree.inDegree++;
      } else {
        if(sourceDegree && sourceDegree.degree !== undefined) sourceDegree.degree++;
        if (edge.source !== edge.target && targetDegree && targetDegree.degree !== undefined) { 
          targetDegree.degree++;
        }
      }
    });
    setGraphProperties(newProperties);
  }, [nodes, edges, isDirected]);


  const handleAddEdge = () => {
    if (!newEdgeSource.trim() || !newEdgeTarget.trim()) {
      toast({
        title: "Error Adding Edge",
        description: "Source and Target node IDs cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const weightValue = isWeighted ? parseFloat(newEdgeWeight) : undefined;
    if (isWeighted && (isNaN(weightValue!) || newEdgeWeight.trim() === '')) {
       toast({
        title: "Error Adding Edge",
        description: "Please enter a valid weight for weighted graphs.",
        variant: "destructive",
      });
      return;
    }

    const newEdge: Edge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      source: newEdgeSource.trim().toUpperCase(),
      target: newEdgeTarget.trim().toUpperCase(),
      ...(isWeighted && { weight: weightValue }),
    };
    setEdges(prevEdges => [...prevEdges, newEdge]);
    setNewEdgeSource('');
    setNewEdgeTarget('');
    setNewEdgeWeight('');
    toast({
      title: "Edge Added",
      description: `Edge from ${newEdge.source} to ${newEdge.target} ${isWeighted && newEdge.weight !== undefined ? `(Weight: ${newEdge.weight})` : ''} added.`,
    });
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(prevEdges => prevEdges.filter(edge => edge.id !== edgeId));
    toast({
      title: "Edge Deleted",
      description: "The selected edge has been removed.",
      variant: "destructive"
    });
  };

  const renderEdgeInputTable = () => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Edge List Editor</CardTitle>
        <CardDescription>Define graph edges. Nodes are derived automatically. Use ALL CAPS for Node IDs.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto space-y-4">
        <div className="space-y-2">
            <div className={`grid ${isWeighted ? 'grid-cols-3' : 'grid-cols-2'} gap-2 items-end`}>
                <div>
                    <Label htmlFor="new-edge-source">Source Node</Label>
                    <Input id="new-edge-source" placeholder="e.g., A" value={newEdgeSource} onChange={e => setNewEdgeSource(e.target.value)} className="uppercase"/>
                </div>
                <div>
                    <Label htmlFor="new-edge-target">Target Node</Label>
                    <Input id="new-edge-target" placeholder="e.g., B" value={newEdgeTarget} onChange={e => setNewEdgeTarget(e.target.value)} className="uppercase"/>
                </div>
                {isWeighted && (
                    <div>
                        <Label htmlFor="new-edge-weight">Weight</Label>
                        <Input id="new-edge-weight" type="number" placeholder="e.g., 5" value={newEdgeWeight} onChange={e => setNewEdgeWeight(e.target.value)} />
                    </div>
                )}
            </div>
            <Button onClick={handleAddEdge} size="sm" className="w-full">
              <PlusCircle className="mr-2 h-4 w-4"/> Add Edge
            </Button>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Source</TableHead>
                <TableHead className="w-[30%]">Target</TableHead>
                {isWeighted && <TableHead className="w-[20%]">Weight</TableHead>}
                <TableHead className="w-[20%] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {edges.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={isWeighted ? 4 : 3} className="text-center text-muted-foreground h-24">
                          No edges defined yet. Add edges using the form above.
                      </TableCell>
                  </TableRow>
              )}
              {edges.map((edge) => (
                <TableRow key={edge.id}>
                  <TableCell>{edge.source}</TableCell>
                  <TableCell>{edge.target}</TableCell>
                  {isWeighted && <TableCell>{edge.weight ?? 'N/A'}</TableCell>}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEdge(edge.id)} aria-label="Delete edge">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
         <div className="mt-4 text-sm">
          <p><span className="font-semibold">Nodes:</span> {nodes.map(n => n.label).join(', ') || 'None'}</p>
          <p><span className="font-semibold">Edge Count:</span> {edges.length}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderGraphVisualization = () => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Graph Visualization</CardTitle>
        <CardDescription>
            {/* Interactive graph powered by @xyflow/react. */}
            Graph visualization (using @xyflow/react) is temporarily disabled.
            <br/>
            Please resolve npm install issues to re-enable.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow relative flex items-center justify-center bg-muted/30 rounded-md">
        {/* 
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-right"
          className="bg-muted/30 rounded-md"
        >
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <Background gap={16} color="hsl(var(--border))" />
        </ReactFlow> 
        */}
         <div className="text-center text-muted-foreground">
          <Projector className="h-24 w-24 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Graph visualization disabled.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderAdjacencyMatrix = () => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Adjacency Matrix</CardTitle>
        <CardDescription>Rows/Cols: {nodes.map(n => n.label).join(', ')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <TableIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No nodes to build matrix.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[40px] sticky left-0 bg-card z-10"></TableHead>
                {nodes.map(node => <TableHead key={node.id} className="text-center min-w-[40px]">{node.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((rowNode, rowIndex) => (
                <TableRow key={rowNode.id}>
                  <TableHead className="font-semibold sticky left-0 bg-card z-10 min-w-[40px]">{rowNode.label}</TableHead>
                  {nodes.map((colNode, colIndex) => (
                    <TableCell key={colNode.id} className="text-center min-w-[40px]">
                      {adjacencyMatrix[rowIndex]?.[colIndex] ?? 0}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderIncidenceMatrix = () => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Incidence Matrix</CardTitle>
        <CardDescription>Rows: Nodes ({nodes.map(n => n.label).join(', ')}), Cols: Edges (e1, e2,...)</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {nodes.length === 0 || edges.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
             <Sigma className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Not enough nodes or edges to build matrix.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[40px] sticky left-0 bg-card z-10"></TableHead>
                {edges.map((edge, idx) => <TableHead key={edge.id} className="text-center min-w-[60px]">e{idx + 1}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((node, rowIndex) => (
                <TableRow key={node.id}>
                  <TableHead className="font-semibold sticky left-0 bg-card z-10 min-w-[40px]">{node.label}</TableHead>
                  {edges.map((edge, colIndex) => (
                    <TableCell key={edge.id} className="text-center min-w-[60px]">
                      {incidenceMatrix[rowIndex]?.[colIndex] ?? 0}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderGraphProperties = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Graph Properties
        </CardTitle>
        <CardDescription>Calculated properties of the current graph.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p><span className="font-semibold">Graph Type:</span> {isDirected ? 'Directed' : 'Undirected'}, {isWeighted ? 'Weighted' : 'Unweighted'}</p>
        <p><span className="font-semibold">Number of Vertices (Nodes):</span> {graphProperties.vertexCount}</p>
        <p><span className="font-semibold">Number of Edges:</span> {graphProperties.edgeCount}</p>
        
        <div>
          <h4 className="font-semibold mb-1">Node Degrees:</h4>
          {nodes.length > 0 ? (
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs">
              {nodes.map(node => (
                <li key={node.id}>
                  <span className="font-mono">{node.label}:</span> 
                  {isDirected ? 
                    ` In-degree: ${graphProperties.degrees[node.id]?.inDegree ?? 0}, Out-degree: ${graphProperties.degrees[node.id]?.outDegree ?? 0}` :
                    ` Degree: ${graphProperties.degrees[node.id]?.degree ?? 0}`
                  }
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground text-xs">No nodes defined.</p>}
        </div>

        <div>
          <h4 className="font-semibold mb-1">Loops:</h4>
          {graphProperties.loops.length > 0 ? (
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs">
              {graphProperties.loops.map(loop => (
                <li key={loop.id}>
                  <span className="font-mono">{loop.source} &rarr; {loop.target}</span>
                  {isWeighted && loop.weight !== undefined ? ` (Weight: ${loop.weight})` : ''}
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground text-xs">No loops detected.</p>}
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workstations
      </Link>

      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Share2 className="h-8 w-8 mr-3" />
            Graph Theory Explorer
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Interactively build graphs, visualize them, and explore their properties through matrices.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-md bg-secondary/30">
            <div>
              <Label className="block text-md font-semibold text-foreground mb-1">Graph Type</Label>
              <Select value={isDirected ? "directed" : "undirected"} onValueChange={(val) => setIsDirected(val === "directed")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select graph directionality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undirected">Undirected</SelectItem>
                  <SelectItem value="directed">Directed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-md font-semibold text-foreground mb-1">Edge Weight</Label>
              <Select value={isWeighted ? "weighted" : "unweighted"} onValueChange={(val) => {
                setIsWeighted(val === "weighted");
                if (val === "unweighted") setNewEdgeWeight('');
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select edge weight type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unweighted">Unweighted</SelectItem>
                  <SelectItem value="weighted">Weighted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="grid-editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 sticky top-[calc(var(--header-height,60px)+1px)] z-10 bg-card border-b">
              <TabsTrigger value="grid-editor" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                <TableIcon className="mr-2 h-5 w-5" /> Grid Editor
              </TabsTrigger>
              <TabsTrigger value="canvas-editor" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                <Projector className="mr-2 h-5 w-5" /> Visual Editor
              </TabsTrigger>
              <TabsTrigger value="algorithms" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                 <Settings2 className="mr-2 h-5 w-5" /> Algorithms
              </TabsTrigger>
              <TabsTrigger value="properties" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                 <HelpCircle className="mr-2 h-5 w-5" /> Properties & Learn
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid-editor" className="mt-4 min-h-[600px] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full md:min-h-[calc(100vh-var(--header-height,60px)-250px)]">
                <div className="md:col-span-1 h-full min-h-[400px] md:min-h-0">
                  {renderEdgeInputTable()}
                </div>
                <div className="md:col-span-1 h-full min-h-[400px] md:min-h-0">
                  {renderGraphVisualization()}
                </div>
                <div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">
                  {renderAdjacencyMatrix()}
                </div>
                <div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">
                  {renderIncidenceMatrix()}
                </div>
              </div>
              {renderGraphProperties()}
            </TabsContent>

            <TabsContent value="canvas-editor" className="mt-4 min-h-[600px]">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Visual Graph Builder</CardTitle>
                  <CardDescription>Click and drag to create nodes and edges. More features coming soon!</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[500px] border-2 border-dashed border-border rounded-md bg-muted/30">
                   <div className="text-center text-muted-foreground">
                    <Projector className="h-24 w-24 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Interactive graph canvas will be here.</p>
                    <p>(Drag & drop nodes, create edges)</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="algorithms" className="mt-4 min-h-[600px]">
              <Card>
                <CardHeader>
                  <CardTitle>Algorithm Visualizations</CardTitle>
                  <CardDescription>Select an algorithm to visualize on your current graph. (Coming Soon)</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>Visualizations for DFS, BFS, Dijkstra's, etc., will be available here.</p>
                   <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-md p-4 mt-4 bg-muted/30">
                        <Image 
                            src="https://placehold.co/300x150.png" 
                            alt="Algorithm placeholder" 
                            data-ai-hint="algorithm flowchart"
                            width={300} 
                            height={150}
                            className="opacity-50 mb-2 rounded"
                        />
                        <p className="text-sm text-muted-foreground">Algorithm controls and animation.</p>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="mt-4 min-h-[600px]">
              <Card>
                <CardHeader>
                  <CardTitle>Graph Properties & Learning</CardTitle>
                  <CardDescription>Analyze graph properties and access learning materials. (Coming Soon)</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>Information like vertex/edge counts, degree, paths, cycles, connectivity, and learning tutorials will be here.</p>
                   <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-md p-4 mt-4 bg-muted/30">
                        <Image 
                            src="https://placehold.co/300x150.png" 
                            alt="Properties placeholder" 
                            data-ai-hint="data chart"
                            width={300} 
                            height={150}
                            className="opacity-50 mb-2 rounded"
                        />
                        <p className="text-sm text-muted-foreground">Display of graph metrics.</p>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <Button variant="outline">
                <Download className="mr-2 h-5 w-5" /> Export Graph (Soon)
            </Button>
            <Button variant="outline">
                Import Graph (Soon)
            </Button>
          </div>

        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-sm text-muted-foreground">
            Use the editors above to build your graph. More advanced features like algorithm visualization and saving graphs are coming soon.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

