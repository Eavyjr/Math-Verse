
'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders a string containing mathematical expressions into an HTML string.
 * It specifically looks for expressions wrapped in `\[...\]` delimiters
 * and renders them using KaTeX.
 *
 * @param stepsString The string containing text and LaTeX expressions.
 * @returns An HTML string with math expressions rendered by KaTeX.
 */
export const renderStepsContent = (stepsString: string | undefined): string => {
  if (!stepsString) return "";

  // This regex splits the string by block KaTeX delimiters, keeping the delimiters.
  const parts = stepsString.split(/(\\\[.*?\\\])/g);

  const htmlParts = parts.map((part) => {
    try {
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const latex = part.slice(2, -2); // Extract the LaTeX content
        return katex.renderToString(latex, { throwOnError: false, displayMode: true, output: 'html' });
      }
      // For regular text parts, escape HTML special characters to prevent XSS
      return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    } catch (e) {
      console.error("KaTeX steps rendering error for part:", part, e);
      // Fallback for failed rendering, still escaping HTML
      return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  });

  return htmlParts.join('');
};
