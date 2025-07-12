
'use client';

import React, { useEffect, useRef, memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KatexRendererProps {
  content: string;
  displayMode?: boolean;
}

const KatexRenderer: React.FC<KatexRendererProps> = ({ content, displayMode = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      try {
        katex.render(content, container, {
          throwOnError: false,
          displayMode: displayMode,
          // You can add macros or other settings here if needed
          // E.g. macros: { "\\dd": "\\mathrm{d}" }
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        // Fallback to displaying the raw content in case of an error
        container.textContent = content;
      }
    }
  }, [content, displayMode]);

  return <span ref={containerRef} />;
};

export default memo(KatexRenderer);
