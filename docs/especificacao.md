# Especificação — Ordenha

> Versão do fim do Módulo 03 (etiqueta `modulo-03`). O que mudou desde o Módulo 01 está
> registrado na Seção 14, com o motivo.

## Bloco A — A cena

### Seção 1. Identificação do grupo e da cena
*   **Grupo:**
    *    Luis Gustavo Marques - 1965528
    *    Rodrigo Paulino de Freitas - 1968972
    *    Tiago Fogolin Ragassi - 1969891
    *    Artur Ricz Badona - 1957868
    *    Leonardo Neves Bolfarini - 1964565
*   **Cena escolhida:** Cena Própria.
*   **Frase única:** Um jogo rítmico em realidade mista onde o jogador deve ordenhar uma vaca em escala real, usando interações físicas manuais para acertar obstáculos no tempo certo.
*   **Custo e armadilha:** O que a cena mais endurece é a **escala**: a mesma vaca existe em 1:1 (2,40 m, com o úbere a 0,78 m, que obriga a agachar no VR) e em 1:8 (30 cm sobre uma mesa no AR). A armadilha que vem junto: tudo o que depende de tamanho se comporta diferente em cada regime, como o alvo de toque, o tamanho do painel e a escala que a troca de pai preserva. Em segundo lugar vem o **tempo**, que endurece a partir do Bloco 2: a janela de acerto é medida em milissegundos (800 ms), e um laço que avança por contagem de quadros faria a mesma janela durar tempos diferentes em máquinas diferentes. Por isso o relógio já foi feito por tempo no Módulo 03.

    **O que a cena endurece e a armadilha de cada parte:**

    | Parte que endurece | Por quê | Armadilha que vem junto |
    | :--- | :--- | :--- |
    | Escala e alcance do corpo | Vaca de 2,40 m com úbere a 0,78 m (agachar no VR) e a mesma cena em 1:8 no AR | Em 1:8, a teta tem 2,75 cm de altura e menos de 1 cm de largura, e a distância frente–trás cai para 2,25 cm, quando um dedo na tela cobre cerca de 1 cm (no Galaxy S26+, o toque acertou as tetas). No Módulo 03 a escala já custou: ela virou um campo do regime aplicado num nó só, o painel de custo encolhe para cerca de 6 cm no AR, e o balde solto no curral em 1:8 fica 8× maior |
    | Tempo | Jogo rítmico, janela de acerto de 800 ms (Bloco 2) | Um laço por contagem de quadros faz a janela valer 800 ms a 60 Hz e 400 ms a 120 Hz |
    | Precisão entre objetos próximos | 4 tetas a 0,18 m (frente–trás) e 0,28 m (esquerda–direita), e é preciso afastar as da frente | Com raio de 3,5 cm e folga de 5 cm, sobra 0,18 − 2 × (0,035 + 0,05) = 0,01 m entre as áreas de acerto vizinhas. Com folga de 6 cm, elas se sobrepõem e o toque pode acertar a teta errada |

**As quatro perguntas da cena própria:**

| Pergunta | Resposta |
| :--- | :--- |
| O que se faz com as mãos que não seja apertar botão | Afastar com as costas da mão as tetas da frente para alcançar as de trás, e puxar a teta ativa dentro da janela de tempo. |
| O que muda de verdade no visor | O úbere fica a 0,78 m do chão: é preciso agachar e medir o alcance do próprio braço, e o corpo da vaca tapa a visão das tetas de trás. |
| O que precisa provar contra uma mesa de verdade | Que a vaca de 30 cm fica presa ao tampo da mesa enquanto a pessoa anda em volta, sem deslizar. |
| Que número produz que pode sair diferente do esperado, contra qual alternativa | O tempo para encher o balde (12 acertos). Esperamos que no visor ele seja **maior** que na tela, porque agachar e afastar custam tempo; se sair igual ou menor, o afastar físico não está pesando e a cena no visor não difere da janela. |

### Seção 2. O que a pessoa faz ali
O usuário inicia a cena com um balde vazio e precisa extrair o leite de uma vaca sincronizado a um tempo predeterminado. Para isso, atinge as tetas ativas no tempo exato. Quando a teta ativa for uma das de trás, o usuário precisa primeiro afastar fisicamente as da frente, que bloqueiam o caminho. O sucesso da tarefa ocorre ao preencher 100% do volume do cilindro de leite no menor tempo registrado.

*   **Tarefa em uma frase:** Encher o balde (cilindro de leite em 100%) acertando as tetas ativas no tempo certo.
*   **Estado que conclui a tarefa:** Escala Y do cilindro de leite = 1 (balde cheio), com o tempo total registrado. Hoje isso leva 12 acertos de 1/12 cada; esse número é um parâmetro de ajuste (`AVANCO_POR_ACERTO`), a calibrar quando a janela rítmica existir (Bloco 2).
*   **O que faz com as mãos:** Interação física de afastar objetos e puxar em intervalos definidos.
*   **O que muda com o visor:** Adiciona a oclusão gerada pelo corpo da vaca e exige movimentação corporal física do usuário, como agachar e calcular o alcance do próprio braço.
*   **O que a câmera prova (ancoragem na mesa):** Garante a ancoragem geométrica da vaca e do balde no plano físico da mesa real, respeitando os limites e as colisões da superfície.

### Seção 3. Inventário de objetos

| Objeto | Quantos | Origem (Módulo 03) | Origem planejada | Move? | Pai na árvore | Observação |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Vaca | 1 | Primitivas em código (cápsula, caixas, cilindros, esferas) | Importada (Módulo 05) | Sim, pelo botão "Deslocar a vaca" | curral | Modelo base |
| Tetas | 4 | Cilindro em código | Gerada por código | Sim (junto com a vaca) | vaca | Física de mola no Bloco 2 |
| Balde | 1 | Cilindro em código | Importado (Módulo 05) | Sim, pode ser pego | curral (ou mão/câmera, quando pego) | Objeto alvo para preenchimento |
| Cilindro de leite | 1 | Cilindro em código, pivô na base | Gerado por código | Sim (junto com o balde) | balde | Escala em Y conforme progresso |

Nós de estrutura que não são objetos do domínio: `sala` (raiz), `curral` (grupo que é posto sobre a mesa em AR), `chao` (plano 6 × 6 m), `suporte-do-painel` e `painel` (indicador de custo do quadro).

### Seção 4. O espaço e as escalas
*   **No visor e na tela (escala real 1:1):** A vaca possui 2,40 m de comprimento e 1,50 m de altura (topo do corpo). O úbere fica a 0,78 m do chão. As tetas medem 0,22 m. O balde possui 0,40 m de altura e 0,22 m de raio na boca.
*   **Pela câmera (escala 1:8 = 0,125):** A cena é apoiada sobre uma mesa. A vaca possui 30 cm de comprimento e o balde possui 5 cm de altura. A escala é aplicada **num nó só** (`curral`), e a árvore leva vaca, tetas, balde e cilindro junto.

---

## Bloco B — As regras

### Seção 5. As ações do usuário

| Ação | O que a pessoa faz | O que o sistema faz | Se não puder |
| :--- | :--- | :--- | :--- |
| **Apontar** | Direciona a mão/cursor para o objeto alvo | A teta ganha um *outline* luminoso | Nada acontece |
| **Afastar** | Usa as costas da mão para empurrar as tetas da frente | A malha balança para o lado (física de mola), liberando o caminho espacial para alcançar as de trás | O caminho continua bloqueado |
| **Ordenhar** | Aciona a ação de puxar na teta ativa no tempo correto | O sistema registra saída de leite e sobe o nível (escala Y) do cilindro no balde | A ação trava, emite som de erro (mugido) e o jogador perde tempo cronometrado |
| **Pegar o balde** | Aperta o gatilho mirando o balde (VR) ou usa o botão "Pegar o balde" (tela) | O balde troca de pai: do curral para a mão (ou câmera), preservando a posição no mundo | O balde fica onde está |

### Seção 6. A tarefa e sua validação
*   **Estado inicial:** Balde vazio (escala do cilindro em 0%).
*   **Estado final:** Balde cheio (escala do cilindro em 100%).
*   **Ordem:** Livre (quaisquer acertos preenchem o volume).
*   **Validação de sucesso:** O sistema registra a conclusão quando o volume atinge 100% e afere o tempo cronometrado total gasto pelo usuário.

### Seção 7. Regras de encaixe e tolerâncias

> **Estado no Módulo 03:** os valores abaixo são de projeto e ainda não foram conferidos. O afastar, o puxão com cone, a janela de 800 ms e o teste do balde no chão são do Bloco 2 (Seção 13). Serão testados quando existirem e, se precisarem de ajuste, a mudança será registrada na Seção 14 com o motivo.

*   **Tolerância de posição:** Colisões controladas por *hitboxes* primitivos (cápsulas) com margem de folga de 5 cm entre o colisor da mão e o objeto.
*   **Tolerância de ângulo (afastar):** Uma teta da frente conta como afastada quando está girada pelo menos 25° em relação à posição de repouso. Abaixo disso, o caminho para a teta de trás continua bloqueado.
*   **Tolerância de ângulo (ordenhar, no visor):** O puxão conta quando a mão se move para baixo dentro de um cone de 30° em torno da vertical.
*   **Tolerância de tempo:** Janela de ativação de 800 milissegundos para registrar o acerto na teta correta.
*   **Balde no chão:** O balde solto conta como "embaixo do úbere" se o centro dele estiver a até 10 cm, na horizontal, do centro das quatro tetas.

### Seção 8. Retorno ao usuário
*   **Ação de apontar:** O objeto alvo exibe um contorno (*outline*). No Módulo 03 isso ainda é um brilho emissivo (0x333333) sob a mira do controle.
*   **Acerto (ordenhar no tempo):** Emissão de som de confirmação positivo e aumento visível da escala Y do cilindro dentro do balde (1/12 por acerto, animado a 2 baldes por segundo).
*   **Erro (ação fora do tempo ou alvo incorreto):** Bloqueio imediato da ação e emissão de som de vaca em estado de alerta. Se o regime for Tela (PC), aplica-se tremor na câmera.

---

## Bloco C — A máquina

### Seção 9. Os três regimes

Declaração dos regimes (passo 3). É o mesmo conteúdo de `src/regimes/regime.ts`, que o relatório da página mostra.

| | Na tela (janela) | No visor (VR) | Pela câmera (AR) |
| :--- | :--- | :--- | :--- |
| **O que faz com o mundo de quem observa** | **Mostra** a cena por uma janela, sem tocar o mundo | **Substitui** o mundo por inteiro | **Mantém** o mundo e deposita a cena sobre ele |
| **Modo da sessão** | `inline` (página comum) | `immersive-vr` | `immersive-ar` |
| **Espaço de referência** | `viewer` | `local-floor` | `local-floor` |
| **O que é rastreado** | Nada do corpo; a câmera orbita a vaca pelo mouse e o clique ordenha | Pose da cabeça e dos dois controles, com 6 graus de liberdade | Pose do aparelho e as superfícies reais que ele encontra (*hit-test*) |
| **Contra o que a cena é registrada** | A origem da própria cena: o chão do curral em y = 0, sob a vaca | O chão do quarto de quem joga: as patas da vaca pisam no chão real e o úbere fica a 0,78 m, o que obriga a agachar | O tampo de uma mesa real, escolhido pelo toque: o curral nasce ali, em escala 1:8, e fica preso à mesa |
| **Composição esperada** | `opaque` | `opaque` | `alpha-blend` |
| **Escala** | 1:1 | 1:1 | 1:8 |
| **Como se aponta e age** | *Raycast* do mouse. Ordenha com clique. Afasta arrastando. | Alcance do braço. Ordenha com o gatilho. Afasta com o colisor da mão. | Toque na tela. Ordenha segurando o toque. Afasta com *swipe*. |
| **O que tem de provar adiante** | Que a tarefa inteira é possível só com clique | Que o agachar e a oclusão pela vaca mudam o tempo de conclusão | Que a vaca não desliza sobre a mesa enquanto a pessoa anda em volta |
| **O que hoje ainda é promessa** | Afastar arrastando e o tremor da câmera | Afastar com a mão (sem física de mola ainda) | Registro estável na mesa (só o posicionamento pelo toque existe) |

### Seção 10. Orçamento e desempenho
*   **Total de objetos:** 7 objetos do domínio. A vaca é composta por 14 primitivas, mais 4 tetas, balde, cilindro, chão e painel dão 22 chamadas de desenho na janela.
*   **Teto do custo do quadro, declarado antes de haver conteúdo pesado:**
    *   Na tela e no celular (AR): **16,7 ms** (60 Hz).
    *   No visor (VR): **11,1 ms** (90 Hz).
    *   O teto muda sozinho ao entrar e sair da sessão.
*   **O que se mede:** O custo é o tempo de CPU do quadro inteiro (ajuste do canvas, passos da cena e chamada de desenho), além do intervalo real entre quadros. Os dois são mostrados como média numa janela de 120 quadros, no painel dentro da cena.
*   **Custo medido:** ver a tabela "Custo do quadro medido" no `README.md`, com a máquina de cada medida.
*   **Orçamento de processamento:** A taxa de quadros é resguardada pela rejeição de *mesh colliders* e pela ausência de simulações de fluidos. As interações físicas utilizam colisores primitivos (cápsulas) e as reações das malhas ocorrem por meio de restrições geométricas mecânicas (*Hinge Joints*).
*   **Ordem de degradação:** Caso o custo médio passe do teto:
    1. Desativam-se as sombras em tempo real.
    2. Reduz-se a contagem de vértices dos modelos importados.
    3. Aplicam-se *shaders* de menor custo computacional.

### Seção 11. Erros, limites e degradação
*   **Hardware incompatível com o regime selecionado:** O sistema cai para o regime de tela (PC). O botão de VR ou de AR aparece como "não suportado", e a cena continua jogável por clique.
*   **Ausente × negado, na sessão:**
    *   **Ausente:** o `isSessionSupported` diz que o modo não existe. O botão mostra "não suportado", e a cena segue na tela. Trocar de aparelho resolve; tentar de novo, não.
    *   **Negado:** o `isSessionSupported` diz que o modo existe, e mesmo assim o `requestSession` foi recusado (a pessoa recusou a permissão ou faltou o gesto). O relatório diz "tocar de novo e aceitar resolve". Aqui é o contrário: tentar de novo resolve; trocar de aparelho, não.
*   **Ausente × negado, por recurso:** o WebXR só devolve a lista do que foi **concedido** (`enabledFeatures`). A especificação do WebXR esconde de propósito se um recurso que não veio é ausente ou negado, para a página não identificar o aparelho pelas recusas. Por isso o estado por recurso é "concedido", "não concedido (ausente ou negado)" ou "indeterminado" (o navegador não implementa `enabledFeatures`). Essa é uma limitação declarada.
*   **Resposta do ambiente ao `hit-test` na sessão AR:** o ambiente consulta o registro de capacidades (`src/devices/capacidades.ts`) em vez de presumir.
    *   **Concedido:** o curral espera o toque numa mesa.
    *   **Não concedido:** o curral é posto 0,6 m à frente, a 0,75 m do chão, sem registro contra a mesa, e o diário avisa.
    *   **Indeterminado:** a mesma posição de reserva, e um toque leva o curral para a mesa se o retículo aparecer.
*   **Permissão de câmera negada (AR):** O sistema suspende a execução e exibe um aviso bloqueante na tela.
*   **Perda de rastreamento de superfície:** A cena e a contagem de tempo são pausadas até o plano ser reencontrado.
*   **Usuário fora do limite de alcance (VR):** O modelo da vaca é escurecido para sinalizar a saída do espaço de interação útil.
*   **Aba suspensa:** O relógio corta qualquer salto maior que 0,1 s. Voltar de uma aba escondida não enche o balde de uma vez.

---

## Bloco D — O trabalho

### Seção 12. Ativos, formatos e licenças

| Arquivo | Origem | Licença | Situação no Módulo 03 |
| :--- | :--- | :--- | :--- |
| Modelo 3D: Vaca | Unity Asset Store / Itch.io | Standard / CC0 | Não usado: primitivas em código |
| Modelo 3D: Balde | Unity Asset Store / Itch.io | Standard / CC0 | Não usado: cilindro em código |
| Arquivos de áudio (mugido, acerto) | Bibliotecas abertas | Licença aberta / CC0 | Ainda não integrados |
| Three.js 0.169 | npm | MIT | Em uso |

### Seção 13. Plano de construção por blocos
*   **Bloco 1:** Cena base executada em regime de PC, com detecção de clique funcional sobre as tetas e progressão de escala do cilindro de volume. **Estado: feito no Módulo 03** (junto com a árvore, a troca de pai e o laço por tempo).
*   **Bloco 2:** Integração do ciclo lógico rítmico (janelas de tempo) e implementação da física estrutural de mola (*Hinge Joints*) nas tetas.
*   **Bloco 3:** Implementação integral dos regimes de Visão (VR em escala 1:1) e Câmera (AR ancorada em superfície reduzida). **Estado parcial:** o posicionamento do curral sobre a mesa em escala 1:8 e a posição da vaca no visor já existem, mas ainda não há âncora (`anchors`) nem teste de estabilidade.

### Seção 14. Riscos, decisões em aberto e declarações
*   **Riscos previstos:** A física vinculada às juntas elásticas pode falhar sob velocidade excessiva do controle, fazendo a malha atravessar a própria geometria. A câmera pode perder o rastreamento com frequência em mesas de superfície lisa.
*   **Capacidades ainda presumidas (limitações declaradas):**
    1. **`local-floor` no VR:** o three.js o pede sem consultar. Num visor que não o conceda, a cena não é configurada. Correção prevista: consultar e cair para `local`, com a vaca 1,6 m abaixo da origem.
    2. **90 Hz no visor:** o teto de 11,1 ms presume 90 Hz. O Quest 2 roda a 72 Hz por padrão (teto de 13,9 ms) e o Quest 3 pode rodar a 120 Hz (8,3 ms). Correção prevista: teto = 1000 / `session.frameRate`.
    3. **`dom-overlay` no AR:** os avisos do diário podem não aparecer durante o AR. Correção prevista: repetir o aviso no painel dentro da cena.
*   **Decisões em aberto:** Onde soltar o balde depois de carregado. Hoje ele fica onde estava no mundo, mesmo no ar, porque ainda não há gravidade nem teste de "balde no chão" (Seção 7).

**Registro de decisões que mudaram desde o Módulo 01**

| Decisão no Módulo 01 | Decisão atual | Motivo |
| :--- | :--- | :--- |
| Vaca e balde importados | Primitivas em código | O Módulo 03 pede geometria crua para expor a estrutura. Ativos externos ficam para o Módulo 05. |
| Balde "nasce solto para ser afastado" (sem troca de pai definida) | O balde troca de pai, do curral para a mão (ou a câmera na tela) e de volta | A montagem dos módulos seguintes vai consumir exatamente essa operação. Carregar o balde é a ação do domínio que a exige. |
| Regimes descritos só pelo modo de apontar e pela escala | Regimes declarados por espaço de referência, rastreamento e registro (Seção 9) | Um rótulo não distingue os regimes. O que os distingue é o que fazem com o mundo de quem observa. |
| Escala da câmera "reduzida", sem número | 1:8 (0,125), aplicada ao nó `curral` | Deixa a vaca com 30 cm e o balde com 5 cm, que eram as medidas prometidas na Seção 4. |
| O que a cena endurece: o ritmo e o tempo | Primeiro a escala, depois o tempo (Seção 1) | O laço por tempo é trabalho de qualquer cena. O que o Módulo 03 mostrou ser caro na nossa foi ter a mesma vaca em 1:1 e em 1:8: o painel encolhe para 6 cm no AR, o balde solto no curral em 1:8 fica 8× maior, e as tetas ficam a 2,25 cm uma da outra. A janela de 800 ms continua sendo a segunda armadilha, a partir do Bloco 2. |
| Sem teto de custo | 16,7 ms na tela e no AR, 11,1 ms no visor | Um teto declarado antes do conteúdo pesado transforma a discussão em conta. |

**Tentado e abandonado**

| O que tentamos | Por que abandonamos |
| :--- | :--- |
| Relatório e regimes em cima do domínio de exercício do material ("Bancada") | Descrevia uma cena que não é a nossa. Foi trocado pelo domínio da ordenha, e o relatório agora confere se as 7 peças prometidas estão na árvore. |
| Trocar de pai o painel de orçamento (suporte ↔ balde) | Funcionava, mas o painel não faz parte do domínio e não havia razão de projeto. Foi substituído por pegar o balde. |
| Soltar o objeto pego na raiz da cena (`scene.attach`) | O objeto perdia o pai original, por exemplo o balde deixava de ser filho do curral e não ia junto quando o curral era posto sobre a mesa em AR. Agora ele volta ao pai de origem. |
| `hit-test` obrigatório no botão de AR | Num aparelho sem ele, a sessão nem abria e o ambiente não aprendia nada. Agora é opcional, e a cena reage ao que foi concedido (Seção 11). |
| Chamar de "negado" todo recurso que não veio | Confundia ausente com negado, coisa que a API não permite afirmar. Agora é "não concedido", e a distinção ausente × negado é feita na sessão. |
| Ordenhar **segurando** o clique (versão do Módulo 01) | Segurar é contínuo e não tem instante de acerto, e a janela de 800 ms precisa de um instante para comparar. Agora cada clique é um acerto, e 12 enchem o balde. |
| Medir se o painel é legível pela altura aparente, com limiar de 20 minutos de arco | O limiar vinha do material de referência e não foi medido por nós, e a função não era usada por nenhuma parte da cena. Foi removida. Medir o nosso limiar, no visor e no AR em 1:8 (em que o painel encolhe para cerca de 6 cm), é trabalho em aberto. |
| Classificar o aparelho pelos modos que ele declara (só AR = celular) | O Chrome do Android declara VR **e** AR, e o celular aparecia no relatório como "visor com posição". Só apareceu ao abrir no celular de um colega. Agora a classe vem do `interactionMode` da sessão: `screen-space` é aparelho de mão, e `world-space` é visor. |
| Tetas presas à mão pelo gatilho no VR | A teta saía de dentro da vaca e não voltava ao lugar. Agora o gatilho na teta ordenha, e só o balde pode ser pego. |

*   **Declaração de uso de Inteligência Artificial:** Ferramentas de IA foram usadas na ideação inicial, na validação das regras de mecânica contra as exigências do projeto, no pré-cálculo do orçamento computacional e na formatação das tabelas deste documento. No Módulo 03, um assistente (Claude) também escreveu parte do código de troca de pai, dos casos de fronteira, do posicionamento em AR e desta revisão da especificação. O grupo revisou o texto e o código e é responsável por explicá-los.
