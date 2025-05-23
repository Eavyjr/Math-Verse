
export default function Footer() {
  return (
    <footer className="py-8 border-t bg-card text-card-foreground mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} MathVerse. All rights reserved. (Simplified Footer)
        </p>
      </div>
    </footer>
  );
}
