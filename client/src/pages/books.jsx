import { Layout } from "@/components/layout";
import { GlitchText } from "@/components/cyber-effects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const BOOKS = [
  {
    id: 1,
    title: "Linux Basics for Hackers",
    author: "OccupyTheWeb",
    cover: "/Media/book-images/01.png",
    desc: "Getting Started with Networking, Scripting, and Security in Kali.",
    link: "/Media/pdf-books/Linux Basics for Hackers 2ed.pdf"
  },
  {
    id: 2,
    title: "Network Basics For Hackers",
    author: "OccupyTheWeb",
    cover: "/Media/book-images/02.png",
    desc: "Computer Networking from a Hacker's Perspective.",
    link: "/Media/pdf-books/Network Basics For Hackers.pdf"
  },
  {
    id: 3,
    title: "Getting Started Becoming a Master Hacker",
    author: "OccupyTheWeb",
    cover: "/Media/book-images/03.png",
    desc: "Hacking is the most important skill set of the 21st century.",
    link: "/Media/pdf-books/Getting Started Becoming a Master Hacker.pdf"
  },
  {
    id: 4,
    title: "Metasploit Basics for Hackers",
    author: "OccupyTheWeb",
    cover: "/Media/book-images/04.png",
    desc: "The Guide to Using the World's Most Popular Penetration Testing Framework.",
    link: "/Media/pdf-books/Metasploit Basics for Hackers.pdf"
  },
  {
    id: 5,
    title: "Black Hat Bash",
    author: "Nick Aleks & Dolev Farhi",
    cover: "/Media/book-images/05.png",
    desc: "Creative scripting for hackers and pentesters.",
    link: "/Media/pdf-books/Black Hat Bash.pdf"
  },
  {
    id: 6,
    title: "Black Hat Python",
    author: "Justin Seitz & Tim Arnold",
    cover: "/Media/book-images/06.png",
    desc: "Python Programming for Hackers and Pentesters.",
    link: "/Media/pdf-books/Black Hat Python, 2nd Edition.pdf"
  },
  {
    id: 7,
    title: "Bug Bounty Bootcamp",
    author: "Vickie Li",
    cover: "/Media/book-images/07.png",
    desc: "The Guide to Finding and Reporting Web Vulnerabilities.",
    link: "/Media/pdf-books/bugbounty-bootcamp.pdf"
  },
  {
    id: 8,
    title: "Penetration Testing",
    author: "Georgia Weidman",
    cover: "/Media/book-images/08.png",
    desc: "A Hands-On Introduction to Hacking.",
    link: "/Media/pdf-books/Penetration Testing.pdf"
  },
  {
    id: 9,
    title: "Real-World Bug Hunting",
    author: "Peter Yaworski",
    cover: "/Media/book-images/09.png",
    desc: "A Field Guide to Web Hacking.",
    link: "/Media/pdf-books/Real-world-bug-hunting.pdf"
  },
  {
    id: 10,
    title: "Hacking APIs",
    author: "Corey J. Ball",
    cover: "/Media/book-images/10.png",
    desc: "Breaking web APIs: reconnaissance, auth, and exploitation.",
    link: "/Media/pdf-books/Hacking APIs.pdf"
  },
  {
    id: 11,
    title: "Gray Hat Hacking",
    author: "Allen Harper, Ryan Linn, Stephen Sims, Michael Baucom, Daniel Fernandez, Huáscar Tejeda, Moses Frost",
    cover: "/Media/book-images/11.png",
    desc: "The Ethical Hacker's Handbook.",
    link: "/Media/pdf-books/gray hat hacking 6th edition.pdf"
  },
  {
    id: 12,
    title: "Social Engineering",
    author: "Christopher Hadnagy",
    cover: "/Media/book-images/12.png",
    desc: "The Science of Human Hacking.",
    link: "/Media/pdf-books/Social Engineering.pdf"
  }
];

export default function Books() {
  const PAGE_SIZE = 4;
  const [location, setLocation] = useLocation();
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get("page") || "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const totalPages = Math.ceil(BOOKS.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const visible = BOOKS.slice(start, start + PAGE_SIZE);

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
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-4 font-orbitron text-white">
            <GlitchText text="KNOWLEDGE BASE" />
          </h1>
          <p className="text-muted-foreground font-mono text-lg">
            Top Hacking books I recommend for anyone starting out in cybersecurity and wants to become bug bounty hunter or security researcher like myself.
          </p>
        </div>

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
        {BOOKS.length > PAGE_SIZE && (
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
      </div>
    </Layout>
  );
}
