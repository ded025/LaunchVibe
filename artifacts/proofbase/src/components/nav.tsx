import { Link, useLocation } from "wouter";
import { Show, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Nav() {
  const { signOut } = useClerk();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const navLink = (href: string, label: string, onClick?: () => void) => (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "text-sm transition-colors",
        location === href
          ? "text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );

  const close = () => setOpen(false);

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="font-bold text-base md:text-lg tracking-tight text-foreground shrink-0"
            onClick={close}
          >
            ProofBase
          </Link>
          <div className="hidden md:flex items-center gap-5">
            {navLink("/explore", "Explore")}
            {navLink("/leaderboard", "Leaderboard")}
            {navLink("/feed", "Feed")}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Show when="signed-out">
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Link>
              <Button
                asChild
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href="/sign-up">Start Listing</Link>
              </Button>
            </>
          </Show>
          <Show when="signed-in">
            <>
              {navLink("/dashboard", "Dashboard")}
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          </Show>
        </div>

        <button
          className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-4">
          {navLink("/explore", "Explore", close)}
          {navLink("/leaderboard", "Leaderboard", close)}
          {navLink("/feed", "Feed", close)}
          <Show when="signed-in">
            <>{navLink("/dashboard", "Dashboard", close)}</>
          </Show>
          <div className="pt-2 border-t border-border flex flex-col gap-3">
            <Show when="signed-out">
              <>
                <Link
                  href="/sign-in"
                  onClick={close}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Link>
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                >
                  <Link href="/sign-up" onClick={close}>
                    Start Listing
                  </Link>
                </Button>
              </>
            </Show>
            <Show when="signed-in">
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    signOut();
                    close();
                  }}
                >
                  Sign out
                </Button>
              </>
            </Show>
          </div>
        </div>
      )}
    </nav>
  );
}
