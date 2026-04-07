import { Layout } from "@/components/layout";
import { GlitchText } from "@/components/cyber-effects";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, FileText, Shield, Bug, ArrowLeft, ArrowRight, Heart, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Writeups() {
  const [location, setLocation] = useLocation();
  const PAGE_SIZE = 8;

  const { data: WRITEUPS = [], isLoading } = useQuery({
    queryKey: ["/api/writeups"],
  });
  
  // Use state for page to ensure reactivity
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get("page") || "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  const totalPages = Math.ceil(WRITEUPS.length / PAGE_SIZE);
  
  // Sync page state with URL search params (handling back/forward navigation)
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get("page") || "1", 10);
      const newPage = isNaN(p) || p < 1 ? 1 : p;
      if (newPage !== page) {
        setPage(newPage);
      }
    };

    // Listen for both popstate (browser back/forward) and custom location changes
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [page]);

  // Ensure page is within valid range
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      handlePageChange(totalPages);
    }
  }, [page, totalPages]);

  const start = (page - 1) * PAGE_SIZE;
  const visible = WRITEUPS.slice(start, start + PAGE_SIZE);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setLocation(`/writeups?page=${newPage}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getIcon = (category) => {
    switch (category) {
      case 'Web Security':
      case 'XSS':
      case 'Injection':
        return <Bug className="w-4 h-4" />;
      case 'Authentication':
        return <Shield className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  function LikeControl({ id }) {
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);
    useEffect(() => {
      const likeKey = `likes:writeups:${id}`;
      const likedKey = `liked:writeups:${id}`;
      setLikes(parseInt(localStorage.getItem(likeKey) || "0", 10));
      setLiked(localStorage.getItem(likedKey) === "1");
    }, [id]);
    const toggleLike = () => {
      const likeKey = `likes:writeups:${id}`;
      const likedKey = `liked:writeups:${id}`;
      if (liked) {
        const newLikes = Math.max(0, likes - 1);
        localStorage.setItem(likeKey, String(newLikes));
        localStorage.removeItem(likedKey);
        setLikes(newLikes);
        setLiked(false);
      } else {
        const newLikes = likes + 1;
        localStorage.setItem(likeKey, String(newLikes));
        localStorage.setItem(likedKey, "1");
        setLikes(newLikes);
        setLiked(true);
      }
    };
    return (
      <Button
        onClick={toggleLike}
        variant="outline"
        className={`border-primary/50 ${liked ? "text-red-500" : "text-primary"} hover:bg-primary/10 font-orbitron text-[10px] tracking-widest gap-2`}
      >
        <Heart className="w-3 h-3" />
        {liked ? "LIKED" : "LIKE"} {likes}
      </Button>
    );
  }
 
  

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-4 font-orbitron text-white">
            <GlitchText text="WRITE-UPS" />
          </h1>
          <p className="text-muted-foreground font-mono text-lg">
            Detailed reports for vulnerabilities discovered and exploited.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          {visible.map((post) => (
            <Card key={post.id} className="relative overflow-hidden group border border-primary/20 bg-black">
              <div className="absolute bottom-0 left-0 w-1 h-1/2 bg-primary/0 group-hover:bg-primary transition-all duration-300 z-10" />
              <div className="relative h-64 overflow-hidden border-b border-primary/20">
                <img
                  src={post.image ?? "/image/cyber-hero.png"}
                  alt={post.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-background/80 to-background" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-primary border-primary/50 font-mono text-xs rounded-none">
                    {post.category}
                  </Badge>
                  {post.severity && (
                    <Badge 
                      className={`text-[10px] uppercase font-bold rounded-none ${
                        post.severity === "Critical" ? "bg-red-600 text-white" :
                        post.severity === "High" ? "bg-orange-500 text-white" :
                        post.severity === "Medium" ? "bg-yellow-500 text-black" :
                        "bg-blue-500 text-white"
                      }`}
                    >
                      {post.severity}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl font-rajdhani font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                  {getIcon(post.category)}
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                <LikeControl id={post.id} />
                <Button asChild variant="ghost" className="text-primary hover:text-white hover:bg-primary/20 font-orbitron text-xs tracking-widest gap-2">
                  <Link href={`/writeups/${post.id}`}>
                    VIEW_WRITEUP <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </Button>
                {post.sourceUrl && post.sourceUrl !== "#" && (
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 no-underline visited:text-purple-500 hover:text-blue-400 font-mono text-xs"
                  >
                    Source: External
                  </a>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {WRITEUPS.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mb-16">
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
      </div>
    </Layout>
  );
}