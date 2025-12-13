export function XLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.658l-5.214-6.817-5.966 6.817H2.68l7.73-8.835L2.25 2.25h6.828l4.713 6.231L18.244 2.25zm-1.161 18.52h1.833L7.001 3.63H5.037L17.083 20.77z"
      />
    </svg>
  );
}

export function NoteLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"
        opacity="0.15"
      />
      <path
        fill="currentColor"
        d="M8 17V7h4.2c2.7 0 4.8 2.1 4.8 4.8V17h-2v-5.2c0-1.6-1.2-2.8-2.8-2.8H10v8H8z"
      />
    </svg>
  );
}