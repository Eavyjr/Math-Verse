
// TODO: This page should be protected, accessible only to authenticated users.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome to your MathVerse dashboard!</p>
          <p className="mt-4 text-muted-foreground">
            This is a placeholder page. Content and features for authenticated users will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
