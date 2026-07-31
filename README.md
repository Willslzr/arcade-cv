# Arcade CV

CV interactivo de **William E. Salazar O.** — Analista de Requerimientos
y Desarrollador.

Es un currículum. Hasta que pulsas el avatar: entonces la interfaz se
corrompe, cuenta atrás desde 10 y la página se convierte en un
*shoot 'em up* espacial a pantalla completa, escrito desde cero sobre
Canvas 2D. Sin motor de juego, sin librerías gráficas.

```
┌─ 1UP 012450 ───── LEÍDO 48% ───── HI-SCORE 041200 ─┐
│                                                     │
│                  [ ▶ PULSA START ]                  │
│              WILLIAM E. SALAZAR O.                  │
│         LEVEL 30 · ANALISTA & DESARROLLADOR         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Stack

| | |
|---|---|
| **UI** | Vue 3 · Composition API · Vite |
| **Motor** | Canvas 2D · JavaScript puro orientado a objetos |
| **Gráficos** | Texture atlas de 128×128 en una única petición |
| **Estilos** | CSS con custom properties, sin framework |
| **Backend** | Vercel Functions + Upstash Redis (ranking global) |
| **Hosting** | Vercel |

Vue se ocupa de la interfaz y del enrutado entre fases. El juego vive en
clases de JS sin ninguna dependencia de Vue: el `<canvas>` es la única
frontera entre los dos mundos.

---

## Arrancar en local

Requiere Node 20 o superior.

```bash
npm install
npm run dev          # http://localhost:5173
```

El CV y el juego funcionan sin backend: el ranking cae a `localStorage`.

Para probar también las funciones serverless:

```bash
cp .env.example .env.local   # y rellenar las variables
npx vercel dev               # levanta el frontend y /api juntos
```

### Variables de entorno

| Variable | Para qué |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Base de datos del ranking |
| `UPSTASH_REDIS_REST_TOKEN` | Autenticación de Upstash |
| `LEADERBOARD_SECRET` | Firma HMAC de las partidas |
| `PUBLIC_ORIGIN` | Dominio permitido en CORS |

Generar el secreto:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve el build para revisarlo |
| `npm run dev:full` | Frontend + funciones serverless (requiere Vercel CLI) |

---

## Cómo editar el contenido

Todo el texto del CV está en un solo fichero:

```
src/data/profile.js
```

Identidad, stack, experiencia, proyectos, contacto y los textos del
glitch. Ningún componente escribe contenido de perfil en su plantilla,
así que cambiar el CV no implica tocar el diseño.

Los colores, tipografías y espaciados están igualmente centralizados:

```
src/assets/styles/tokens.css
```

---

## Estructura

```
api/              Funciones serverless (ranking)
public/           Atlas, imágenes, favicon
src/
  assets/styles/  tokens · base · capa CRT
  components/     layout · cv · game
  composables/    máquina de estados, glitch, ranking, progreso
  data/           contenido del CV
  game/           motor: core · entities · render · systems · config
  lib/            utilidades sin dependencias
```

La documentación técnica completa —decisiones de arquitectura, contrato
de la API, hoja de ruta y estado de cada fase— está en
[`PROJECT.md`](./PROJECT.md).

---

## Controles

| Tecla | Acción |
|---|---|
| ← → ↑ ↓ · WASD | Mover la nave |
| Espacio | Disparar |
| R | Reiniciar |
| Escape | Volver al CV |

---

## Accesibilidad

El sitio pasa por teclado de principio a fin. El avatar es un botón
real, hay enlace para saltar al contenido, el foco es visible, las barras
de nivel exponen sus valores a los lectores de pantalla y
`prefers-reduced-motion` desactiva los efectos ambientales. Las flechas
sólo se capturan durante la partida, para no romper el scroll por teclado
mientras se lee el CV.

---

## Licencia

Código bajo MIT. El contenido del CV, la fotografía y los assets
gráficos no están incluidos en la licencia.
