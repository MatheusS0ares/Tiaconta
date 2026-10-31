"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Aviso } from "@/components/ui/Aviso";
import { enviarFoto } from "../actions";

const LADO_MAX = 800;

/** Reduz a foto no navegador (≤ 800px, JPEG) para enviar rápido no 4G. */
async function reduzir(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error("falha"))), "image/jpeg", 0.85));
}

export function FotoCrianca({ slug, id, nome, url }: { slug: string; id: string; nome: string; url: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Avatar nome={nome} url={previa ?? url} tamanho={80} />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={enviando}
          className="flex min-h-12 items-center gap-2 rounded-tc border-2 border-neutra px-4 font-bold disabled:opacity-60"
        >
          {enviando ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Camera className="size-5" aria-hidden />}
          {enviando ? "Enviando…" : url ? "Trocar foto" : "Adicionar foto"}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Foto da criança"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = "";
            if (!arquivo) return;
            setErro(null);
            iniciar(async () => {
              try {
                const blob = await reduzir(arquivo);
                setPrevia(URL.createObjectURL(blob)); // mostra na hora (UI otimista)
                const form = new FormData();
                form.set("foto", new File([blob], "foto.jpg", { type: "image/jpeg" }));
                const r = await enviarFoto(slug, id, form);
                if (r.erro) {
                  setErro(r.erro);
                  setPrevia(null);
                } else router.refresh();
              } catch {
                setErro("Não conseguimos ler essa imagem. Tente outra foto.");
                setPrevia(null);
              }
            });
          }}
        />
      </div>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
    </div>
  );
}
