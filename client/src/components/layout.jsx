import { Link, useLocation } from "wouter";
import { MatrixBackground } from "./matrix-background";
import { GlitchText } from "./cyber-effects";
import { cn } from "@/lib/utils";
import { Terminal, Shield, BookOpen, User, Mail, FileText, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function Layout({ children }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

      <header className={cn(
        "fixed top-0 left-0 z-40 w-full border-b transition-all duration-300",
        scrolled 
          ? "border-primary/30 bg-background/95 backdrop-blur-md shadow-lg shadow-primary/5" 
          : "border-white/20 bg-background/80 backdrop-blur-md"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo with GlitchText */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/20 border border-primary flex items-center justify-center rounded-none group-hover:bg-primary/40 transition-colors">
              <span className="font-mono text-primary font-bold text-base sm:text-lg">H</span>
            </div>
            <GlitchText text="HACKER00X1" className="text-lg sm:text-xl md:text-2xl text-white font-bold" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 lg:gap-7 xl:gap-8">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "relative text-sm lg:text-base font-rajdhani font-semibold uppercase tracking-wider hover:text-primary py-2 transition-all duration-300 flex items-center gap-2 whitespace-nowrap group",
                  location === item.href 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary/90"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 lg:w-4.5 lg:h-4.5 transition-all duration-300",
                  location === item.href 
                    ? "text-primary scale-110" 
                    : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                )} />
                {item.label}
                <span className={cn(
                  "absolute -bottom-0.5 left-0 w-full h-0.5 bg-primary transition-transform duration-300 origin-left",
                  location === item.href 
                    ? "scale-x-100" 
                    : "scale-x-0 group-hover:scale-x-100"
                )} />
              </Link>
            ))}
          </nav>

          {/* Tablet Navigation - Icons only */}
          <nav className="hidden md:flex lg:hidden items-center gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "relative p-2 transition-all duration-300 group",
                  location === item.href 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                )}
                title={item.label}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-300",
                  location === item.href 
                    ? "text-primary scale-110" 
                    : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                )} />
                <span className={cn(
                  "absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary transition-transform duration-300 origin-center",
                  location === item.href 
                    ? "scale-x-100" 
                    : "scale-x-0 group-hover:scale-x-100"
                )} />
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button - ONLY Menu icon */}
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden bg-primary/10 hover:bg-primary/20 border border-primary/30 w-9 h-9 transition-all duration-300 hover:scale-105"
              >
                <Menu className="w-4 h-4 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background/95 backdrop-blur-xl border-l border-primary/20 w-[280px] p-0 [&>button]:hidden">
              <div className="flex flex-col h-full">
                {/* Mobile Header - Logo on left, X button on right */}
                <div className="p-5 border-b border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/20 border border-primary flex items-center justify-center">
                      <span className="font-mono text-primary font-bold">H</span>
                    </div>
                    <GlitchText text="HACKER00X1" className="text-base text-white font-bold" />
                  </div>
                  {/* ONLY ONE X button - the nice square one */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMobileOpen(false)}
                    className="bg-primary/10 hover:bg-primary/20 border border-primary/30 w-8 h-8 transition-all duration-300 hover:scale-105"
                  >
                    <X className="w-4 h-4 text-primary" />
                  </Button>
                </div>
                
                {/* Mobile Navigation Items */}
                <div className="flex-1 flex flex-col gap-2 p-5">
                  {navItems.map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "text-base font-orbitron transition-all duration-300 flex items-center gap-3 px-4 py-3 rounded-md",
                        location === item.href 
                          ? "text-primary bg-primary/10 border-l-2 border-primary scale-105" 
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-105 hover:translate-x-2"
                      )}
                    >
                      <item.icon className="w-5 h-5 transition-transform duration-300" />
                      {item.label}
                    </Link>
                  ))}
                </div>
                
                {/* Mobile Footer */}
                <div className="p-5 border-t border-primary/20">
                  <div className="flex justify-center gap-5">
                    <a 
                      href="https://x.com/CyberWarriorX55" 
                      target="_blank" 
                      className="text-xs text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 font-rajdhani uppercase tracking-wider"
                    >
                      X (Twitter)
                    </a>
                    <a 
                      href="https://github.com/hacker-00x1" 
                      target="_blank" 
                      className="text-xs text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 font-rajdhani uppercase tracking-wider"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 relative z-10 w-full">
        {children}
      </main>

      <footer className="border-t border-white/20 bg-background/80 backdrop-blur-md py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-muted-foreground font-mono text-center sm:text-left">
            © 2024 Copyrights <span className="text-primary animate-pulse">▐ HACKER00X1</span>
          </div>
          <div className="flex items-center gap-5">
            <a 
              href="https://x.com/CyberWarriorX55" 
              target="_blank" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-rajdhani uppercase tracking-wider"
            >
              X (Twitter)
            </a>
            <a 
              href="https://github.com/hacker-00x1" 
              target="_blank" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-rajdhani uppercase tracking-wider"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
