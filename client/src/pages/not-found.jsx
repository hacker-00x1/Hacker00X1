import { Layout } from "@/components/layout";
import { GlitchText } from "@/components/cyber-effects";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-6 font-orbitron text-white">
          <GlitchText text="404" />
        </h1>
        <p className="text-muted-foreground font-mono text-lg mb-6">
          Page not found.
        </p>
        <Link href="/" className="text-primary font-rajdhani font-bold uppercase tracking-wider">
          Go Home
        </Link>
      </div>
    </Layout>
  );
}
