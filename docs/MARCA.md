# MARCA.md — TiaConta

## Ativos registrados
- Domínio: tiaconta.com.br (registro.br, expira 20/10/2027)
- Instagram: @tiaconta.app
- INPI: busca limpa para "TIACONTA" e "TIA CONTA". **Depósito ainda pendente**
  (classes 9 e 42), depois da validação do nome com as escolas.

## Conceito
O nome tem três sentidos: a tia **conta** (relata o dia), a tia **conta**
(registra fraldas, mamadeiras, sono) e a **conta** (mensalidade, módulo financeiro futuro).

Risco conhecido: o livro "Professora sim, tia não" (Paulo Freire). Validar a
reação das diretoras antes de depositar a marca. Na comunicação, a Tia é a
personagem da marca; dentro do app, a profissional é sempre chamada de
**professora** ou **educadora**.

## Símbolo: a Tia
Rosto com coque, óculos redondos e sorriso coral. Usar a versão certa por tamanho:

| Tamanho     | Arquivo / componente                         | O que tem |
|-------------|----------------------------------------------|-----------|
| ≥ 96px      | `public/brand/tia-completa.svg`              | Tudo, com bochechas |
| 41–95px     | `<Logo size={…} />` (traço engrossado)       | Sem bochechas |
| ≤ 40px      | `public/brand/tia-reduzida.svg`              | Coque, cabelo, óculos sólidos |
| favicon 16px| `public/brand/favicon.svg`                   | Só silhueta com coque |
| Ícone do app| `public/brand/tia-icone.svg` + PNGs          | Fundo girassol |
| Fundo escuro| `public/brand/tia-mascote-escuro.svg`        | Cabelo girassol |
| Animação    | `public/brand/tia-animada.svg`               | Balança, pisca, cora; respeita "reduzir movimento" |

Nunca: esticar, girar, trocar a cor da pele, colocar a Tia em fundo coral, ou
usar a versão completa abaixo de 96px.

## Logotipo
`tia` em marinho + `conta` em coral, tudo minúsculo, fonte **Fredoka 600**.
Em fundo escuro: `tia` branco + `conta` coral-claro. Componente: `components/brand/Logo.tsx`.

## Cores
| Nome        | Hex      | Uso |
|-------------|----------|-----|
| Marinho     | #1F2A44  | Texto, cabelo, fundo escuro |
| Coral       | #E5533A  | Destaque da marca; texto só ≥ 19px bold (3.6:1) |
| Coral claro | #FF8A6E  | Coral sobre fundo escuro |
| Girassol    | #FFC24B  | Fundo do ícone, detalhes. Nunca texto |
| Pele        | #FFD6C4  | Só no rosto da Tia |
| Creme       | #FFF3EC  | Fundos suaves, splash |

Tokens em `styles/tokens.css`. Cores semânticas (sucesso, atenção, alerta)
seguem docs/UX.md seção 6.

## Marca da plataforma × marca da escola
- **TiaConta** aparece no ícone do app, splash, login, notificações e marketing.
- **A escola** aparece dentro do tenant: logo e `--escola-primaria`
  (de `escolas.cor_primaria`) no cabeçalho e nos botões principais.
- O pai deve sentir que é o app **da escola dele**, feito pela TiaConta.

## Tipografia
- Marca e títulos: Fredoka (500/600)
- Texto: Nunito (400/600/700)
- Carregar via `next/font/google`.

## Mascote e tom de voz
A Tia fala com carinho, frases curtas, sem infantilizar os pais.
- ✅ "O dia da Ana foi finalizado! Vem ver como foi 💛"
- ✅ "Amanhã a Ana precisa de roupa extra."
- ❌ "Oiii mamãe!!! A princesinha arrasou hoje!!!"

## Próximos passos de marca
- Ilustrador profissional: redesenhar a Tia, criar poses (acenando, comemorando,
  dormindo para estado vazio) e entregar animações em Lottie.
- Manual de marca final após a validação do nome.
