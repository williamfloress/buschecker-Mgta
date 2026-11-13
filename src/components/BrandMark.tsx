/**
 * Marca de BusChecker: frente de autobús con un ✓ en el parabrisas.
 * Colores de marca fijos (--brand-* en index.css): oliva, crema y mostaza; no cambian con el tema.
 * La versión de favicon está en public/favicon.svg (mismos colores, en hex).
 */
export default function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  const olive = "var(--brand-olive)";
  const cream = "var(--brand-cream)";
  const mustard = "var(--brand-mustard)";
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill={olive} />
      <g fill={cream}>
        {/* carrocería */}
        <rect x="7.5" y="5.5" width="17" height="18.5" rx="4.5" />
        {/* ruedas */}
        <rect x="9.5" y="22" width="4" height="4.5" rx="1.5" />
        <rect x="18.5" y="22" width="4" height="4.5" rx="1.5" />
      </g>
      {/* parabrisas */}
      <rect x="10" y="8.5" width="12" height="8" rx="2" fill={olive} />
      {/* ✓ */}
      <path
        d="M12.8 12.6l2.2 2.1 4.2-4.2"
        fill="none"
        stroke={mustard}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* faros */}
      <circle cx="11.5" cy="20" r="1.3" fill={mustard} />
      <circle cx="20.5" cy="20" r="1.3" fill={mustard} />
    </svg>
  );
}
