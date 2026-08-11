# WebXR + Three.js + TypeScript

Projeto WebXR (VR/AR) usando TypeScript, Vite e Three.js.

## Estrutura

```
index.html          ponto de montagem + botões VR/AR
vite.config.ts       servidor dev com HTTPS (necessário para WebXR)
tsconfig.json
src/
  main.ts            renderer, botões VR/AR, loop de animação
  scene.ts            cena, câmera, luzes, objetos de exemplo
  controllers.ts      controllers XR (raio, pegar/soltar objetos)
  ar.ts               hit-test de AR (retículo + plantar objetos)
  vite-env.d.ts
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
