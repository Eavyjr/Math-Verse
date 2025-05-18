import type { SVGProps } from 'react';

export function MathLogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 12h1M10 12h1M16 12h1" /> {/* Sigma-like horizontal lines */}
      <path d="M6 7l2 5-2 5" /> {/* Sigma left part */}
      <path d="M12 7l2 5-2 5" /> {/* Sigma middle part */}
      <path d="M18 7l2 5-2 5" /> {/* Sigma right part */}
      <path d="M5 19L19 5" /> {/* Additional element - could be part of integral or stylized letter */}
    </svg>
  );
}
