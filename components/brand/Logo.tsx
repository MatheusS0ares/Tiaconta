/**
 * Logo TiaConta — escolhe a versão da Tia pelo tamanho (docs/MARCA.md).
 *  >= 96px: completa | 41–95px: completa sem bochechas | <= 40px: reduzida
 */
type Props = { size?: number; wordmark?: boolean; tema?: "claro" | "escuro"; className?: string };

export function Logo({ size = 40, wordmark = true, tema = "claro", className }: Props) {
  const escuro = tema === "escuro";
  const cabelo = escuro ? "#FFC24B" : "#1F2A44";
  const reduzida = size <= 40;

  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3 }}>
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden={wordmark} role={wordmark ? undefined : "img"} aria-label={wordmark ? undefined : "TiaConta"}>
        {reduzida ? (
          <>
            <circle cx="100" cy="30" r="28" fill={cabelo} />
            <circle cx="100" cy="114" r="70" fill="#FFD6C4" />
            <path d="M30 114 C30 62 64 44 100 44 C136 44 170 62 170 114 C158 94 132 86 100 86 C68 86 42 94 30 114 Z" fill={cabelo} />
            <circle cx="72" cy="124" r="18" fill="#1F2A44" />
            <circle cx="128" cy="124" r="18" fill="#1F2A44" />
          </>
        ) : (
          <>
            <circle cx="100" cy="34" r="20" fill={cabelo} />
            <circle cx="100" cy="112" r="64" fill="#FFD6C4" />
            <path d="M36 112 C36 66 66 48 100 48 C134 48 164 66 164 112 C152 90 130 80 100 80 C70 80 48 90 36 112 Z" fill={cabelo} />
            <circle cx="76" cy="116" r="15" fill="none" stroke="#1F2A44" strokeWidth={size < 96 ? 8 : 5} />
            <circle cx="124" cy="116" r="15" fill="none" stroke="#1F2A44" strokeWidth={size < 96 ? 8 : 5} />
            <path d="M91 116 H109" stroke="#1F2A44" strokeWidth={size < 96 ? 8 : 5} strokeLinecap="round" />
            <path d="M80 146 Q100 162 120 146" fill="none" stroke="#E5533A" strokeWidth={size < 96 ? 10 : 7} strokeLinecap="round" />
            {size >= 96 && (
              <>
                <circle cx="60" cy="142" r="7" fill="#E5533A" opacity="0.35" />
                <circle cx="140" cy="142" r="7" fill="#E5533A" opacity="0.35" />
              </>
            )}
          </>
        )}
      </svg>
      {wordmark && (
        <span style={{ fontFamily: "var(--fonte-marca)", fontWeight: 600, fontSize: size * 0.7, lineHeight: 1, color: escuro ? "#FFFFFF" : "#1F2A44" }}>
          tia<span style={{ color: escuro ? "#FF8A6E" : "#E5533A" }}>conta</span>
        </span>
      )}
    </span>
  );
}
