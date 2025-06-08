
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workstation Hub - MathVerse',
  description: 'Central hub for all MathVerse workstations and operations.',
};

export default function WorkstationHubPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-primary">Workstation Hub</h1>
      <p className="text-lg text-muted-foreground">
        Welcome to the MathVerse Workstation Hub! This is your central place to access all specialized mathematical tools and operations.
      </p>
      <div className="min-h-[300px] border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
        <p className="text-xl text-muted-foreground">
          Workstation hub content and navigation links will be populated here soon.
        </p>
      </div>
      {/* The "body" of this specific page is effectively the content above. */}
      {/* The Header and Footer are provided by the RootLayout.tsx that wraps this page. */}
    </div>
  );
}
