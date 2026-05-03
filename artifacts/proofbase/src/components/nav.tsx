import { Link } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";

export function Nav() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg tracking-tight">ProofBase</Link>
          <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign In</Link>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/sign-up">Start Listing</Link>
            </Button>
          </Show>
          
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>Sign out</Button>
          </Show>
        </div>
      </div>
    </nav>
  );
}
