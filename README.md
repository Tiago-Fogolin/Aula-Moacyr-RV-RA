# Ordenha — ambiente WebXR

Jogo rítmico em que se ordenha uma vaca em escala real: acertar as tetas no tempo certo enche o balde de leite. O ambiente roda em três regimes: **na tela** (janela do navegador, sem equipamento), **no visor** (VR) e **pela câmera** (AR, com a vaca de 30 cm sobre uma mesa).

A especificação completa (as 14 seções) está em [`docs/especificacao.md`](docs/especificacao.md).
Grupo: Luis Gustavo Marques, Rodrigo Paulino de Freitas, Tiago Fogolin Ragassi, Artur Ricz Badona e Leonardo Neves Bolfarini.

## Como pôr para rodar

Pré-requisitos: [Git](https://git-scm.com) e [Node.js](https://nodejs.org) 18 ou mais novo (confira com `node --version`).

```
git clone https://github.com/Tiago-Fogolin/Aula-Moacyr-RV-RA.git
cd Aula-Moacyr-RV-RA
git checkout modulo-03
npm install
npm run dev
```

O `git checkout modulo-03` avisa que você está em "detached HEAD". É o esperado: a etiqueta é o estado entregue.

Abra `https://localhost:5173` (com **https**). Na primeira vez o navegador avisa do certificado autoassinado: clique em "Avançado → Continuar para localhost". O WebXR exige HTTPS, e o certificado vem do plugin `basicSsl`.

Se a porta 5173 estiver ocupada, o Vite usa a seguinte (5174, 5175…). Use o endereço que o terminal mostrar em `Local:`.

O regime de tela funciona em qualquer navegador de desktop e não precisa de equipamento.

### Em celular ou headset (mesma rede)

O terminal do `npm run dev` mostra um endereço `Network: https://<seu-ip>:5173/`. Abra esse endereço no navegador do aparelho (Chrome no Android, navegador nativo no Quest) e aceite o aviso de certificado. O computador e o aparelho precisam estar no mesmo Wi-Fi. No Windows, se aparecer o aviso do firewall para o Node.js, permita o acesso em redes privadas.

Se o IP local não funcionar (firewall ou isolamento de rede), use um túnel:

```
cloudflared tunnel --url https://localhost:5173 --no-tls-verify
```

e libere o host em `vite.config.ts` (`server.allowedHosts`).

Para simular VR no desktop, há a extensão [Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik) (Chrome).

## Roteiro da demonstração (regime de tela)

1. **A cena abre com os objetos prometidos:** a vaca, as 4 tetas, o balde e o cilindro de leite. No painel esquerdo, abra "Domínio, peças prometidas e regimes": ele diz "7 de 7 peças prometidas estão na árvore". A seção "Árvore da cena…" imprime a árvore.
2. **Um objeto se move junto com outro:** o botão *Deslocar a vaca* move só o nó `vaca`. As tetas vão junto. O diário mostra a posição de mundo da teta mudando e a posição local inalterada.
3. **Um objeto troca de pai e continua onde estava:** *Pegar o balde* passa o balde do `curral` para a `camera`. O diário mostra a posição de mundo antes e depois, com desvio da ordem de 1e-16 m. Gire a câmera com o mouse: o balde vai junto. *Soltar* devolve o balde ao `curral`, no ponto em que ele estiver no mundo.
4. **O indicador de custo do quadro está na cena:** é o painel escuro flutuando à direita da vaca, com custo médio, teto, intervalo entre quadros, chamadas de desenho e triângulos.

Extra: clicar numa teta ordenha, e 12 acertos enchem o balde. *Sondar aparelho* mostra o relatório de capacidades.

## Validar

```
npm run typecheck
npm run build
```

## Estrutura e decisão de arquitetura

**Decisão:** o domínio (o que a cena promete) fica separado da árvore (como ela é montada), do laço (quando ela avança) e da sonda (o que o aparelho oferece).

- A árvore é conferida contra o domínio (`pecasAusentes`).
- O laço só conhece a cena pela raiz.
- A sonda não conhece a cena.

Assim, cada peça pode ser explicada e testada isolada. A troca de pai é uma função só (`reparentar`), usada tanto pelo botão da tela quanto pelos controles de VR.

```
index.html              canvas, botões de demonstração, painéis de relatório
src/
  main.ts                liga as peças: cena, laço, sonda, botões, regimes
  controllers.ts          controles VR: gatilho na teta ordenha, no balde pega (reparentar)
  ar.ts                   hit-test: toque põe o curral na mesa em escala 1:8

  ordenha/
    dominio/dominio.ts    passo 2: tarefa, 7 peças e o motivo de cada parentesco
    core/cena.ts           passo 7: monta a árvore em metros (montarCena)
    core/hierarquia.ts     passo 8: reparentar() + casos de fronteira conferidos
    core/relogio.ts        passo 9: delta por tempo transcorrido, com teto de salto
    core/laco.ts           passo 9: setAnimationLoop; mede o custo de cada quadro
    core/orcamento.ts      passo 9: tetos (16,7 / 11,1 ms) e média em janela de 120
    core/palco.ts          renderer + câmera
    core/transformacao.ts  por que a ordem rotação/translação importa
    ui/painel.ts           indicador de custo dentro da cena (textura em canvas)

  regimes/                passo 3: declaração dos três regimes e isSessionSupported
  devices/                passo 5: sonda (sessão real: ausente × negado, recursos, 3/6 DoF)
    capacidades.ts         o registro que o resto do ambiente consulta (ex.: hit-test no AR)
  relatorio/              passo 6: relatório legível na página e o diário
```

## Aparelhos testados

| Aparelho (navegador) | Regime que abriu | O que não abriu |
| :--- | :--- | :--- |
| Notebook i5-11320H, Windows 11 (Chrome 153.0.8010.53) | Tela | VR e AR: botões "VR NOT SUPPORTED" e "AR NOT SUPPORTED"; a sonda responde sessão ausente |
| Samsung Galaxy S26+ (Chrome 153.0.8010.52) | Tela, AR (a vaca de 30 cm aparece sobre a mesa tocada, e tocar nas tetas enche o balde) e VR (tela dividida, uma imagem por olho) | Os três regimes abrem, mas no VR **não dá para encher o balde**: sem controles, o toque não ordenha |

Nenhum headset (Quest) nem iPhone foi testado até a etiqueta `modulo-03`.

## O mesmo endereço em classes de aparelho diferentes

Resultado do botão *Sondar aparelho* (painel direito), aberto no mesmo endereço em cada aparelho.

| Aparelho (navegador) | Classe | Sessão | Recursos concedidos | Não concedidos (ausente ou negado) | Espaços e graus de liberdade | Interação e composição |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Notebook i5-11320H, Windows 11 (Chrome 153.0.8010.53, janela anônima, sem extensões) | somente-janela | **ausente**: `isSessionSupported` responde "não" para VR e AR | — (sem sessão) | — | — | — |
| Samsung Galaxy S26+ (Chrome 153.0.8010.52) | aparelho de mão com câmera | aberta em `immersive-ar` | local-floor, unbounded, hit-test, anchors, plane-detection | bounded-floor, hand-tracking | local-floor, unbounded, local, viewer · 6 DoF | `screen-space` · `alpha-blend` (confirma a declaração) · nenhuma fonte de entrada antes do toque · 90/90 quadros com pose |

A sonda do PC precisa rodar **sem extensões**, numa janela anônima: com o Immersive Web Emulator ativo, o PC responde como um Quest simulado (controles `meta-quest-touch-plus`, todos os recursos concedidos), e isso não é o aparelho.

O celular declara VR **e** AR, como um visor. Até o Módulo 03 a sonda o classificava como "visor com posição". A classe agora vem do `interactionMode` da sessão (ver Seção 14 da especificação).

## Custo do quadro medido

Leitura do painel na cena com a janela de 120 quadros já cheia, câmera na posição inicial e sem interação.

| Máquina (CPU / GPU / navegador / monitor) | Regime | Custo médio | Teto | Intervalo médio · pior | Quadros acima do teto | Chamadas de desenho · triângulos |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Notebook: Intel Core i5-11320H / Intel Iris Xe (confirmada em `chrome://gpu`; a NVIDIA GeForce MX450 do notebook não foi usada) / Chrome 153.0.8010.53 / tela 1920 × 1080 a 60 Hz | Tela | 0,8 ms | 16,7 ms | 16,7 ms · 17,1 ms | 0 de 120 | 22 · 1468 |

O custo é só de CPU (ver Seção 10 da especificação). O intervalo médio de 16,7 ms é o do monitor de 60 Hz: a cena usa cerca de 5% do teto, e o quadro espera o monitor, não a máquina.
