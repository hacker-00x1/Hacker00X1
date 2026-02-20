import { Link, useLocation } from "wouter";
import { GlitchText } from "./cyber-effects";
import { MatrixBackground } from "./matrix-background";
import { cn } from "@/lib/utils";
import { Terminal, Shield, BookOpen, User, Mail, FileText } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function Layout({ children }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: Terminal },
    { href: "/blogs", label: "Blogs", icon: Shield },
    { href: "/writeups", label: "Write-ups", icon: FileText },
    { href: "/books", label: "Books", icon: BookOpen },
    { href: "/about", label: "About Me", icon: User },
    { href: "/contact", label: "Contact", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden selection:bg-primary selection:text-black relative">
      <MatrixBackground />
      <div className="scanline" />
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent z-50 opacity-50" />

      <header className="fixed top-0 left-0 z-40 w-full border-b border-white/20 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary/20 border border-primary flex items-center justify-center rounded-none group-hover:bg-primary/40 transition-colors">
              <span className="font-mono text-primary font-bold">H</span>
            </div>
            <GlitchText text="HACKER00X1" className="text-xl md:text-2xl text-white" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "text-sm font-rajdhani font-semibold uppercase tracking-wider hover:text-primary py-2 transition-colors flex items-center gap-2",
                  location === item.href ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden bg-primary/20 hover:bg-primary/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-l border-primary/20 w-[300px]">
              <div className="flex flex-col gap-8 mt-10">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "text-xl font-orbitron hover:text-primary transition-colors flex items-center gap-4 p-2 border-l-2 border-transparent hover:border-primary hover:bg-primary/5",
                      location === item.href ? "text-primary border-primary bg-primary/5" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 pt-24 pb-8 relative z-10">
        {children}
      </main>

      <footer className="border-t border-white/20 bg-background/80 backdrop-blur-md py-8 mt-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-md text-muted-foreground font-mono">
            © 2024 Copyrights<span className="text-primary animate-pulse"> ▐ HACKER00X1</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://x.com/CyberWarriorX55" target="_blank" className="text-muted-foreground hover:text-primary transition-colors font-rajdhani uppercase tracking-widest text-md">X-Twitter</a>
            <a href="https://github.com/hacker-00x1" target="_blank" className="text-muted-foreground hover:text-primary transition-colors font-rajdhani uppercase tracking-widest text-md">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
