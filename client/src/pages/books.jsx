import { Layout } from "@/components/layout";
import { GlitchText } from "@/components/cyber-effects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, ArrowRight, Video, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Books() {
  const { data: books, isLoading: loadingBooks } = useQuery({ queryKey: ["/api/books"] });
  const PAGE_SIZE = 4;
  const [location, setLocation] = useLocation();
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get("page") || "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [showVideo, setShowVideo] = useState(false);

  const totalPages = books ? Math.ceil(books.length / PAGE_SIZE) : 0;
  const start = (page - 1) * PAGE_SIZE;
  const visible = books ? books.slice(start, start + PAGE_SIZE) : [];

  useEffect(() => {
    // Show video popup on mount
    const timer = setTimeout(() => setShowVideo(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get("page") || "1", 10);
      const newPage = isNaN(p) || p < 1 ? 1 : p;
      if (newPage !== page) setPage(newPage);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [page]);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
      setLocation(`/books?page=${totalPages}`);
    }
  }, [page, totalPages, setLocation]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setLocation(`/books?page=${newPage}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-black mb-4 font-orbitron text-white">
              <GlitchText text="KNOWLEDGE BASE" />
            </h1>
            <p className="text-muted-foreground font-mono text-lg max-w-4xl">
              Top Hacking books I recommend for anyone starting out in cybersecurity and wants to become bug bounty hunter or security researcher like myself.
            </p>
          </div>
          <Button 
            onClick={() => setShowVideo(true)}
            className="bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black font-orbitron text-xs tracking-widest gap-2 md:mt-4"
          >
            <Video className="w-4 h-4" /> WATCH PREVIEW
          </Button>
        </div>

        {loadingBooks ? (
          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visible.map((book) => (
                <Card key={book.id} className="card-glow overflow-hidden group relative">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 mix-blend-multiply z-10 group-hover:bg-transparent transition-all duration-500" />
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105" 
                    />
                  </div>
                  
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg font-bold font-orbitron text-white line-clamp-1 group-hover:text-primary transition-colors">
                      {book.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-rajdhani uppercase tracking-wide">
                      {book.author}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground font-mono mb-4 line-clamp-2">
                      {book.desc}
                    </p>
                    <Button asChild className="w-full bg-transparent border border-primary/30 text-primary hover:bg-primary hover:text-black font-orbitron text-xs tracking-widest">
                      <a href={book.link} target="_blank" rel="noopener noreferrer">
                        <Download className="w-3 h-3 mr-2" /> READ BOOK
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {books?.length > PAGE_SIZE && (
              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10 font-orbitron text-xs tracking-widest gap-2"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ArrowLeft className="w-3 h-3" /> Prev
                </Button>
                <div className="font-mono text-xs text-muted-foreground">
                  {page} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10 font-orbitron text-xs tracking-widest gap-2"
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Popup */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl bg-black/95 border-primary/30 p-0 overflow-hidden shadow-[0_0_50px_rgba(0,255,65,0.3)]">
          <DialogHeader className="p-4 border-b border-primary/20 bg-primary/5">
            <DialogTitle className="font-orbitron text-primary text-center tracking-[0.2em] uppercase">
              Criminally Underrated Hacking Books
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-black">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/pQGD0x3i2g8?autoplay=1"
              title="Criminally Underrated Hacking Books"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
            
            {/* Cyber Decorative Elements */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary/50 pointer-events-none" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-primary/50 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary/50 pointer-events-none" />
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-pulse" />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}