// Logo da marca ZenFlow — tile com gradiente quente e montanha minimalista.
// Cores fixas da marca, então fica legível e bonita em qualquer tema.
// O wordmark "ZenFlow" ao lado é que adapta a cor pelo tema (via CSS).
export function Logo({ size = 22, className = '', title = 'ZenFlow' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="zf-grad" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F9C972" />
          <stop offset="0.52" stopColor="#E94E2B" />
          <stop offset="1" stopColor="#D71F36" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#zf-grad)" />
      <circle cx="19" cy="20" r="6" fill="#fff" opacity="0.3" />
      <path d="M10 47 L29 18 L48 47 Z" fill="#fff" />
      <path d="M31 47 L43 29 L55 47 Z" fill="#fff" opacity="0.8" />
      <path d="M28.4 30 L28.4 8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M28.4 9 L41 13 L28.4 17 Z" fill="#fff" />
    </svg>
  )
}
