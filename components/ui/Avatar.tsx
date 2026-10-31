import Image from "next/image";

/** Foto da criança (URL assinada) ou iniciais. */
export function Avatar({ nome, url, tamanho = 48 }: { nome: string; url?: string | null; tamanho?: number }) {
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={tamanho}
        height={tamanho}
        className="shrink-0 rounded-full object-cover"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-superficie font-marca font-semibold text-texto"
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.38 }}
    >
      {iniciais}
    </span>
  );
}
