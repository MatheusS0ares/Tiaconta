# UX.md — Regras de interface

Base: Laws of UX (lawsofux.com), traduzidas em regras verificáveis.
Toda tela nova ou alterada passa pelo checklist da seção 6 antes de ser
considerada pronta. Se uma regra não puder ser cumprida, registre o motivo
no PR.

## 1. Quem usa e em que condição

| Usuário     | Contexto real                                         | Prioridade       |
|-------------|-------------------------------------------------------|------------------|
| Professora  | Celular, uma mão, criança no colo, pressa, wi-fi ruim | Velocidade       |
| Responsável | Celular, fim do dia, 4G, lê em 30 segundos            | Clareza e afeto  |
| Gestora     | Celular ou computador, quer saber "está tudo em dia?" | Visão geral      |

Em conflito entre leis, vale a prioridade do usuário daquela tela.
Regra de desempate geral: **velocidade ganha de enfeite**.

## 2. Regras globais

### Fitts — alvo grande e perto
- [ ] Todo elemento tocável tem no mínimo 48×48px de área de toque.
- [ ] Espaço mínimo de 8px entre alvos tocáveis.
- [ ] Ação principal da tela fica na metade inferior (zona do polegar),
      como botão fixo no rodapé quando houver uma ação dominante.
- [ ] Ações destrutivas (apagar, desfinalizar) nunca ficam ao lado da ação principal.

### Hick + Choice Overload — poucas escolhas por vez
- [ ] No máximo 5 opções visíveis numa escolha única. Acima disso, agrupar.
- [ ] Opções de campos `opcao` aparecem como botões (chips), nunca dropdown.
- [ ] Uma ação primária por tela. Secundárias com peso visual menor.

### Doherty — resposta em menos de 400ms
- [ ] Toda ação de registro atualiza a tela imediatamente (UI otimista) e
      sincroniza em segundo plano.
- [ ] Falha de rede não perde dado: fica na fila e mostra "pendente de envio".
- [ ] Carregamentos acima de 400ms mostram skeleton, nunca tela em branco.
- [ ] Animações de transição ≤ 200ms.

### Similaridade + Prägnanz — consistência
- [ ] Cada `tipo_campo` tem exatamente um componente de entrada e um de
      exibição, reutilizados em todo o app (`components/agenda/campos/`).
- [ ] Ícones simples, de uma única biblioteca (lucide-react). Sem misturar estilos.
- [ ] A mesma cor significa sempre a mesma coisa (ver seção 5).

### Proximidade + Região Comum — agrupamento
- [ ] Informações relacionadas ficam no mesmo card, com borda ou fundo próprio.
- [ ] Espaço entre grupos maior que espaço dentro do grupo (ex.: 24px vs 8px).

### Jakob — padrões que o usuário já conhece
- [ ] Navegação por barra inferior com no máximo 4 itens.
- [ ] Voltar no canto superior esquerdo. Gestos e padrões do sistema respeitados.
- [ ] Listas, timeline e notificações no estilo de apps de mensagem e redes sociais.

### Paradoxo do Usuário Ativo — sem manual
- [ ] Nenhuma tela depende de tutorial ou texto de ajuda para ser usada.
- [ ] Rótulos com palavras da escola ("Troca de fralda"), não do sistema ("Registro tipo evento").
- [ ] Estado vazio sempre diz o que fazer: "Nenhum registro ainda. Toque em + para começar."

### Postel — aceitar com tolerância, mostrar com precisão
- [ ] Horários aceitam "9", "9h", "09:00", "9:30" e são exibidos sempre como "09:00".
- [ ] Sono pode ser registrado sem horário de fim ("ainda dormindo").
- [ ] Telefone aceita qualquer formatação.

## 3. Professora

### Tesler — o sistema absorve a complexidade
- [ ] Registro em lote é o caminho padrão: "Almoço → Comeu tudo → todos",
      depois exceções por criança.
- [ ] Hora atual pré-preenchida em todo evento.
- [ ] Meta: um item para uma criança em ≤ 2 toques; para a turma em ≤ 4 toques.

### Zeigarnik + Goal-Gradient — o pendente aparece, o progresso puxa
- [ ] Topo da tela da turma mostra progresso: "11 de 15 crianças completas".
- [ ] Cada criança na lista tem indicador de status (pendente / em andamento / finalizado).
- [ ] Botão "Finalizar dia da turma" só fica em destaque quando o progresso chega ao fim,
      e lista quem ainda está pendente se tocado antes.

### Flow — sem interrupção
- [ ] Nada de modal de confirmação para registro comum (desfazer > confirmar).
- [ ] Toast "Desfazer" por 5 segundos após registrar.

## 4. Responsável

### Posição Serial — começo e fim importam
- [ ] Ordem do resumo do dia: (1) como foi o dia + foto, (2) blocos de rotina,
      (3) recado individual, (4) "trazer amanhã" por último.

### Chunking + Miller — blocos, não lista
- [ ] Resumo agrupado em no máximo 5 cards: Alimentação, Sono, Higiene,
      Recados, Trazer amanhã.
- [ ] Mural da turma visualmente separado da nota individual.

### Von Restorff + Atenção Seletiva — destaque só para exceção
- [ ] Registros normais em cor neutra.
- [ ] Exceções em destaque: refeição "Comeu pouco/Recusou", febre, medicação,
      falta, "trazer amanhã" não vazio.
- [ ] No máximo 1 ou 2 elementos em destaque por tela. Se tudo é destaque, nada é.

### Peak-End — o fim do dia é a memória do app
- [ ] Notificação quando o dia é finalizado: "O dia da [criança] foi finalizado ❤️".
- [ ] A notificação abre direto no resumo do dia, não na home.
- [ ] Confirmação de leitura sem botão extra (marcada ao abrir) e "Trazer amanhã"
      com botão "Visto" que dá retorno visual positivo.

## 5. Gestora

### Miller + Pareto — o essencial primeiro
- [ ] Painel inicial com no máximo 5 indicadores: turmas finalizadas/pendentes,
      registros por professora hoje, faltas do dia, pais que leram.
- [ ] Detalhe sempre a um toque, nunca na tela inicial.

### Viés cognitivo — dado, não julgamento
- [ ] Atividade da equipe mostrada como fatos (quem, o quê, quando),
      sem rankings nem rótulos tipo "professora menos ativa".

## 6. Cores e semântica

| Token      | Uso exclusivo                         |
|------------|---------------------------------------|
| primaria   | Ação principal, cor da escola         |
| sucesso    | Finalizado, lido, completo            |
| atencao    | Pendente, comeu pouco, trazer amanhã  |
| alerta     | Febre, medicação, erro                |
| neutra     | Todo o resto                          |

- [ ] Contraste de texto ≥ 4.5:1 (WCAG AA).
- [ ] Cor nunca é o único indicador: sempre com ícone ou texto.

### Estético-Usabilidade
- [ ] Visual caprichado (cor da escola, foto da criança, cantos arredondados),
      mas nenhum enfeite que viole a regra de 400ms ou de 48px.

## 7. Checklist de entrega (toda tela)

- [ ] Testada em 360px de largura
- [ ] Alvos ≥ 48px, ação principal na metade inferior
- [ ] ≤ 5 opções visíveis por escolha
- [ ] Resposta visual < 400ms; funciona com rede lenta (throttling 3G no DevTools)
- [ ] Estado vazio, carregando e erro desenhados
- [ ] Cores usadas conforme a seção 6
- [ ] Destaque só para exceções
- [ ] Sem texto de ajuda necessário para entender a tela
