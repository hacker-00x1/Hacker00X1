import { Layout } from "@/components/layout";
import { GlitchText } from "@/components/cyber-effects";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowUpRight, ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { BLOG_POSTS } from "@/lib/data";

const POSTS = BLOG_POSTS;

export default function Blog() {
  const PAGE_SIZE = 8;
  const [, setLocation] = useLocation();
  const totalPages = Math.ceil(POSTS.length / PAGE_SIZE);
  const initialPage = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get("page") || "1", 10);
      if (isNaN(p)) return 1;
      return Math.min(Math.max(1, p), totalPages);
    } catch {
      return 1;
    }
  })();
  const [page, setPage] = useState(initialPage);
  const start = (page - 1) * PAGE_SIZE;
  const visible = POSTS.slice(start, start + PAGE_SIZE);

  function LikeControl({ id }) {
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);
    useEffect(() => {
      const likeKey = `likes:blog:${id}`;
      const likedKey = `liked:blog:${id}`;
      setLikes(parseInt(localStorage.getItem(likeKey) || "0", 10));
      setLiked(localStorage.getItem(likedKey) === "1");
    }, [id]);
    const toggleLike = () => {
      const likeKey = `likes:blog:${id}`;
      const likedKey = `liked:blog:${id}`;
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
            <GlitchText text="BLOGS" />
          </h1>
          <p className="text-muted-foreground font-mono text-lg">
            Exploring Major Web Vulnerabilities from Real World Bug Bounty Hunting's Book, and Other Bug Hunting Technique from my Experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {visible.map((post) => (
            <Card key={post.id} className="card-glow overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />
              <div className="relative h-40 md:h-52 overflow-hidden">
                <img
                  src={post.image ?? "/image/cyber-hero.png"}
                  alt={post.title}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all duration-300 scale-105 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background/80" />
              </div>
              
              <CardHeader>
                <CardTitle className="text-2xl font-rajdhani font-bold text-white group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-6 text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 flex justify-between">
                <LikeControl id={post.id} />
                <Button asChild variant="ghost" className="text-primary hover:text-white hover:bg-primary/20 font-orbitron text-xs tracking-widest gap-2">
                   <Link href={`/blogs/${post.id}#`}>
                      READ FULL BLOG <ArrowUpRight className="w-3 h-3" />
                   </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        {POSTS.length >= PAGE_SIZE && (
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 font-orbitron text-xs tracking-widest gap-2"
              onClick={() => {
                setPage((p) => {
                  const next = Math.max(1, p - 1);
                  setLocation(`/blogs?page=${next}`);
                  return next;
                });
              }}
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
              onClick={() => {
                setPage((p) => {
                  const next = Math.min(totalPages, p + 1);
                  setLocation(`/blogs?page=${next}`);
                  return next;
                });
              }}
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
