import React from "react";
import { cn } from "@/lib/utils";

export function GlitchText({ text, className, as: Component = "span" }) {
  return (
    <Component 
      className={cn("glitch font-orbitron font-bold uppercase tracking-widest relative inline-block", className)} 
      data-text={text}
    >
      {text}
    </Component>
  );
}

export function TerminalText({ text, typingSpeed = 50 }) {
  const [displayedText, setDisplayedText] = React.useState("");

  React.useEffect(() => {
    setDisplayedText(""); // Reset text when source text changes
    let index = 0;
    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, typingSpeed);

    return () => clearInterval(intervalId);
  }, [text, typingSpeed]);

  return (
    <span className="font-mono text-primary">
      {displayedText}
      <span className="animate-pulse">_</span>
    </span>
  );
}
