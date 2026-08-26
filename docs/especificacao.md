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
*   **Custo e armadilha:** O trabalho endurece a lógica de ritmo e tolerância de tempo atrelada à física, exigindo alto controle de colisões sem estourar o orçamento da máquina.

### Seção 2. O que a pessoa faz ali
O usuário inicia a cena com um balde vazio e precisa extrair o leite de uma vaca sincronizado a um tempo predeterminado. Para isso, atinge as tetas ativas no tempo exato. Quando a teta ativa for uma das de trás, o usuário precisa primeiro afastar fisicamente as da frente, que bloqueiam o caminho. O sucesso da tarefa ocorre ao preencher 100% do volume do cilindro de leite no menor tempo registrado.

*   **O que faz com as mãos:** Interação física de afastar objetos e puxar em intervalos definidos.
*   **O que muda com o visor:** Adiciona a oclusão gerada pelo corpo da vaca e exige movimentação corporal física do usuário, como agachar e calcular o alcance do próprio braço.
*   **O que a câmera prova (ancoragem na mesa):** Garante a ancoragem geométrica da vaca e do balde no plano físico da mesa real, respeitando os limites e as colisões da superfície.

### Seção 3. Inventário de objetos

| Objeto | Quantos | Origem | Move? | Observação |
| :--- | :--- | :--- | :--- | :--- |
| Vaca | 1 | Importada | Não | Modelo base estático |
| Tetas | 4 | Geradas por código | Sim | Possuem física de mola |
| Balde | 1 | Importado | Sim | Objeto alvo para preenchimento |
| Cilindro de leite | 1 | Gerado por código | Sim | Escala em Y conforme progresso |

### Seção 4. O espaço e as escalas
*   **No visor (Escala real 1:1):** A vaca possui 2.40m de comprimento e 1.50m de altura. O balde possui 40cm de altura.
*   **Pela câmera (Escala reduzida):** A cena é apoiada sobre uma mesa. A vaca possui 30cm de comprimento e o balde possui 5cm de altura.

---

## Bloco B — As regras

### Seção 5. As ações do usuário

| Ação | O que a pessoa faz | O que o sistema faz | Se não puder |
| :--- | :--- | :--- | :--- |
| **Apontar** | Direciona a mão/cursor para o objeto alvo | A teta ganha um *outline* luminoso | Nada acontece |
| **Afastar** | Usa as costas da mão para empurrar as tetas da frente | A malha balança para o lado (física de mola), liberando o caminho espacial para alcançar as de trás | O caminho continua bloqueado |
| **Ordenhar** | Aciona a ação de puxar na teta ativa no tempo correto | O sistema registra saída de leite e sobe o nível (escala Y) do cilindro no balde | A ação trava, emite som de erro (mugido) e o jogador perde tempo cronometrado |

### Seção 6. A tarefa e sua validação
*   **Estado inicial:** Balde vazio (escala do cilindro em 0%).
*   **Estado final:** Balde cheio (escala do cilindro em 100%).
*   **Ordem:** Livre (quaisquer acertos preenchem o volume).
*   **Validação de sucesso:** O sistema registra a conclusão quando o volume atinge 100% e afere o tempo cronometrado total gasto pelo usuário.

### Seção 7. Regras de encaixe e tolerâncias
*   **Tolerância de Posição:** Colisões controladas por *hitboxes* primitivos (cápsulas) com margem de folga inicial de 5cm entre o colisor da mão e o objeto.
*   **Tolerância de Tempo:** Janela de ativação de 800 milissegundos para registrar o acerto na teta correta.

### Seção 8. Retorno ao usuário
*   **Ação de Apontar:** O objeto alvo exibe um contorno (*outline*).
*   **Acerto (Ordenhar no tempo):** Emissão de som de confirmação positivo e aumento visível da escala Y do cilindro dentro do balde.
*   **Erro (Ação fora do tempo ou alvo incorreto):** Bloqueio imediato da ação e emissão de som de vaca em estado de alerta. Se o regime for Tela (PC), aplica-se tremor na câmera.

---

## Bloco C — A máquina

### Seção 9. Os três regimes

| Aspecto | Na tela | No visor | Pela câmera |
| :--- | :--- | :--- | :--- |
| **Como se aponta e age** | Aponta via *raycast* (mouse). Ordenha segurando o clique esquerdo. Afasta arrastando o mouse. | Aponta alcançando com o braço físico. Ordenha com o gatilho (*grip*) do controle. Afasta com o impacto do colisor da mão. | Aponta tocando na tela. Ordenha segurando o toque (*touch*). Afasta com movimento de deslizar (*swipe*). |
| **Escala da cena** | Janela/Tela inteira. | Escala real (1:1). | Escala reduzida, apoiada na mesa. |
| **O que a cena faz de diferente / Falta** | Ausência de profundidade focal e alcance físico corporal. | Exige agachamento do usuário e gerencia a oclusão de visão pelo corpo da vaca. | - |

### Seção 10. Orçamento e desempenho
*   **Total de objetos:** 7 objetos base.
*   **Orçamento de processamento:** A taxa de quadros é resguardada pela rejeição de *mesh colliders* e pela ausência de simulações de fluidos. As interações físicas utilizam colisores primitivos (cápsulas) e as reações das malhas ocorrem por meio de restrições geométricas mecânicas (*Hinge Joints*).
*   **Ordem de degradação estrutural:** Caso o desempenho caia, desativam-se as sombras em tempo real, reduz-se a contagem de vértices dos modelos importados e aplicam-se *shaders* de menor custo computacional.

### Seção 11. Erros, limites e degradação
*   **Hardware incompatível com regime selecionado:** O sistema executa o *fallback* automático para o regime de tela base (PC).
*   **Permissão de câmera negada (AR):** O sistema suspende a execução e exibe um aviso bloqueante na tela.
*   **Perda de rastreamento de superfície:** A cena e a contagem de tempo são pausadas até o reencontro do plano.
*   **Usuário fora do limite de alcance (VR):** O modelo da vaca é escurecido para sinalizar a saída do espaço de interação útil.

---

## Bloco D — O trabalho

### Seção 12. Ativos, formatos e licenças

| Arquivo | Origem | Licença |
| :--- | :--- | :--- |
| Modelo 3D: Vaca | Unity Asset Store / Itch.io | Standard / CC0 |
| Modelo 3D: Balde | Unity Asset Store / Itch.io | Standard / CC0 |
| Arquivos de áudio (Mugido, acerto) | Bibliotecas abertas | Licença aberta / CC0 |

### Seção 13. Plano de construção por blocos
*   **Bloco 1:** Entrega da cena base executada em regime de PC, contendo detecção de clique funcional sobre os modelos e progressão de escala do cilindro de volume.
*   **Bloco 2:** Integração do ciclo lógico rítmico (janelas de tempo) e implementação da física estrutural de mola (*Hinge Joints*) nas tetas.
*   **Bloco 3:** Implementação integral dos regimes de Visão (VR em escala 1:1) e Câmera (AR ancorada em superfície reduzida).

### Seção 14. Riscos, decisões em aberto e declarações
*   **Riscos previstos:** A física vinculada às juntas elásticas pode falhar sob velocidade excessiva do controle, causando o atravessamento da malha na própria geometria. A câmera pode perder rastreamento com alta frequência em mesas de superfície lisa.
*   **Declaração de uso de Inteligência Artificial:** Ferramentas de IA foram utilizadas para a fase de ideação inicial, validação das regras de mecânica contra as exigências do projeto, pré-cálculo do orçamento computacional e para a formatação estrutural das tabelas deste documento. O grupo revisou integralmente a fidelidade técnica do texto gerado.