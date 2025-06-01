
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
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { ReactFlow, Controls, Background, MiniMap, useNodesState, useEdgesState, MarkerType, type Node as RFNode, type Edge as RFEdge, type OnNodesChange, type OnEdgesChange } from '@xyflow/react';


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

const initialRfNodes: RFNode[] = [];
const initialRfEdges: RFEdge[] = [];


export default function GraphTheoryPage() {
  const { toast } = useToast();
  const [isDirected, setIsDirected] = useState(false);
  const [isWeighted, setIsWeighted] = useState(false);
  
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]); 

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

  const [rfNodes, setRfNodesState, onRfNodesChange]: [RFNode[], any, OnNodesChange] = useNodesState(initialRfNodes);
  const [rfEdges, setRfEdgesState, onRfEdgesChange]: [RFEdge[], any, OnEdgesChange] = useEdgesState(initialRfEdges);


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
    const newRfNodesData: RFNode[] = nodes.map((node, index) => ({
      id: node.id,
      data: { label: node.label },
      position: { x: (index % 8) * 100 + Math.random() * 20, y: Math.floor(index / 8) * 100 + Math.random() * 20 }, 
      type: 'default', 
      style: { 
        background: 'hsl(var(--primary-foreground))', 
        color: 'hsl(var(--primary))', 
        border: '2px solid hsl(var(--primary))',
        borderRadius: '0.375rem', 
        padding: '0.5rem 1rem',
        width: 'auto',
        minWidth: '60px',
        textAlign: 'center',
      },
    }));

    const newRfEdgesData: RFEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: isWeighted && edge.weight !== undefined ? edge.weight.toString() : undefined,
      animated: isDirected,
      markerEnd: isDirected ? { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' } : undefined,
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 600 },
      labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.7 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 2,
    }));
    
    setRfNodesState(newRfNodesData);
    setRfEdgesState(newRfEdgesData);
  }, [nodes, edges, isDirected, isWeighted, setRfNodesState, setRfEdgesState]);


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
        if (sourceIdx === targetIdx) { 
            matrix[sourceIdx][edgeIdx] = weightValue; 
        } else {
            matrix[sourceIdx][edgeIdx] = weightValue; 
            matrix[targetIdx][edgeIdx] = -weightValue;
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
        } else if (edge.source === edge.target && sourceDegree && sourceDegree.degree !== undefined && newProperties.loops.find(l => l.id === edge.id)) {
           // For undirected loops, degree is typically counted as 2.
           // Since it's already counted once for the source, add one more.
           // This check ensures it's only for loops to avoid double counting non-loop edges.
           sourceDegree.degree++;
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
      id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
            Interactive graph visualization. Updates as you edit the edge list.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow relative flex items-center justify-center bg-muted/30 rounded-md">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onRfNodesChange}
          onEdgesChange={onRfEdgesChange}
          fitView
          attributionPosition="bottom-right"
          className="bg-muted/30 rounded-md"
        >
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <Background gap={16} color="hsl(var(--border))" />
        </ReactFlow>
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
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs max-h-40 overflow-y-auto">
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
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs max-h-20 overflow-y-auto">
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
                 <BookOpen className="mr-2 h-5 w-5" /> Properties & Learn
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
                  <CardDescription>Interactive graph creation tools are under development.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[500px] border-2 border-dashed border-border rounded-md bg-muted/30">
                   <div className="text-center text-muted-foreground">
                    <Projector className="h-24 w-24 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Our interactive visual graph builder is under construction!</p>
                    <p>Soon, you'll be able to drag and drop nodes, draw edges, and design your graphs with ease right here.</p>
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
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-6 w-6" /> Graph Theory Concepts & Learning
                  </CardTitle>
                  <CardDescription>Explore fundamental concepts in graph theory.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4 text-sm">
                  <p className="text-base text-foreground/90 leading-relaxed">
                    Graph theory is the study of graphs, which are mathematical structures used to model pairwise relations between objects. A graph in this context is made up of <em>vertices</em> (also called nodes or points) which are connected by <em>edges</em> (also called links or lines).
                  </p>
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-md font-semibold">What is a Graph?</AccordionTrigger>
                      <AccordionContent className="space-y-2 p-2">
                        <p>A graph G = (V, E) consists of:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><strong>V (Vertices):</strong> A finite set of points or nodes. These represent the objects in our model.</li>
                          <li><strong>E (Edges):</strong> A set of pairs of vertices, representing connections or relationships between them. An edge e = (u, v) connects vertex u to vertex v.</li>
                        </ul>
                        <p>Graphs are incredibly versatile and can represent many real-world scenarios, like social networks, road systems, computer networks, and molecular structures.</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-md font-semibold">Types of Graphs</AccordionTrigger>
                      <AccordionContent className="space-y-2 p-2">
                        <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Directed Graph (Digraph):</strong> Edges have a direction (e.g., a one-way street). An edge (u,v) is different from (v,u).</li>
                          <li><strong>Undirected Graph:</strong> Edges have no direction (e.g., a friendship connection). An edge (u,v) is the same as (v,u).</li>
                          <li><strong>Weighted Graph:</strong> Each edge has an associated numerical value, called a weight or cost (e.g., distance between cities).</li>
                          <li><strong>Unweighted Graph:</strong> Edges do not have weights, or all weights are implicitly 1.</li>
                          <li><strong>Simple Graph:</strong> An unweighted, undirected graph with no loops (edges connecting a vertex to itself) and no multiple edges between the same pair of vertices.</li>
                          <li><strong>Multigraph:</strong> Allows multiple edges between the same pair of vertices.</li>
                          <li><strong>Loop:</strong> An edge that connects a vertex to itself.</li>
                        </ul>
                        <p>This explorer allows you to specify if your graph is directed and/or weighted via the controls above the editor.</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger className="text-md font-semibold">Degree of a Vertex</AccordionTrigger>
                      <AccordionContent className="space-y-2 p-2">
                        <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Degree (Undirected):</strong> The number of edges incident to a vertex. A loop usually contributes 2 to the degree.</li>
                          <li><strong>In-degree (Directed):</strong> The number of edges pointing <em>into</em> a vertex.</li>
                          <li><strong>Out-degree (Directed):</strong> The number of edges pointing <em>out from*</em> a vertex.</li>
                        </ul>
                        <p>The sum of degrees in an undirected graph is always twice the number of edges (Handshaking Lemma).</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger className="text-md font-semibold">Paths, Cycles, and Connectivity</AccordionTrigger>
                      <AccordionContent className="space-y-2 p-2">
                        <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Path:</strong> A sequence of vertices where each adjacent pair in the sequence is connected by an edge.</li>
                          <li><strong>Simple Path:</strong> A path that does not revisit any vertex.</li>
                          <li><strong>Cycle:</strong> A path that starts and ends at the same vertex and does not revisit other vertices (except the start/end).</li>
                          <li><strong>Connected Graph (Undirected):</strong> There is a path between every pair of distinct vertices.</li>
                          <li><strong>Strongly Connected Graph (Directed):</strong> There is a directed path from u to v and from v to u for every pair of distinct vertices u, v.</li>
                          <li><strong>Connected Components:</strong> The maximal connected subgraphs of an undirected graph.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-5">
                      <AccordionTrigger className="text-md font-semibold">Common Graph Representations</AccordionTrigger>
                      <AccordionContent className="space-y-2 p-2">
                        <p>Graphs can be represented in several ways for computational purposes:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Adjacency Matrix:</strong> A |V| x |V| matrix where A[i][j] = 1 (or weight) if there is an edge from vertex i to vertex j, and 0 otherwise.</li>
                          <li><strong>Adjacency List:</strong> For each vertex, a list of its adjacent vertices. More space-efficient for sparse graphs.</li>
                          <li><strong>Incidence Matrix:</strong> A |V| x |E| matrix where M[v][e] = 1 if vertex v is an endpoint of edge e (or +1/-1 for directed graphs), and 0 otherwise.</li>
                        </ul>
                        <p>This explorer visualizes Adjacency and Incidence matrices for your graph in the "Grid Editor" tab.</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-6">
                      <AccordionTrigger className="text-md font-semibold">Explore Further: Algorithms</AccordionTrigger>
                      <AccordionContent className="space-y-2 p-2">
                        <p>Graph theory is fundamental to many algorithms, including:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Graph Traversal:</strong> Depth-First Search (DFS), Breadth-First Search (BFS).</li>
                          <li><strong>Shortest Path Algorithms:</strong> Dijkstra's Algorithm, Bellman-Ford Algorithm, Floyd-Warshall Algorithm.</li>
                          <li><strong>Minimum Spanning Tree (MST):</strong> Prim's Algorithm, Kruskal's Algorithm.</li>
                          <li><strong>Network Flow:</strong> Max-Flow Min-Cut Theorem, Ford-Fulkerson Algorithm.</li>
                          <li><strong>Topological Sorting</strong> (for Directed Acyclic Graphs - DAGs).</li>
                        </ul>
                        <p>Visualizations for some of these algorithms are planned for the "Algorithms" tab of this explorer!</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <Button variant="outline" disabled>
                <Download className="mr-2 h-5 w-5" /> Export Graph (Soon)
            </Button>
            <Button variant="outline" disabled>
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


    