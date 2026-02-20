import React, { useEffect, useRef } from 'react';

export function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    const characters = '01';
    const fontSize = 14;
    const columns = width / fontSize;
    
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }
    
    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#0f0';
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        drops[i]++;
      }

    }
    
    const interval = setInterval(draw, 33);
    
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-40"
    />
  );
}
