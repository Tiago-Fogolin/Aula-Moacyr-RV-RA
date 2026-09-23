# WebXR + Three.js + TypeScript

Projeto WebXR (VR/AR) usando TypeScript, Vite e Three.js.

## Estrutura

```
index.html          ponto de montagem + botões VR/AR + painéis de relatório
vite.config.ts       servidor dev com HTTPS (necessário para WebXR)
tsconfig.json
src/
  main.ts            monta a cena de ordenha, o laço de renderização, a
                      sonda de capacidades e as interações (clique, reparentar)
  controllers.ts      controllers XR (raio, pegar/soltar objetos)
  ar.ts               hit-test de AR (retículo + plantar objetos)
  vite-env.d.ts

  ordenha/            Módulo 03 — grafo de cena e laço de renderização,
                      no domínio próprio do grupo (vaca/ordenha)
    dominio/dominio.ts   peças da cena (vaca, tetas, balde, cilindro de leite)
    core/
      transformacao.ts   composição de rotação+translação em ordens diferentes
      cena.ts            monta a hierarquia da cena (montarCena)
      palco.ts           renderer + câmera, ajusta o canvas a cada quadro
      relogio.ts          Relogio: delta com teto de salto (aba suspensa)
      laco.ts             Laco: setAnimationLoop, orquestra o quadro
      orcamento.ts        Orcamento: custo/intervalo de quadro em janela circular
      hierarquia.ts        reparentar() preservando posição de mundo, descreverArvore()
    ui/painel.ts        painel diegético (textura em canvas) com o orçamento

  devices/            Módulo 02 — sondagem de capacidades XR
  bench/               Módulo 02 — domínio de exercício "Bancada" (regimes,
                      sonda, diário, relatório em DOM), reaproveitado pelo
                      main.ts para a sonda de capacidades e o relatório de regimes
```

## Rodando

```
npm install
npm run dev
```

Abre `https://localhost:5173`. Na primeira vez o navegador avisa do certificado autoassinado — clique em "Avançado → Continuar".

Para simular VR no desktop, instale a extensão [Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik) (Chrome).

## Testando num celular/headset (rede local)

O terminal do `npm run dev` mostra um endereço `Network: https://<seu-ip>:5173/`. Acesse esse endereço no navegador do dispositivo (Chrome no Android; o Quest usa o navegador nativo) e aceite o aviso de certificado.

Se o IP local não funcionar (firewall, isolamento de rede), use um túnel:

```
cloudflared tunnel --url http://localhost:5173
```

e libere o host em `vite.config.ts` (`server.allowedHosts`).

## Validar

```
npm run typecheck
npm run build
```
