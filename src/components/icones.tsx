/**
 * Icones desenhados a mao, em SVG inline.
 *
 * Sao poucos e pequenos: uma biblioteca de icones custaria mais bytes no
 * celular da familia do que o portal inteiro. Todos herdam a cor do texto
 * (`currentColor`), entao quem define a cor e' o container.
 */
type Props = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconeMegafone({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M14 8.5a4 4 0 0 1 0 7" />
      <path d="M17 5.5a8 8 0 0 1 0 13" />
    </svg>
  );
}

export function IconeCalendario({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

export function IconeNotas({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v13H6a2 2 0 0 0-2 2Z" />
      <path d="M18 17H6a2 2 0 0 0 0 4h12a1 1 0 0 0 1-1v-3Z" />
      <path d="M9 7h6" />
    </svg>
  );
}

export function IconeAlerta({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function IconeWhatsapp({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

export function IconeLinguagens({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 6.5C10.5 5 8.5 4.5 5 4.5A1 1 0 0 0 4 5.5v12a1 1 0 0 0 1 1c3.5 0 5.5.5 7 2 1.5-1.5 3.5-2 7-2a1 1 0 0 0 1-1v-12a1 1 0 0 0-1-1c-3.5 0-5.5.5-7 2Z" />
      <path d="M12 6.5v14" />
    </svg>
  );
}

export function IconeHumanas({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" />
    </svg>
  );
}

export function IconeNatureza({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M9 3h6M10 3v5.5L5.2 17A2 2 0 0 0 7 20h10a2 2 0 0 0 1.8-3L14 8.5V3" />
      <path d="M7.5 15h9" />
    </svg>
  );
}

export function IconeDiversificadas({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
