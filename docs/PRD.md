# PRD v2 — Agenda Escolar (multi-tenant)

Substitui o PRD v1 do repositório `escolinha-abc-diario`, que era cliente único.

## 1. Visão

Agenda digital para educação infantil que se encaixa na rotina que a escola
já tem, em vez de obrigar a equipe a se adaptar a um sistema gigante.
Começa pela agenda diária e cresce por módulos.

Arquitetura SaaS: uma base, várias escolas, cada uma com sua configuração.
A Escolinha ABC é o tenant nº 1 e dita as prioridades do MVP.

## 2. Cliente piloto: Escolinha ABC

- Escolinha ABC – Berçário e Educação Infantil, Gama-DF, ~54 crianças
- Hoje: agenda em papel com alimentação, necessidades fisiológicas, rotina
  do dia e avisos para o dia seguinte (roupa, informativos)
- Já tentou um sistema grande (ERP) e abandonou: a equipe tinha que se
  adaptar ao sistema
- Dor da diretora: não sabia se as professoras estavam usando o sistema ou o
  celular para outras coisas

## 3. Princípios

1. **O sistema se adapta à escola.** Campos da agenda configuráveis por escola
   e por faixa etária.
2. **Rápido para a professora.** Registro em lote para a turma e exceções por
   criança. Se for mais lento que o papel, ela volta pro papel.
3. **Transparência para a gestão.** Todo registro tem autor e horário.
4. **Individual para o pai.** O pai quer saber do filho dele, não ler um texto
   colado para a turma toda.

## 4. Papéis

| Papel        | Faz                                                              |
|--------------|------------------------------------------------------------------|
| gestor       | Configura escola, turmas, crianças, campos; vê tudo; painel da equipe |
| professora   | Registra a agenda das turmas dela; escreve mural da turma; finaliza o dia |
| responsavel  | Vê agenda, mural e comunicados só dos próprios filhos; confirma leitura |

Um mesmo usuário pode ter papéis diferentes em escolas diferentes.

## 5. Diferenciais sobre o Minha Escola (do benchmark)

| Minha Escola                                | Nós                                              |
|---------------------------------------------|--------------------------------------------------|
| Sono e evacuação só sim/não                 | Sono com horário; trocas de fralda com hora e tipo |
| "Observações" é texto coletivo colado em cada criança | Mural da turma separado de nota individual |
| Sem "trazer amanhã" estruturado             | Checklist "trazer amanhã" com confirmação do pai |
| Fotos da turma num feed genérico            | (Fase 3) fotos marcadas por criança, respeitando autorização de imagem |
| Status "FINALIZADO" sem rastro              | Finalização com autor e horário + painel da equipe |
| Botões de admin aparecendo para o pai       | Interfaces separadas por papel                   |

## 6. Fases

### Fase 1 — MVP (Escolinha ABC)
- Cadastro: escola, turmas (com faixa etária), crianças, responsáveis, equipe
- Convite por link/WhatsApp para professoras e responsáveis
- Campos da agenda configuráveis (template padrão de berçário já criado)
- **Professora:** tela da turma → lista de crianças com status do dia;
  registro em lote ("almoço: todos comeram tudo") + exceções; mural da turma;
  marcar falta; finalizar dia
- **Responsável:** resumo do dia do filho (registros + mural + nota individual
  + trazer amanhã), histórico por calendário, confirmação de leitura
- **Gestor:** painel do dia — turmas finalizadas/pendentes, atividade por
  professora (quem registrou o quê e quando)
- PWA instalável + push quando o dia é finalizado

### Fase 2 — Comunicação
- Comunicados para escola, turma ou criança, com anexo e confirmação de leitura
- Gestor vê quem leu e quem não leu

### Fase 3 — Linha do tempo
- Posts com fotos/vídeos por turma
- Marcação de crianças nas fotos; criança sem autorização de imagem não
  aparece em post coletivo

### Fase 4 — Rotina escolar
- Cardápio da semana, calendário de eventos

### Fase 5 — Financeiro (por integração, nunca do zero)
- Mensalidade via gateway (boleto/Pix), NF via integradora, contrato com
  assinatura digital

## 7. Requisitos não funcionais

- Isolamento total entre escolas via RLS (testado)
- Funciona em 4G e com wi-fi instável (PWA com cache; registros com retry)
- Interface em pt-BR, mobile-first (360px)

## 8. LGPD

Dados de crianças, incluindo saúde (medicação, febre, alergias), são sensíveis.
- Termo de consentimento do responsável no primeiro acesso
- Autorização de uso de imagem por criança (`criancas.autoriza_imagem`)
- Fotos em bucket privado com URL assinada, nunca pública
- Exclusão de dados ao fim do vínculo, sob pedido

## 9. Métricas de sucesso do piloto

- % de dias finalizados por turma (meta: > 90% após 3 semanas)
- Tempo médio para preencher a agenda de uma turma
- % de responsáveis que abrem o resumo do dia
- Agenda de papel abandonada em até 30 dias

## 10. Fora de escopo agora

Autocadastro de escolas, cobrança do SaaS, app nativo, painel de superadmin,
acadêmico/notas.

## 11. Pendências de validação com a ABC

- Quais campos da agenda de papel ela usa hoje (validar o template padrão)
- Número de turmas, professoras e faixas etárias
- Como falam com os pais hoje
- Pais veem a agenda em tempo real ou só depois de finalizada
  (configurável: `escolas.agenda_visivel_antes_finalizar`)
