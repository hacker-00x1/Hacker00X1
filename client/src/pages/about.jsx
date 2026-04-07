import { Layout } from "@/components/layout";
import { GlitchText } from "@/components/cyber-effects";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function About() {
  const { data: about, isLoading: loadingAbout } = useQuery({ queryKey: ["/api/about"] });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-[300px_1fr] gap-12">
          
          {/* Profile Card */}
          <div className="space-y-6">
            <div className="aspect-square relative rounded-full overflow-hidden border-2 border-primary/50 shadow-[0_0_30px_rgba(0,255,65,0.2)]">
              <img 
                src="image/profile-image.png" 
                alt="Profile" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-card/30 border border-primary/20 rounded-md backdrop-blur-sm">
                <h3 className="text-primary font-orbitron text-sm mb-2">SKILLS</h3>
                <div className="flex flex-wrap gap-2">
                  {["Web Security", "Network Pentesting", "Python", "Bash", "React", "Smart Contracts"].map(skill => (
                    <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 font-mono text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-card/30 border border-primary/20 rounded-md backdrop-blur-sm">
                <h3 className="text-primary font-orbitron text-sm mb-2">ACHIEVEMENTS</h3>
                <ul className="space-y-2 font-mono text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">➜</span> P1 Submission at Uber
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">➜</span> Top 100 Global Researcher
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">➜</span> CVE-2023-XXXX Author
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bio Content - Terminal Style */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-black mb-2 font-orbitron text-white">
                <GlitchText text="WHOAMI" />
              </h1>
              <p className="text-xl text-primary font-rajdhani font-medium tracking-wide">
                Security Researcher / Full Stack Developer / Bug Hunter
              </p>
            </div>

            <Card className="bg-black/80 border border-primary/30 p-0 overflow-hidden font-mono shadow-2xl">
              <div className="bg-primary/10 border-b border-primary/20 p-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <span className="ml-2 text-xs text-muted-foreground">user@hacker00x1:~/profile</span>
              </div>
              <div className="p-6 text-sm md:text-base space-y-4 text-gray-300">
                {loadingAbout ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground font-mono">Loading profile data...</span>
                  </div>
                ) : (
                  <>
                    <p>
                      <span className="text-primary">user@hacker00x1:~$</span> cat bio.txt
                    </p>
                    <div className="leading-relaxed whitespace-pre-wrap font-mono">
                      {about?.content || "No profile data found."}
                    </div>
                    <p>
                      <span className="text-primary">user@hacker00x1:~$</span> <span className="animate-pulse">_</span>
                    </p>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}