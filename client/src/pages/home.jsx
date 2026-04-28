import { Layout } from "@/components/layout";
import { GlitchText, TerminalText } from "@/components/cyber-effects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldAlert, FileText, BookIcon, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function Home() {
  const heroImage = "/image/cyber-hero.png";
  return (
    <Layout>
      {/* Hero Section - Responsive */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden rounded-lg mb-8 sm:mb-12 md:mb-16">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Cyber Background" 
            className="w-full h-full object-cover opacity-40"
            loading="eager"
            decoding="async"
            sizes="100vw"
            srcSet={`${heroImage} 1x, ${heroImage} 2x`}
            fetchpriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_var(--background)_100%)]" />
        </div>

        <div className="relative z-10 text-center max-w-4xl px-3 sm:px-4 md:px-6 py-8 sm:py-12">
          <div className="mb-3 sm:mb-4 inline-block px-2 sm:px-3 md:px-4 py-1 border border-primary/30 rounded-full bg-primary/10 backdrop-blur-sm">
            <span className="text-primary font-mono text-[10px] sm:text-xs md:text-sm tracking-widest uppercase">
              System Status: Secure
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mt-12 mb-6 tracking-tight leading-none text-white drop-shadow-[0_0_15px_rgba(0,255,65,0.3)]">
            <GlitchText text="BUG BOUNTY" />
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-primary animate-gradient bg-300%">
              HUNTER
            </span>
          </h1>
          
          <div className="h-auto sm:h-16 mb-6 sm:mb-8 text-base sm:text-xl md:text-2xl text-muted-foreground font-rajdhani font-medium px-2">
            <TerminalText text="Identifying vulnerabilities. Securing the future. Welcome to my digital fortress." typingSpeed={40} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold font-orbitron tracking-wider sm:tracking-widest min-w-[160px] sm:min-w-[200px] md:min-w-[200px] h-11 sm:h-12 md:h-14 px-3 sm:px-6 text-xs sm:text-sm md:text-base whitespace-nowrap border border-primary box-shadow-glow">
              <Link href="/blogs">READ BLOGS</Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary font-orbitron tracking-wider sm:tracking-widest min-w-[160px] sm:min-w-[200px] md:min-w-[200px] h-11 sm:h-12 md:h-14 px-3 sm:px-6 text-xs sm:text-sm md:text-base whitespace-nowrap backdrop-blur-sm">
              <Link href="/contact">CONTACT ME</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Three Column Cards - Responsive Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 md:mb-20 px-2 sm:px-0">
        <div className="cyber-border bg-card/50 p-5 sm:p-6 md:p-8 backdrop-blur-sm group hover:bg-primary/5 transition-all duration-300">
          <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-xl sm:text-2xl font-orbitron mb-2 text-white">Blogs</h3>
          <p className="text-muted-foreground font-mono text-xs sm:text-sm leading-relaxed mb-4">
            Detailed breakdown of vulnerabilities I found in bug bounty programs. Methodology, approach and impact analysis.
          </p>
          <Link href="/blogs" className="text-primary font-rajdhani font-bold uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 transition-transform text-sm sm:text-base">
            Read Blogs <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>

        <div className="cyber-border bg-card/50 p-5 sm:p-6 md:p-8 backdrop-blur-sm group hover:bg-primary/5 transition-all duration-300">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-xl sm:text-2xl font-orbitron mb-2 text-white">Write-ups</h3>
          <p className="text-muted-foreground font-mono text-xs sm:text-sm leading-relaxed mb-4">
            Detailed reports of how a security vulnerability was discovered, analyzed, and exploited. So, that other people can learn from it.
          </p>
          <Link href="/writeups" className="text-primary font-rajdhani font-bold uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 transition-transform text-sm sm:text-base">
            View Write-ups <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>

        <div className="cyber-border bg-card/50 p-5 sm:p-6 md:p-8 backdrop-blur-sm group hover:bg-purple-500/5 transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <BookIcon className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-xl sm:text-2xl font-orbitron mb-2 text-white">Resources</h3>
          <p className="text-muted-foreground font-mono text-xs sm:text-sm leading-relaxed mb-4">
            Top 10 Cybersecurity books and learning materials I highly recommend for any aspiring bug bounty hunter.
          </p>
          <Link href="/books" className="text-purple-400 font-rajdhani font-bold uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 transition-transform text-sm sm:text-base">
            Explore Books<ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </section>

      {/* Vulnerabilities Section - Responsive */}
      <section className="mb-12 sm:mb-16 md:mb-20">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-orbitron font-bold text-center mb-6 sm:mb-8 md:mb-10 text-white px-2">
          <GlitchText text="TYPES OF VULNERABILITIES" />
        </h2>
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="cyber-border bg-card/50 rounded-lg p-3 sm:p-6 md:p-8">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-5">
              {[
                "XSS", "SQL Injection", "CSRF", "Clickjacking", "SSRF",
                "XXE", "Authentication", "Access Control", "Directory Traversal", "File Upload",
                "Open Redirect", "CORS Misconfiguration", "Subdomain Takeover", "Cache Poisoning",
                "HTTP Request Smuggling", "Host Header Injection", "OAuth Misconfiguration", 
                "NoSQL Injection", "Information Disclosure", "Rate Limiting"
              ].map((tag) => (
                <Link key={tag} href="/blogs">
                  <Badge 
                    variant="outline" 
                    className="text-[10px] sm:text-sm md:text-base py-1.5 px-2.5 sm:py-2 sm:px-4 md:py-2.5 md:px-5 cursor-pointer border-primary/30 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-all duration-300 font-mono whitespace-nowrap"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section - Responsive */}
        <div className="pt-8 sm:pt-12 md:pt-16 lg:pt-20 flex justify-center">
          <div className="w-full max-w-5xl px-2 sm:px-5 md:px-6 lg:px-8">
            <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-orbitron font-bold text-white mb-2 sm:mb-3 text-center">Frequently Asked Questions (FAQ)</h3>
            <p className="text-center text-muted-foreground font-mono mb-6 sm:mb-8 text-xs sm:text-sm md:text-base">Quick answers to common security vulnerability questions</p>
            <Accordion type="single" collapsible className="cyber-border bg-card/60 p-3 sm:p-5 md:p-6 lg:p-8 mx-auto rounded-lg card-glow">
            <AccordionItem value="item-1">
              <AccordionTrigger className="font-mono text-muted-foreground text-sm sm:text-lg md:text-xl hover:no-underline bg-primary/10 hover:bg-primary/15 rounded-md px-2 sm:px-3">
                <span className="flex items-center gap-1.5 sm:gap-2 w-full text-left" style={{ textAlign: "justify" }}>
                  <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base">What is an injection vulnerability?</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="font-mono text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed md:leading-loose" style={{ textAlign: "justify" }}>
                <div className="bg-white/5 border border-primary/20 rounded-md p-2.5 sm:p-3 md:p-5">
                  Injection happens when untrusted input is treated as executable code or query syntax by the interpreter (e.g., SQL, template engines, shell). Attackers craft inputs to alter logic, exfiltrate data, or execute commands. Mitigate with strict input validation, parameterized queries, safe templating, and least-privilege execution environments.
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="font-mono text-muted-foreground text-sm sm:text-lg md:text-xl hover:no-underline bg-primary/10 hover:bg-primary/15 rounded-md px-2 sm:px-3">
                <span className="flex items-center gap-1.5 sm:gap-2 w-full text-left" style={{ textAlign: "justify" }}>
                  <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base">How does XSS differ from HTML injection?</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="font-mono text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed md:leading-loose" style={{ textAlign: "justify" }}>
                <div className="bg-white/5 border border-primary/20 rounded-md p-2.5 sm:p-3 md:p-5">
                  XSS allows attacker-supplied JavaScript to run in the victim&apos;s browser under the site&apos;s origin, enabling cookie theft, CSRF chaining, keylogging, or UI redressing. HTML injection alters markup without script execution, which limits impact to presentation. Prevent XSS with output encoding, a strict Content Security Policy, and avoiding unsafe DOM sinks.
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="font-mono text-muted-foreground text-sm sm:text-lg md:text-xl hover:no-underline bg-primary/10 hover:bg-primary/15 rounded-md px-2 sm:px-3">
                <span className="flex items-center gap-1.5 sm:gap-2 w-full text-left" style={{ textAlign: "justify" }}>
                  <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base">What is CSRF and how does it trick users?</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="font-mono text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed md:leading-loose" style={{ textAlign: "justify" }}>
                <div className="bg-white/5 border border-primary/20 rounded-md p-2.5 sm:p-3 md:p-5">
                  CSRF exploits the browser&apos;s credential persistence by luring a logged‑in user to trigger a state‑changing action on another site. The request carries valid cookies, making the server believe it&apos;s legitimate. Defend using synchronized CSRF tokens, SameSite=strict or lax cookies, double-submit cookie patterns, and re-auth or step-up checks for critical actions.
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="font-mono text-muted-foreground text-sm sm:text-lg md:text-xl hover:no-underline bg-primary/10 hover:bg-primary/15 rounded-md px-2 sm:px-3">
                <span className="flex items-center gap-1.5 sm:gap-2 w-full text-left" style={{ textAlign: "justify" }}>
                  <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base">What impact can open redirects have?</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="font-mono text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed md:leading-loose" style={{ textAlign: "justify" }}>
                <div className="bg-white/5 border border-primary/20 rounded-md p-2.5 sm:p-3 md:p-5">
                  Open redirects abuse user trust in the host to bounce them to attacker‑controlled destinations, enabling phishing, token leakage via query fragments, or OAuth flow manipulation. Validate target URLs against strict allowlists, resolve and compare hostnames, and use opaque internal identifiers instead of raw user-supplied URLs.
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="font-mono text-muted-foreground text-sm sm:text-lg md:text-xl hover:no-underline bg-primary/10 hover:bg-primary/15 rounded-md px-2 sm:px-3">
                <span className="flex items-center gap-1.5 sm:gap-2 w-full text-left" style={{ textAlign: "justify" }}>
                  <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base">What is SSRF and why is it dangerous?</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="font-mono text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed md:leading-loose" style={{ textAlign: "justify" }}>
                <div className="bg-white/5 border border-primary/20 rounded-md p-2.5 sm:p-3 md:p-5">
                  SSRF makes the server fetch attacker‑supplied URLs, often reaching internal networks, cloud metadata endpoints, or local services not exposed publicly. Impact includes data exfiltration, credential harvesting, and pivoting. Mitigate with strict URL allowlists, DNS pinning, blocking link-local and private ranges, and egress filtering at the network boundary.
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger className="font-mono text-muted-foreground text-sm sm:text-lg md:text-xl hover:no-underline bg-primary/10 hover:bg-primary/15 rounded-md px-2 sm:px-3">
                <span className="flex items-center gap-1.5 sm:gap-2 w-full text-left" style={{ textAlign: "justify" }}>
                  <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base">What is IDOR and how do you prevent it?</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="font-mono text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed md:leading-loose" style={{ textAlign: "justify" }}>
                <div className="bg-white/5 border border-primary/20 rounded-md p-2.5 sm:p-3 md:p-5">
                  IDOR occurs when object access is controlled only by user‑supplied identifiers (like numeric IDs) without verifying ownership or permissions. Attackers iterate or guess IDs to view or modify others&apos; data. Enforce authorization checks server‑side, use opaque references (UUIDs), and avoid exposing direct database keys in client flows.
                </div>
              </AccordionContent>
            </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </Layout>
  );
}

