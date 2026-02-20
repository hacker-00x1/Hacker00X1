import { Layout } from "@/components/layout";
import { GlitchText } from "@/components/cyber-effects";
import { useRoute, Link, useLocation } from "wouter";
import { BLOG_POSTS, WRITEUPS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, User, ArrowUpRight, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";

export default function BlogPost() {
  const [blogMatch, blogParams] = useRoute("/blogs/:id");
  const [writeupMatch, writeupParams] = useRoute("/writeups/:id");
  const match = blogMatch || writeupMatch;
  const params = blogMatch ? blogParams : writeupParams;
  const [, setLocation] = useLocation();

  const numericId = parseInt(params?.id ?? NaN);
  const postFromBlogs = BLOG_POSTS.find(p => p.id === numericId);
  const postFromWriteups = WRITEUPS.find(p => p.id === numericId);
  const post = blogMatch ? postFromBlogs : postFromWriteups;
  const isBlog = !!blogMatch;
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!post) return;
    const type = isBlog ? "blog" : "writeups";
    const likeKey = `likes:${type}:${post.id}`;
    const likedKey = `liked:${type}:${post.id}`;
    const currentLikes = parseInt(localStorage.getItem(likeKey) || "0", 10);
    const isLiked = localStorage.getItem(likedKey) === "1";
    setLikes(currentLikes);
    setLiked(isLiked);
  }, [post?.id, isBlog]);

  const handleLike = () => {
    if (!post) return;
    const type = isBlog ? "blog" : "writeups";
    const likeKey = `likes:${type}:${post.id}`;
    const likedKey = `liked:${type}:${post.id}`;
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

  if (!match || !post) return <NotFound />;

  function renderTextWithLinks(line) {
    const normalized = line
      .replace(/http:\/\/localhost:5000\/blog\/(\d+)(?![#\w])/g, "http://localhost:5000/blogs/$1#")
      .replace(/http:\/\/localhost:5000\/blogs\/(\d+)(?![#\w])/g, "http://localhost:5000/blogs/$1#")
      .replace(/http:\/\/localhost:5000\/blog\b/g, "http://localhost:5000/blogs");
    const pattern = /(https?:\/\/[^\s]+)/g;
    const parts = normalized.split(pattern);
    return parts.map((p, i) =>
      p.startsWith("http://") || p.startsWith("https://")
        ? (
          <a
            key={i}
            href={p}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-white break-all inline-block max-w-full"
          >
            {p}
          </a>
        )
        : p
    );
  }
  function SuggestedLikeControl({ id }) {
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

  let suggestedPosts = [];
  if (isBlog) {
    const isChapter = /^Chapter\s+\d+/i.test(post.title);
    const getChapterNum = (t) => {
      const m = t?.match(/^Chapter\s+(\d+)/i);
      return m ? parseInt(m[1], 10) : NaN;
    };
    if (isChapter) {
      const chapters = BLOG_POSTS
        .filter(p => /^Chapter\s+\d+/i.test(p.title))
        .sort((a, b) => getChapterNum(a.title) - getChapterNum(b.title));
      const n = chapters.length;
      const currentIndex = chapters.findIndex(p => p.id === post.id);
      suggestedPosts = [1, 2, 3].map(step => chapters[(currentIndex + step) % n]);
    } else {
      const USER_AUTHOR = "Hacker00x1";
      suggestedPosts = BLOG_POSTS
        .filter(p => p.author === USER_AUTHOR && p.id !== post.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    }
  } else {
    suggestedPosts = WRITEUPS
      .filter(p => p.id !== post.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }

  return (
    <Layout>
      <div id="top" className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button asChild variant="ghost" className="pl-4 pr-4 text-white bg-primary/20 hover:bg-primary/30 transition-all duration-400 font-mono">
            <Link href={isBlog ? "/blogs" : "/writeups"}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isBlog ? "BACK TO BLOGS" : "BACK TO WRITEUPS"}
            </Link>
          </Button>
        </div>

        <Card className={`${isBlog ? "card-glow" : "border border-primary/20 bg-black"} mb-16`}>
          <div className="overflow-hidden rounded-t-xl bg-black sm:h-100 md:h-100 lg:h-100">
            <img
              src={post.image ?? "/image/cyber-hero.png"}
              alt={post.title}
              className="w-full h-full object-contain md:object-cover border border-primary/20"
              loading="lazy"
              decoding="async"
              sizes="100vw"
              srcSet={`${post.image ?? "/image/cyber-hero.png"} 1x, ${post.image ?? "/image/cyber-hero.png"} 2x`}
              fetchpriority="high"
            />
          </div>
          <CardHeader className="space-y-4 border-b border-primary/20 pb-8 sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <h1 className="text-3xl md:text-5xl font-black font-orbitron text-white leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {post.readTime}
              </div>
              {post.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  {post.author}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="prose prose-invert prose-green max-w-none font-mono">
              <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-justify">
                {post.content.split('\n').map((line, index) => {
                  if (line.startsWith('[+] ')) {
                    return (
                      <h2 key={index} className="font-rajdhani text-yellow-400 text-xl font-bold mb-3 mt-5 border-l-4 border-yellow-400 pl-4">
                        {line.replace('[+] ', '')}
                      </h2>
                    );
                  } else if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="font-rajdhani text-primary text-2xl font-bold mb-4 mt-6">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  } else if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="font-orbitron text-cyan-400 text-xl font-semibold mb-3 mt-4">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  } else if (line.startsWith('#### ')) {
                    return (
                      <h4 key={index} className="font-mono text-green-400 text-lg font-medium mb-2 mt-3">
                        {line.replace('#### ', '')}
                      </h4>
                    );
                  } else if (line.trim() === '') {
                    return <br key={index} />;
                  } else {
                    return (
                      <span key={index}>
                        {renderTextWithLinks(line)}
                        <br />
                      </span>
                    );
                  }
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-end">
            <Button
              onClick={handleLike}
              variant="outline"
              className={`border-primary/50 ${liked ? "text-red-500" : "text-primary"} hover:bg-primary/10 font-orbitron text-xs tracking-widest gap-2`}
            >
              <Heart className="w-4 h-4" />
              {liked ? "LIKED" : "LIKE"} {likes}
            </Button>
          </CardFooter>
        </Card>

        <div className="border-t border-primary/20 pt-12">
          <h2 className="text-2xl md:text-3xl font-black mb-8 font-orbitron text-white">
            <GlitchText text="SUGGESTED READS" />
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {suggestedPosts.map((suggestedPost) => (
              <Card key={suggestedPost.id} className="card-glow overflow-hidden group relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300 pointer-events-none" />
                <Link href={`${isBlog ? "/blogs" : "/writeups"}/${suggestedPost.id}`}>
                  <div className="relative h-24 sm:h-28 md:h-32 overflow-hidden cursor-pointer">
                    <img
                      src={suggestedPost.image ?? "/image/cyber-hero.png"}
                      alt={suggestedPost.title}
                      className="w-full h-full object-contain md:object-cover opacity-80"
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      srcSet={`${suggestedPost.image ?? "/image/cyber-hero.png"} 1x, ${suggestedPost.image ?? "/image/cyber-hero.png"} 2x`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background/70 pointer-events-none" />
                  </div>
                </Link>
                <CardHeader>
                  <CardTitle className="text-lg font-rajdhani font-bold text-white group-hover:text-primary transition-colors line-clamp-2 h-14">
                    {suggestedPost.title}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="pt-0 flex justify-between relative z-10">
                  <SuggestedLikeControl id={suggestedPost.id} />
                  <Button asChild variant="ghost" className="text-primary hover:text-white hover:bg-primary/20 font-orbitron text-[10px] tracking-widest gap-2 pointer-events-auto z-20">
                    <Link href={`${isBlog ? "/blogs" : "/writeups"}/${suggestedPost.id}#`} onClick={(e) => e.stopPropagation()}>
                      READ <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
