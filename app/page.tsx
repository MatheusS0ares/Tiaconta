import { redirect } from "next/navigation";
import { exigirUsuario, minhasEscolas, precisaBoasVindas } from "@/lib/auth/sessao";

/** Entrada do app: decide para onde o usuário vai depois do login. */
export default async function Inicio() {
  await exigirUsuario("/");
  if (await precisaBoasVindas()) redirect("/boas-vindas");

  const escolas = await minhasEscolas();
  if (escolas.length === 1) redirect(`/${escolas[0]!.slug}`);
  redirect("/escolher-escola");
}
