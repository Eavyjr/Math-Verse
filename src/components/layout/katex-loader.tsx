
'use client';

import React, { useEffect, useRef } from 'react';

export default function KatexLoader() {
  const katexScriptLoaded = useRef(false);
  const autoRenderScriptLoaded = useRef(false);

  const katexDelimiters = [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false }
  ];

  const handleAutoRender = () => {
    if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
      console.log("KatexLoader: Attempting global renderMathInElement on document.body.");
      try {
        (window as any).renderMathInElement(document.body, {
          delimiters: katexDelimiters,
          throwOnError: false,
        });
        console.log("KatexLoader: Global renderMathInElement on document.body complete.");
      } catch (e) {
        console.error("KatexLoader: Error during global renderMathInElement on document.body:", e);
      }
    } else {
      console.warn("KatexLoader: renderMathInElement not found on window object during handleAutoRender.");
    }
  };

  useEffect(() => {
    let katexScript: HTMLScriptElement | null = null;
    let autoRenderScript: HTMLScriptElement | null = null;

    // Load KaTeX core script
    if (!katexScriptLoaded.current && !document.querySelector('script[src^="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"]')) {
      console.log("KatexLoader: Loading KaTeX core script (katex.min.js)...");
      katexScript = document.createElement('script');
      katexScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      katexScript.integrity = "sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmFGEkkP2";
      katexScript.crossOrigin = "anonymous";
      katexScript.defer = true; // defer ensures it executes after HTML parsing but before DOMContentLoaded for script-defined content.
      katexScript.onload = () => {
        console.log("KatexLoader: KaTeX core script (katex.min.js) LOADED.");
        katexScriptLoaded.current = true;
        loadAutoRenderScript(); // Attempt to load auto-render only after core is loaded
      };
      katexScript.onerror = () => {
        console.error("KatexLoader: FAILED to load KaTeX core script (katex.min.js).");
      };
      document.head.appendChild(katexScript);
    } else if (document.querySelector('script[src^="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"]')) {
        console.log("KatexLoader: KaTeX core script (katex.min.js) already present or loading.");
        katexScriptLoaded.current = true; 
        loadAutoRenderScript(); 
    }


    function loadAutoRenderScript() {
      if (katexScriptLoaded.current && !autoRenderScriptLoaded.current && !document.querySelector('script[src^="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"]')) {
        console.log("KatexLoader: Loading KaTeX auto-render script (auto-render.min.js)...");
        autoRenderScript = document.createElement('script');
        autoRenderScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";
        autoRenderScript.integrity = "sha384-+VBxd3r6XgURycqtZ117nYw44SU3AYYGpArKGYrSqsTnJ5TTd3FSEE5ADZslDxXm";
        autoRenderScript.crossOrigin = "anonymous";
        autoRenderScript.defer = true;
        autoRenderScript.onload = () => {
          console.log("KatexLoader: KaTeX auto-render script (auto-render.min.js) LOADED.");
          autoRenderScriptLoaded.current = true;
          if (typeof (window as any).renderMathInElement !== 'undefined') {
            console.log("KatexLoader: renderMathInElement IS NOW AVAILABLE on window object.");
            handleAutoRender(); 
          } else {
            console.error("KatexLoader: auto-render.min.js loaded, but renderMathInElement is STILL NOT on window object!");
          }
        };
        autoRenderScript.onerror = () => {
          console.error("KatexLoader: FAILED to load KaTeX auto-render script (auto-render.min.js).");
        };
        document.head.appendChild(autoRenderScript);
      } else if (document.querySelector('script[src^="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"]')) {
          console.log("KatexLoader: KaTeX auto-render script (auto-render.min.js) already present or loading.");
          autoRenderScriptLoaded.current = true;
          if (katexScriptLoaded.current && typeof (window as any).renderMathInElement !== 'undefined') {
             console.log("KatexLoader: renderMathInElement was already available.");
             handleAutoRender(); 
          } else if (katexScriptLoaded.current) {
            console.warn("KatexLoader: auto-render script present, core script present, but renderMathInElement not yet available.");
          }
      }
    }
    
  }, []); 

  return null; 
}
