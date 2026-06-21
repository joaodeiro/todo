// Logo da marca ZenFlow — o seu mark (pessoa + cume com bandeira), em branco
// sobre um tile com gradiente quente. Fica legível e bonito em qualquer tema.
// O arquivo do desenho fica em public/zenflow-mark.svg.
export function Logo({ size = 22, className = '', title = 'ZenFlow' }) {
  return (
    <img
      src="/zenflow-mark.svg"
      width={size}
      height={size}
      alt={title}
      className={className}
      style={{ display: 'block' }}
    />
  )
}
