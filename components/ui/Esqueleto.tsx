/** Skeleton para carregamentos acima de 400ms (UX.md, Doherty). */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-tc bg-neutra ${className}`} />;
}

export function EsqueletoLista({ itens = 4 }: { itens?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Carregando">
      {Array.from({ length: itens }, (_, i) => (
        <Esqueleto key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
