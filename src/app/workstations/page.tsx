
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Removed CardDescription as it's not used directly for a separate <CardDescription> tag
import {
  Calculator, Sigma, Ratio, Grid3X3, Share2, FunctionSquare,
  BarChartHorizontalBig, Shapes, Move3d
} from 'lucide-react';
import React from 'react'; // Import React for JSX

const workstations = [
  {
    value: "algebra",
    title: "Basic Algebra",
    icon: <Calculator className="mr-3 h-6 w-6 text-accent" />,
    description: "Solve, simplify, and factor algebraic expressions. Get step-by-step solutions and AI-powered guidance.",
  },
  {
    value: "integration",
    title: "Integration",
    icon: <Sigma className="mr-3 h-6 w-6 text-accent" />,
    description: "Compute definite and indefinite integrals. Explore various integration techniques with AI assistance.",
  },
  {
    value: "differentiation",
    title: "Differentiation & DEs",
    icon: <Ratio className="mr-3 h-6 w-6 text-accent" />,
    description: "Find derivatives, solve differential equations, and see step-by-step solutions.",
  },
  {
    value: "matrix",
    title: "Matrix Operations",
    icon: <Grid3X3 className="mr-3 h-6 w-6 text-accent" />,
    description: "Perform a wide range of matrix operations, from basic arithmetic to complex decompositions.",
  },
  {
    value: "linear-transformations",
    title: "Linear Transformations",
    icon: <Shapes className="mr-3 h-6 w-6 text-accent" />,
    description: "Visualize 3D matrix transformations. See how vectors and shapes change in space.",
  },
  {
    value: "graph-theory",
    title: "Graph Theory",
    icon: <Share2 className="mr-3 h-6 w-6 text-accent" />,
    description: "Interactively create, edit, and analyze graphs. Visualize algorithms and explore graph properties.",
  },
  {
    value: "statistics",
    title: "Basic Statistics",
    icon: <BarChartHorizontalBig className="mr-3 h-6 w-6 text-accent" />,
    description: "Analyze data, calculate descriptive statistics, visualize distributions, and perform regression analysis.",
  },
  {
    value: "graphing-calculator",
    title: "Graphing Calculator",
    icon: <FunctionSquare className="mr-3 h-6 w-6 text-accent" />,
    description: "A full-featured Desmos graphing calculator for advanced plotting and geometric explorations.",
  },
  {
    value: "vector-operations",
    title: "Vector Operations",
    icon: <Move3d className="mr-3 h-6 w-6 text-accent" />,
    description: "Perform vector operations like dot product, cross product, addition, scalar multiplication, and more.",
  },
];

export default function WorkstationHubPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-primary text-center">Workstation Hub</h1>
      <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
        Discover various mathematical tools and operations. Each workstation offers specialized functionalities to assist your learning and exploration.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
        {workstations.map((ws) => (
          <Card 
            key={ws.value} 
            className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 flex flex-col bg-card"
          >
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                {ws.icon}
                {ws.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{ws.description}</p>
            </CardContent>
            {/* No CardFooter with button as requested */}
          </Card>
        ))}
      </div>
    </div>
  );
}
