
'use client';

import React, { useEffect, useRef } from 'react';

export default function KatexLoader() {
  const katexScriptLoaded = useRef(false);
  const autoRenderScriptLoaded = useRef(false);

  const handleAutoRender = () => {
    if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
      // console.log("KaTeX auto-render: Triggering renderMathInElement on .render-math elements");
      document.body.querySelectorAll('.render-math').forEach(el => {
        (window as any).renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\\\[', right: '\\\\]', display: true },
            { left: '\\\\(', right: '\\\\)', display: false }
          ],
          throwOnError: false,
        });
      });
      // Also try a general re-render on the whole body for dynamically added content.
      // Be cautious with performance on very large pages if content changes frequently.
      // console.log("KaTeX auto-render: Triggering renderMathInElement on document.body");
      (window as any).renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\\\[', right: '\\\\]', display: true },
          { left: '\\\\(', right: '\\\\)', display: false }
        ],
        throwOnError: false,
      });
    } else {
      // console.warn("KaTeX auto-render: renderMathInElement not found on window object.");
    }
  };

  useEffect(() => {
    let katexScript: HTMLScriptElement | null = null;
    let autoRenderScript: HTMLScriptElement | null = null;

    // Load KaTeX core script
    if (!katexScriptLoaded.current && !document.querySelector('script[src^="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"]')) {
      katexScript = document.createElement('script');
      katexScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      katexScript.integrity = "sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmFGEkkP2";
      katexScript.crossOrigin = "anonymous";
      katexScript.defer = true;
      katexScript.onload = () => {
        // console.log("KaTeX core script loaded.");
        katexScriptLoaded.current = true;
        // Attempt to load auto-render only after core is loaded
        loadAutoRenderScript();
      };
      katexScript.onerror = () => {
        // console.error("Failed to load KaTeX core script.");
      };
      document.head.appendChild(katexScript);
    } else if (document.querySelector('script[src^="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"]')) {
        katexScriptLoaded.current = true; // Assume it's loaded or loading
        loadAutoRenderScript(); // Attempt to load auto-render if core might already be there
    }


    function loadAutoRenderScript() {
      if (!autoRenderScriptLoaded.current && !document.querySelector('script[src^="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"]')) {
        autoRenderScript = document.createElement('script');
        autoRenderScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";
        autoRenderScript.integrity = "sha384-+VBxd3r6XgURycqtZ117nYw44SU3AYYGpArKGYrSqsTnJ5TTd3FSEE5ADZslDxXm";
        autoRenderScript.crossOrigin = "anonymous";
        autoRenderScript.defer = true;
        autoRenderScript.onload = () => {
          // console.log("KaTeX auto-render script loaded.");
          autoRenderScriptLoaded.current = true;
          handleAutoRender(); // Initial render after script loads
        };
        autoRenderScript.onerror = () => {
          // console.error("Failed to load KaTeX auto-render script.");
        };
        document.head.appendChild(autoRenderScript);
      } else if (document.querySelector('script[src^="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"]')) {
          autoRenderScriptLoaded.current = true;
          if (katexScriptLoaded.current) { // Ensure core is also considered loaded
             handleAutoRender(); // If both already present, try to render
          }
      }
    }
    
    // Cleanup function to remove scripts if component unmounts, though less critical for scripts in <head>
    return () => {
      // if (katexScript && katexScript.parentNode) {
      //   katexScript.parentNode.removeChild(katexScript);
      // }
      // if (autoRenderScript && autoRenderScript.parentNode) {
      //   autoRenderScript.parentNode.removeChild(autoRenderScript);
      // }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return null; // This component does not render any visible UI itself
}
