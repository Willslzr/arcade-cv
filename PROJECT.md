# PROJECT.md — Memoria del proyecto

> **Para la IA que lea esto:** este fichero es la fuente de verdad del
> estado del proyecto. Léelo antes de tocar código. No hace falta
> revisar el historial de conversación: lo relevante está aquí.
> Al terminar cualquier cambio, actualiza *Estado actual*, *Registro de
> cambios* y *Pendiente*. Sé concreto y breve; esto no es un diario.

**Última actualización:** 2026-07-31
**Fase actual:** 5 de 6 — contenido real desde el CV, stack en 4 columnas, y CV bilingüe ES/EN. Las 3 fases de este pedido están cerradas.

---

## 1. Qué es esto

Landing page híbrida de CV para **William E. Salazar O.** (Analista de
Requerimientos y Desarrollador, Buenos Aires).

A primera vista es un currículum con estética arcade. Al pulsar el
avatar, la interfaz se corrompe (glitch), cuenta atrás de 10 segundos y
la página se convierte en un *shoot 'em up* espacial a pantalla completa
escrito desde cero sobre Canvas 2D.

**Objetivo real:** que un reclutador recuerde el sitio. El CV se lee en
30 segundos; el juego demuestra dominio de POO, bucle de render,
colisiones y rendimiento.

---

## 2. Stack y decisiones

| Capa | Elección | Por qué |
|---|---|---|
| UI | Vue 3 (Composition API) + Vite | Reactividad para la máquina de estados y el CV; nada de render de juego. |
| Motor | Canvas 2D + JS puro (POO) | 60 fps sin tocar el DOM. Sin librerías de juego: el mérito es el punto. |
| Assets | Texture atlas 128×128 (`atlas.png`) | Una sola petición HTTP, `drawImage` con recortes. |
| Estilos | CSS con custom properties | Sin Tailwind: el sistema de tokens es pequeño y explícito. |
| Backend | Vercel Functions + Upstash Redis | Un ranking es un sorted set. Ver §5. |
| Hosting | Vercel + dominio propio | Ver §6. |

### Decisiones descartadas y por qué

- **Laravel** → sobredimensionado. No hay entidades, ni auth, ni panel.
  Un servidor PHP encendido 24/7 para guardar 20 números es coste sin
  beneficio.
- **Node persistente (Express en un VPS)** → mismo problema: el tráfico
  es esporádico, y pagar un contenedor idle no aporta nada. Serverless
  cobra por invocación.
- **PostgreSQL / Supabase** → un ORM y migraciones para una única tabla
  de 4 columnas. Redis resuelve el orden por puntuación de forma nativa.
- **Tailwind** → el proyecto tiene una identidad visual muy concreta;
  las utilidades genéricas estorbarían más de lo que ayudan.

---

## 3. Estructura de carpetas

```
arcade-cv/
├── api/                          Funciones serverless (Vercel, Node 22)
│   ├── _lib/
│   │   ├── redis.js              Cliente Upstash por REST + claves
│   │   ├── guard.js              Validación, HMAC de partidas, rate limit
│   │   └── guard.test.js         Vitest: firma, iniciales, límites de partida
│   └── scores/
│       ├── index.js              GET top 20 · POST registrar puntuación
│       └── start.js              POST abrir partida → runId firmado
│
├── public/
│   ├── assets/atlas.png          Texture atlas 128×128
│   ├── img/avatar.jpeg           Foto de perfil
│   ├── img/pixel-avatar.jpeg     Versión pixel art (sin usar aún)
│   ├── og.png                    1200×630, generado — ver §10 (2026-07-31)
│   └── favicon.svg               Nave del jugador en SVG
│
├── src/
│   ├── main.js                   Punto de entrada; orden de los CSS
│   ├── App.vue                   Composición y cableado de la máquina de estados
│   │
│   ├── assets/
│   │   ├── icons/techIcons.js    Trazados SVG (Simple Icons, CC0) del inventario de stack
│   │   └── styles/
│   │       ├── tokens.css        ÚNICO sitio con valores de color/tipo/espaciado
│   │       ├── base.css          Reset, tipografía global, utilidades, a11y
│   │       └── crt.css           Capa de vidrio: scanlines, viñeta, barrido
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── HudBar.vue        Marcador fijo superior (elemento firma). Siempre en español, ver §11.
│   │   │   ├── CrtOverlay.vue    Overlay del monitor, sin eventos
│   │   │   ├── StageSection.vue  Envoltorio de sección numerada
│   │   │   ├── StageNav.vue      Selector de sección pegajoso (anclas, no pestañas)
│   │   │   └── LanguageToggle.vue Botón ES/EN, sólo visible con el CV a la vista
│   │   ├── cv/
│   │   │   ├── HeroCard.vue      Portada + avatar-botón que dispara el juego
│   │   │   ├── StackInventory.vue Stack principal: 4 columnas con icono+barra+nota (única vista de stack)
│   │   │   ├── ProjectGallery.vue Galería de proyectos con portada y filtro
│   │   │   ├── TimelineList.vue  Experiencia como línea temporal
│   │   │   ├── AboutPanel.vue    Bio, formación, principios y hobbies
│   │   │   └── ContactRow.vue    Contacto como tabla de datos
│   │   └── game/
│   │       ├── GameCanvas.vue    Puente Vue ↔ motor (deliberadamente delgado)
│   │       ├── TouchControls.vue Joystick + disparo táctiles; sólo emite {x,y}/booleano
│   │       ├── ScoreEntry.vue    3 iniciales estilo recreativa (spinbuttons, sin texto libre)
│   │       └── Leaderboard.vue   Top 20 del ranking, resalta la entrada recién enviada
│   │
│   ├── composables/
│   │   ├── usePhase.js           Máquina de estados idle→glitch→game→over
│   │   ├── useGlitch.js          Adaptador Vue sobre GlitchEffect
│   │   ├── useLeaderboard.js     Ranking: API con degradación a localStorage
│   │   ├── useReadProgress.js    Progreso de scroll → marcador del HUD
│   │   └── useLocale.js          Idioma del CV + profile.js ya traducido (ver §11)
│   │
│   ├── data/
│   │   └── profile.js            TODO el contenido del CV, en español. Editar aquí.
│   │
│   ├── i18n/
│   │   └── translations.js       Textos de interfaz y traducción de profile.js a inglés (ver §11)
│   │
│   ├── lib/
│   │   ├── GlitchEffect.js       Algoritmo de corrupción de texto (JS puro)
│   │   ├── GlitchEffect.test.js  Vitest: centrado, barrido direccional, isSettled
│   │   └── storage.js            localStorage a prueba de excepciones
│   │
│   └── game/
│       ├── core/
│       │   ├── Engine.js         Bucle, ciclo de vida, resize, DPR
│       │   ├── AssetLoader.js    Carga de imágenes por promesa
│       │   └── InputHandler.js   Teclado + táctil tras la misma API (ejes, fire), captura condicional
│       ├── entities/
│       │   ├── Entity.js         Base: bounds, kill, reset (para pooling)
│       │   ├── Player.js         Nave con inercia y entrada cinemática
│       │   ├── Projectile.js     Un solo tipo; `faction` decide dirección/sprite/colisión
│       │   ├── Enemy.js          Patrón de vuelo inyectado como función (ver PATHS)
│       │   ├── Explosion.js      Animación de 3 fotogramas, se auto-destruye
│       │   └── Boss.js           Vida múltiple, 3 fases según BOSS.phaseHpRatios
│       ├── render/
│       │   └── Starfield.js      Fondo de estrellas, 3 capas de paralaje
│       ├── systems/
│       │   ├── Pool.js             Pool genérico: recicla con Entity.reset(), cero GC en ráfaga
│       │   ├── CollisionSystem.js  AABB puro, sin dependencias de Entity
│       │   └── WaveManager.js      Lee waves.js, instancia formaciones, avisa al limpiar ola
│       └── config/
│           ├── spriteMap.js      Coordenadas del atlas
│           ├── balance.js        Todas las constantes de juego
│           └── waves.js          El nivel como datos: 4 oleadas coreografiadas
│
├── index.html                    Meta, OG, JSON-LD, preload del atlas
├── vercel.json                   Runtime, cabeceras de seguridad y caché
├── vite.config.js                Alias @, chunk separado para el juego
├── .env.example                  Plantilla de variables de entorno
├── PROJECT.md                    Este fichero
└── README.md                     Cara al visitante y a quien clone el repo
```

**Regla de dependencias:** `game/` no importa nada de Vue. `components/`
no contiene lógica de juego. `data/` no contiene lógica en absoluto.
Si un import cruza esas fronteras, algo está mal colocado.

---

## 4. Módulos y API interna

### `usePhase.js`
Estado compartido a nivel de módulo (una instancia para toda la app).

```js
const { phase, countdown, isIdle, showsCv, startSequence, abort, endRun, reset, restart } = usePhase()
```

| Fase | Qué pasa |
|---|---|
| `idle` | CV navegable, estrellas lentas al fondo |
| `glitch` | Texto corrompido, cuenta atrás, scroll bloqueado |
| `game` | Partida a pantalla completa, teclado capturado |
| `over` | Entrada de iniciales y ranking |

Transiciones legales declaradas en `TRANSITIONS`. Una transición
inválida se rechaza y avisa por consola en vez de dejar estado corrupto.
`OVER → GAME` es el atajo de "jugar de nuevo" (tecla R o botón): a
diferencia de `IDLE → GLITCH`, no repite la cinemática de corrupción.

### `Engine.js`
```js
const engine = new Engine(canvas, { onGameOver })
await engine.start()      // carga assets y arranca el rAF
engine.setPhase('game')   // Vue le comunica la fase
engine.stop()             // cancela rAF y limpia listeners
```
`update(delta)` → `draw()` en cada fotograma. `delta` acotado a 50 ms.

### `GlitchEffect.js`
```js
const fx = new GlitchEffect(desde, hasta, { scrambleWindow, settleStart, settleSpread })
fx.frameAt(msTranscurridos)  // → string
fx.isSettled(ms)             // → boolean, permite parar el timer
```
Cada carácter tiene su propia línea temporal; `resolveAt` escalonado de
izquierda a derecha produce el barrido direccional.

### `InputHandler.js`
`input.axisX` / `input.axisY` devuelven −1..1 (teclado siempre −1/0/1;
táctil, continuo). `input.fire` es booleano. `setCapturing(bool)`
decide si se hace `preventDefault`: **sólo durante la partida**, para no
romper el scroll por teclado en el CV.

El táctil entra por la misma puerta: `input.setTouchAxis(x, y)` y
`input.setTouchFiring(bool)` sólo escriben estado; los getters deciden
qué fuente ganó (el teclado tiene prioridad si hay algo pulsado). Quien
llama a esos setters es `TouchControls.vue`, nunca `Player` ni `Engine`
— ninguno de los dos sabe que el táctil existe.

---

## 5. Backend — ranking global

### Contrato

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/api/scores` | `{ entries: [{ initials, score, wave, at }] }` |
| `POST` | `/api/scores/start` | `{ runId, issuedAt, ttl }` |
| `POST` | `/api/scores` | `201 { ok, rank }` · `401/409/422/429 { error }` |

### Modelo de datos

Un único sorted set en Redis:

```
ZADD lb:scores <puntos> '{"initials":"WLM","wave":7,"at":1738,"nonce":"a1b2"}'
ZREVRANGE lb:scores 0 19 WITHSCORES
```

El `nonce` hace único cada miembro: sin él, dos jugadores con las mismas
iniciales y puntuación colisionarían y se perdería una entrada.

### Anti-trampas — qué cubre y qué no

En un juego que corre en el navegador del visitante, la puntuación **no
se puede verificar de verdad**. Quien quiera falsearla, podrá. El
objetivo es que no baste con abrir la consola:

1. **Partida firmada.** Hay que pedir un `runId` (HMAC-SHA256) antes de jugar.
2. **Un solo uso.** Al enviar se hace `DEL` sobre la clave del `runId`;
   si devuelve 0, ya se usó o caducó (TTL 30 min).
3. **Plausibilidad.** Se rechaza si puntos/segundo > 900, si la partida
   dura menos de 5 s, o si supera el techo teórico de 250.000.
4. **Límite por IP.** 10 envíos y 30 partidas abiertas por hora.

### Degradación
Si Upstash no está configurado, `/api/scores` responde **503** y el
frontend cae a `localStorage`, marcando el estado como `offline`. El
sitio nunca depende de la red para funcionar.

### Coste
Plan gratuito de Upstash: 10.000 comandos/día. Cada partida completa
consume ~6. Da margen de sobra para un portfolio.

---

## 6. Dominio y despliegue

### Registrar el dominio

| TLD | Precio orientativo/año | Registrador sugerido | Nota |
|---|---|---|---|
| `.com` | 10–13 € | Cloudflare Registrar | Vende a precio de coste, sin margen ni renovación inflada. |
| `.dev` | 12–15 € | Cloudflare Registrar | HTTPS obligatorio por HSTS preload. Señal fuerte para un perfil técnico. |
| `.gg` | 60–100 € | Porkbun / Namecheap | Cloudflare no lo vende. Caro, pero encaja con la temática. |

> Verifica los precios en el momento de comprar: cambian.

**Recomendación:** `.dev` si el sitio es sobre todo profesional; `.gg`
sólo si el ángulo gaming es el argumento principal y el coste no importa.

### Conectar con Vercel

1. Subir el repo a GitHub → Vercel → *Import Project*.
2. Vercel detecta Vite; confirmar `Build: npm run build`, `Output: dist`.
3. Variables de entorno (*Settings → Environment Variables*), las tres de
   `.env.example`, en Production y Preview.
4. *Settings → Domains* → añadir el dominio.
5. Vercel muestra **los registros DNS exactos** a crear (un `A` para el
   ápex y un `CNAME` para `www`). **Usa los que muestre el panel**, no
   valores copiados de un tutorial: Vercel los ha cambiado con el tiempo.
6. Crear esos registros en Cloudflare/Porkbun. En Cloudflare, poner el
   registro en **DNS only** (nube gris) mientras se valida.
7. Esperar la emisión del certificado (minutos) y marcar el dominio como
   *Primary* para que el `.vercel.app` redirija.

### Comprobación previa al lanzamiento

- [ ] Sustituir `TU-DOMINIO.com` en `index.html` (canonical, OG, JSON-LD)
- [ ] Poner `PUBLIC_ORIGIN` con el dominio final
- [x] Generar `public/og.png` (1200×630) — hecho, pero lleva el
      placeholder "arcade-cv.dev" en la esquina (mismo problema que
      `TU-DOMINIO.com`): hay que regenerarlo o al menos editar ese
      texto cuando se decida el dominio real.
- [ ] Colocar `public/cv-william-salazar.pdf`
- [ ] Rellenar empresas reales en `src/data/profile.js`
- [ ] Rellenar usuarios reales de GitHub y LinkedIn

---

## 7. Diseño — dirección "CRT Terminal / Arcade oscuro"

Referencia estructural: **webreactiva.com** (secciones numeradas, bloques
densos de información, acentos vivos sobre fondo sobrio). Lo que se toma
es la *estructura*; el lenguaje visual es propio.

### Paleta — cuatro fósforos con trabajo asignado

| Token | Hex | Uso |
|---|---|---|
| `--c-void` | `#04060a` | Fondo. Negro con sesgo azul: es vidrio de tubo, no negro puro. |
| `--c-panel` | `#0b1118` | Superficies elevadas |
| `--c-phosphor` | `#38edac` | Identidad. Nombre, marcador 1UP, barras. |
| `--c-amber` | `#ffc24b` | Datos y numeración de stages |
| `--c-magenta` | `#ff3d71` | Peligro, glitch, récord |
| `--c-cyan` | `#52d9ff` | Elementos navegables |

Usar más de un fósforo es lo que separa esto de "fondo negro con un
acento verde", que es el aspecto por defecto de cualquier tema oscuro.

### Tipografía — tres roles

| Rol | Familia | Dónde |
|---|---|---|
| Display | **Silkscreen** | Titulares, HUD, etiquetas. Bitmap real, con moderación. |
| Cuerpo | **JetBrains Mono** | Todo el texto del CV. Legible a 15 px, que es lo que importa. |
| Numérico | **VT323** | Cifras grandes del HUD y cuenta atrás, donde el sangrado CRT es la gracia. |

Se descartó VT323 para el cuerpo: un reclutador tiene que poder leer el
CV sin esfuerzo, y VT323 a tamaño pequeño no lo permite.

### Elemento firma — el HUD

Marcador de máquina recreativa fijo arriba. **SCORE es el porcentaje del
CV que has leído convertido a puntos; HI-SCORE es el récord real del
ranking.** No es decoración: el HUD dice la verdad sobre dos cosas
distintas —tu avance leyendo y el récord jugando— con el mismo lenguaje
visual. Al entrar en partida cambia de contenido a oleada y vidas.

### Otras decisiones

- **Stack como barras de EXP** con nota de uso real. Una lista de logos
  no dice nada; una barra con contexto sí.
- **Stages numerados** porque el orden importa de verdad: stack →
  experiencia → proyectos → contacto es la secuencia en la que un
  reclutador decide. La numeración codifica esa secuencia.
- **Radio 0 en todo.** Un píxel no tiene esquinas redondeadas.
- **Sombras duras desplazadas**, nunca blur: los objetos parecen físicos.
- **Capa CRT** con `pointer-events: none` y `mix-blend-mode: soft-light`.
  Baja intensidad durante la partida para no ensuciar los sprites.

### Accesibilidad — suelo de calidad

- El avatar es un `<button>` real: funciona con teclado y lo anuncian los
  lectores de pantalla.
- `preventDefault` sobre las flechas **sólo durante la partida**.
- Enlace *saltar al contenido*, foco visible en ámbar, `prefers-reduced-motion`
  apaga el barrido CRT y el parpadeo.
- Las barras de nivel exponen `role="meter"` con valores.

---

## 8. Estado actual

### Hecho

- [x] **Fase 0** — Vite, atlas 128×128, `spriteMap.js` mapeado
- [x] **Fase 1** — Máquina de estados extraída a composable con transiciones validadas
- [x] **Fase 2** — `GlitchEffect` como clase pura + adaptador Vue; cuenta atrás; starfield persistente
- [x] **Fase 3 (parcial)** — `Engine` con rAF, deltaTime acotado, DPR y resize; `InputHandler` con ejes; `Player` con inercia y entrada cinemática
- [x] **Fase 3 — disparo y proyectiles** — `Projectile` (un solo tipo,
      `faction`), `Pool` genérico sin asignación en caliente, disparo del
      jugador con cooldown, `CollisionSystem` (AABB puro) listo para Fase 4
- [x] **Fase 3 — controles táctiles** — `InputHandler` gana
      `setTouchAxis`/`setTouchFiring`; sus getters (`axisX`, `axisY`,
      `fire`) fusionan teclado y táctil sin que `Player` ni `Engine`
      sepan de cuál viene el valor. `TouchControls.vue` nuevo: joystick
      analógico en la mitad izquierda de la pantalla (aparece donde se
      toca, no ocupa nada hasta entonces) y disparo automático en la
      derecha mientras se mantiene el dedo. Detecta soporte con
      `matchMedia('(pointer: coarse)')`, no por ancho — una tablet
      ancha con pantalla táctil lo tiene; un portátil estrecho sin
      pantalla táctil, no.
- [x] **Fase 4 — diseño de niveles** — `Enemy` con patrones de vuelo
      inyectados como función; `Explosion` de 3 fotogramas autodestructiva;
      `waves.js` como datos puros (4 oleadas); `WaveManager` que las lee,
      instancia formaciones y avisa al limpiar cada ola; `Boss` con 3 fases
      por vida restante. Simulado en Node sin UI: las 4 oleadas limpian en
      orden, el jefe atraviesa sus 3 fases correctamente.
- [x] **Fase 4 — cableado en el motor** — `Engine` instancia
      `WaveManager` y crea el `Boss` en `onLevelClear`; resuelve
      proyectil-jugador↔enemigo/jefe (puntúa y explota), nave↔enemigo/
      proyectil-enemigo/jefe (vidas, `PLAYER.invulnMs`, parpadeo);
      enemigos y jefe disparan con `ENEMY.fireChancePerSecond` /
      `BOSS.fireChancePerSecond` (nueva); pool de `Explosion`; llama a
      `Engine.completeRun(victory)` tanto al perder la última vida
      (`victory: false`) como al matar al jefe (`victory: true`), que
      es el único punto que dispara `hooks.onGameOver` — antes matar
      al jefe no terminaba la partida, se quedaba volando en un nivel
      vacío para siempre. Verificado jugando de verdad (ver Registro
      de cambios): las 4 oleadas se limpian disparando, el jefe
      aparece, atraviesa sus 3 fases, muere otorgando puntos y *cierra
      la partida* con la pantalla "Mission Complete" (fósforo) frente
      a "Game Over" (magenta) al morir.
- [x] **Rediseño completo** — sistema de tokens, 8 componentes nuevos, capa CRT
- [x] **Arquitectura** — carpetas por responsabilidad, alias `@`, contenido en `data/`
- [x] **Backend** — API de ranking con firma HMAC, rate limit y degradación
- [x] **Configuración de despliegue** — `vercel.json`, `.env.example`, SEO y OG
- [x] **Contenido** — stack con Laravel al frente, galería de proyectos con
      filtro, sección personal, navegación por secciones
- [x] **Fase 5 (parcial) — cierre del bucle de juego** — transición
      `game → over → idle` cableada en `usePhase.js` (más el atajo
      `over → game` para reiniciar); `ScoreEntry.vue` y
      `Leaderboard.vue`; tecla R (y botón) reinician sin recargar;
      `HeroCard`/CV ocultos fuera de `showsCv` para que la partida sea
      de verdad pantalla completa; HUD con puntuación/oleada/vidas
      reales en partida (`hooks.onStatsChange`, ver Fase 4). Falta
      provisionar Upstash y desplegar — ver Pendiente.

### Errores corregidos en el código previo

1. `atlas.onload` se asignaba **después** de `src`: con la imagen en
   caché el bucle podía no arrancar nunca. → `AssetLoader` con promesa
   que comprueba `complete` primero.
2. `preventDefault` sobre flechas y espacio **siempre**, lo que impedía
   hacer scroll por el CV con el teclado. → captura condicional.
3. Sin `resize`: el canvas se dimensionaba una vez al montar y quedaba
   deformado al girar el móvil. → `onResize` propagado a las entidades.
4. `document.body.style.overflow = 'hidden'` nunca se revertía. → clase
   `.is-locked` gestionada por la máquina de estados.
5. Sin límite en `deltaTime`: al volver de otra pestaña, el primer delta
   valía segundos y teletransportaba la nave fuera de pantalla. → tope de 50 ms.
6. Listeners de teclado sin `destroy()`. → limpieza en `Engine.stop()`.
7. Sin `devicePixelRatio`: los sprites se veían borrosos en pantallas HiDPI.

### Pendiente

**Diseño de oleadas — bug encontrado probando el táctil, no corregido**
- [ ] La formación `line5` (y otras) calcula `dx` por nave, pero los
      patrones de vuelo `sweepLeftToRight`/`sweepRightToLeft` ignoran
      `enemy.originX` — sólo usan `enemy.originY`. Resultado: las 5
      naves de una `line5` vuelan exactamente superpuestas, no en
      fila. Se detectó instrumentando `Enemy` durante las pruebas de
      esta sesión; no se ha tocado porque no era lo pedido (control
      táctil) y cambiar el cálculo de posición de los patrones afecta
      a las 4 oleadas a la vez — mejor una sesión dedicada a
      verificarlas todas de nuevo.

**Fase 5 — cierre**
- [ ] Provisionar Upstash y desplegar

**Contenido real (lo hace William, no la IA)**
- [x] Empresas y fechas reales en `experience` — las 4 entradas del CV
      (LinkTic ×2, NerdCom, Shokworks), ver Registro de cambios (2026-07-31)
- [x] LinkedIn real en `contact` (`in/salazar-william`)
- [ ] GitHub real en `contact` — no aparece en el CV, sigue siendo
      placeholder (`tu-usuario`)
- [ ] Dos proyectos reales sustituyendo las plantillas
- [ ] Capturas en `public/img/projects/`
- [ ] Tercer hobby real (`about.hobbies[2]` sigue diciendo "Cambia esto")

**Pedido de William del 2026-07-31, completo en 3 fases**
- [x] Contenido real desde el CV (Fase 1)
- [x] Rediseño de "Stack principal" (Fase 2 y 2b)
- [x] Sistema de idiomas ES/EN, alcance sólo CV (Fase 3) — ver §10

**Calidad**
- [x] Tests de `GlitchEffect` y del guard de la API (Vitest) — 32/32 en verde
- [ ] Auditoría Lighthouse — hecha, objetivo ≥ 95 NO alcanzado en las
      cuatro (perf 90, a11y 96, best practices 96, seo 92). Hallazgos
      reportados a William, decisión de qué corregir pendiente de él
      — ver Registro de cambios (2026-07-31) para el detalle completo.
- [ ] Imágenes sin CLS — auditado: las 2 únicas `<img>` del sitio ya
      tenían `width`/`height` explícitos. Nada que corregir.
- [ ] Recorrido completo con teclado — auditado (ver Registro de
      cambios): funciona de punta a punta. Un rough edge encontrado y
      sin corregir: "Volver al CV" deja el foco en `<body>` en vez de
      un punto útil.
- [x] `public/og.png` — generado (falta domino real, ver §6)
- [ ] `public/cv-william-salazar.pdf`

---

## 9. Estructura de contenido del CV

Orden de secciones. **No es el orden en que se escribieron: es el
orden en que un reclutador decide.**

| # | Sección | Pregunta que responde |
|---|---|---|
| — | Portada + Stack principal | ¿Quién es y con qué trabaja? (sobre el pliegue) |
| 01 | Proyectos | ¿Sabe hacerlo de verdad? |
| 02 | Experiencia | ¿Dónde lo ha hecho? |
| 03 | Sobre mí | ¿Quiero trabajar con esta persona? |
| 04 | Contacto | ¿Cómo le escribo? |

**Proyectos va antes que experiencia a propósito:** la prueba pesa más
que el historial, sobre todo en perfiles que no tienen 15 años de
recorrido.

**El stack ya no tiene una segunda vista más abajo.** Hasta el
2026-07-31 existía `StackGrid.vue` como sección "01 Stack" con barras
de EXP, duplicando lo que ya mostraba "Stack principal" sobre el
pliegue. Se eliminó (junto con `toolbelt`) porque una sola vista bien
hecha vale más que dos que dicen lo mismo con distinto formato.

### Por qué no hay pestañas

Se valoró y se descartó. Unas pestañas esconden contenido del `Ctrl+F`,
del indexado de Google y del recorrido de un lector de pantalla, y
obligan a un clic antes de ver nada. En su lugar:

- **`StageNav`** — anclas pegajosas bajo el HUD con la sección activa
  resaltada vía `IntersectionObserver`. Da la navegabilidad de las
  pestañas sin ocultar nada.
- **Filtro en la galería** — parte del estado "todo visible" y sólo
  reduce si el visitante lo pide.

### Añadir un proyecto

Editar `src/data/profile.js` → array `projects`:

```js
{
  id: 'slug-unico',
  name: 'Nombre',
  year: '2025',
  summary: 'Una frase legible por alguien de negocio.',
  problem: 'Qué dolía antes. Concreto: un número o una situación.',
  detail:  'Cómo lo resolviste. Aquí sí puedes ser técnico.',
  stack: ['Laravel', 'PostgreSQL', 'Vue.js'],
  cover: '/img/projects/slug-unico.webp',  // o null
  links: [{ label: 'Ver código', href: '…' }],
  featured: false,   // el destacado ocupa la fila entera
}
```

Las portadas van en `public/img/projects/` (16:10, 1200×750, `.webp`,
< 150 kB — ver el README de esa carpeta). Si `cover` es `null` se dibuja
un marcador pixel-art derivado del id, así que la rejilla nunca tiene
huecos y puedes publicar antes de tener las capturas.

---

## 10. Idioma del CV (ES/EN)

### Alcance: sólo el CV

Identidad, stack, proyectos, experiencia, sobre mí, contacto y
navegación. **El juego se queda en español siempre** — HUD, cuenta
atrás, pantalla de resultados, iniciales, ranking. `HudBar.vue`,
`GameCanvas.vue` y todo `components/game/` no importan nada de
`useLocale.js` ni de `i18n/`, a propósito: si algún día hace falta
traducir el juego, es una decisión nueva, no una consecuencia de que
"ya había un sistema de idiomas".

### Cómo está montado

```
src/data/profile.js          Contenido del CV, en español. Fuente única.
src/i18n/translations.js     ui (texto de interfaz) + content (traducción
                              de los campos de profile.js que son prosa)
src/composables/useLocale.js Fusiona profile.js + content[locale] y
                              expone t() para el texto de interfaz
```

`profile.js` sigue siendo la única fuente de datos — `translations.js`
nunca lo sustituye, sólo aporta la versión en inglés de los campos que
son prosa (biografía, notas del stack, el impacto de cada puesto...).
Lo que **no** se traduce (nombres de empresas, tecnologías, años,
enlaces, `contact`) sale de `profile.js` igual en los dos idiomas: son
nombres propios o datos, no texto.

La fusión en `useLocale.js` es por `id`/`label` estable, nunca por
posición en el array — así reordenar `profile.js` no desincroniza una
traducción a medio hacer.

```js
const { locale, toggleLocale, t, identity, stackColumns, experience,
        projects, about, contact, glitchScript } = useLocale()

t('hero.insertCoin')        // → texto de interfaz en el idioma activo
t('projects.empty', tech)   // → si la clave es una función, se invoca con los argumentos
identity.value.tagline      // → ya viene en el idioma activo (es un computed)
```

Cada componente de `components/cv/` que tiene texto propio en la
plantilla (no proveniente de `profile.js`) llama a `useLocale()`
directamente para su `t()` — no hay prop-drilling de traducciones
desde `App.vue`. `App.vue` sí centraliza los datos localizados
(`identity`, `stackColumns`...) porque ya los pasaba como props antes
de que existiera i18n; ese reparto no cambió.

### Persistencia y accesibilidad

El idioma se guarda en `localStorage` (`STORAGE_KEYS.LOCALE`) y
`document.documentElement.lang` se actualiza en cada cambio, para que
un lector de pantalla pronuncie el contenido en el idioma correcto.

### Añadir una tercera categoría de contenido traducible

Si `profile.js` gana un campo de prosa nuevo que haga falta traducir:
1. Añade la traducción en `content.en` de `translations.js`, indexada
   igual que el dato original (por `id`, nunca por posición).
2. Añade la fusión correspondiente en `useLocale.js` (un `computed`
   más, siguiendo el patrón de `localizedExperience` o
   `localizedProjects`).
3. `content.es` se queda vacío para ese campo — `profile.js` ya está
   en español, no hace falta duplicar el dato.

---

## 11. Registro de cambios

> Una línea por sesión. Qué cambió y por qué, no cómo.

### 2026-07-31 (7) — CV bilingüe ES/EN (Fase 3 de 3, cierra el pedido)
- **`src/i18n/translations.js`** nuevo: `ui` (texto de interfaz que
  vivía escrito a mano en las plantillas — etiquetas, pistas de
  sección, estados vacíos) y `content` (traducción al inglés de los
  campos de `profile.js` que son prosa, indexada por `id`/`label`
  estable, nunca por posición).
- **`src/composables/useLocale.js`** nuevo: estado de módulo (mismo
  patrón que `usePhase.js`), persistido en `localStorage`. Expone
  `t(path, ...args)` para texto de interfaz (invoca la función si la
  clave la devuelve, para los textos con variables) y
  `identity/stackColumns/experience/projects/about/glitchScript` ya
  fusionados con la traducción activa. `contact` se reexporta tal
  cual: son nombres propios y enlaces, no hay nada que traducir.
  Actualiza `document.documentElement.lang` en cada cambio.
- **`LanguageToggle.vue`** nuevo: el texto del botón es el idioma AL
  QUE cambia ("English" estando en español), no el actual — es una
  instrucción, no una etiqueta de estado que haya que interpretar.
  Sólo visible con `showsCv && !isGlitch`, igual que el resto del CV;
  desaparece en cuanto empieza la partida.
- **Alcance respetado tal como se decidió antes de empezar:** el juego
  no sabe que esto existe. `HudBar.vue` y `components/game/` no
  importan nada de `useLocale.js`. Verificado en el navegador con
  `locale = 'en'` activo: el HUD sigue mostrando "Leído" en español.
- Cada componente de `components/cv/` con texto propio en la
  plantilla (`HeroCard`, `ProjectGallery`, `AboutPanel`, `ContactRow`,
  `StageNav`, `StackInventory`) llama a `useLocale()` directamente
  para su `t()` — no hay traducciones pasadas por props desde
  `App.vue`.
- **Bug encontrado verificando en el navegador, corregido antes de
  cerrar:** el campo `to: 'Actualidad'` del puesto vigente en
  `experience` no tenía traducción — en inglés se veía "Actualidad"
  suelto en medio de fechas en inglés. Añadido `to: 'Present'` al
  override de esa entrada en `translations.js`.
- Verificado a fondo en el navegador: cambio de idioma con las 4
  secciones completas (Proyectos, Experiencia, Sobre mí, Contacto),
  el stack con sus notas traducidas, recarga de página con el idioma
  persistido, vuelta a español sin residuos, y el juego arrancado con
  `locale = 'en'` sin que el HUD cambiara una letra. Build limpio,
  32/32 tests en verde (sin tests nuevos: no se pidieron para esta
  fase, siguiendo el alcance acordado en la sesión de tests).

### 2026-07-31 (6) — Vuelta atrás sobre la mascota: William la vio y no funcionó
Feedback directo tras ver el resultado de (5): "el NPC se ve horrible".
Se quita sin discusión — es su criterio visual, no un error técnico.
- Mascota (`BOT_PIXELS`, tablet, brazos, popup de hover) eliminada por
  completo de `StackInventory.vue`. Las fichas (icono + barra + nota)
  se quedan igual — es la parte que sí funcionaba.
- La pestaña "Inventario" también fuera; las 4 columnas ahora ocupan
  todo el ancho de la ventana en vez de compartirlo con la mascota.
- `Miscellaneous` recortado de 10 a 4 tecnologías (Git, Docker, Azure,
  Jira) — fuera Scrum, VS Code, Figma, Postman, Linux, Vite. Sus
  iconos correspondientes se borraron de `techIcons.js` (sin dejar
  trazados sin usar).
- **La sección "01 Stack" de más abajo (`StackGrid.vue`, barras EXP)
  se elimina entera**: era la misma información que "Stack principal"
  ya cubre arriba, en un formato distinto — William señaló la
  redundancia directamente. `stack` y `toolbelt` salen de `profile.js`
  (ya no los usa nadie). `StageNav` pasa a 4 entradas
  (Proyectos/Experiencia/Sobre mí/Contacto) y las `StageSection`
  restantes se renumeraron 1-4. El enlace "Saltar al contenido" ahora
  apunta a `#stage-proyectos` (antes `#stage-stack`, que ya no existe).
- **Lección para la próxima vez que se proponga un personaje o
  ilustración nueva:** enseñar una captura pequeña o describir la
  idea antes de implementarla entera, en vez de construirla completa
  y descubrir después que no convence. Esta mascota costó dos rondas
  de ajuste de contraste/silueta y aun así no funcionó — el coste de
  media hora de implementación se podría haber evitado con una
  vista previa más barata.
- Build limpio, 32/32 tests en verde. `StackGrid.vue` y
  `StackStrip.vue` (de la Fase 2) quedan ambos borrados del repo.

### 2026-07-31 (5) — Inventario del stack: iconos reales, barras y hover (Fase 2b)
William trajo una imagen de referencia (un archivista alienígena con
tablet, fichas con icono+barra+nota) y pidió: (1) usarla para la
mascota y el aspecto de las fichas, (2) que al pasar el ratón por una
tecnología la mascota "presione un botón" y salga el icono de esa
tecnología junto a ella, (3) los títulos de columna ya eran los que se
pidieron (no había que tocarlos).

- **Aviso de estilo, no bloqueante:** la imagen de referencia es una
  ilustración pintada con esquinas redondeadas, sombras suaves y
  degradados — choca de frente con las reglas ya escritas en este
  documento ("radio 0 en todo", "sombras duras, nunca blur"). Se tomó
  la referencia para el *contenido* (archivista con tablet, fichas con
  icono real + barra + nota, el gesto de "pulsar botón") pero traducido
  al lenguaje plano y de bordes duros que ya usa el resto del sitio, no
  como una réplica literal del renderizado.
- **Iconos reales por tecnología**: `src/assets/icons/techIcons.js`
  nuevo, con los trazados `d` de 19 marcas (Simple Icons, CC0),
  descargados directamente del CDN — no inventados a mano, para no
  arriesgar un logo mal reproducido. Se pintan con la clase CSS del
  icono (`fill: currentColor` vía clase, nunca un hex de marca), así
  que el color sigue saliendo de `tokens.css`. `SQL` y `Scrum` no son
  marcas con logo — llevan un monograma de texto en su lugar.
- **`stackColumns` en `profile.js` ganó `level`, `note` e
  `icon`/`iconText` por tecnología** (antes sólo tenía `label`/`lead`).
  Los niveles y notas de las que ya estaban en `stack` (Laravel,
  JavaScript, SQL, PostgreSQL, Vue.js, Node.js) se reutilizaron tal
  cual; el resto son una autoevaluación razonable a partir del CV —
  William puede ajustar los números si no le representan.
- **Mascota rediseñada**: un archivista alienígena (cabeza grande,
  ojos almendrados en fósforo, tablet en un brazo) en vez del robot
  pequeño de la Fase 2 — pixel-art nuevo por bloques, sin imagen.
  Costó dos iteraciones visuales: la primera versión usaba tonos
  `panel`/`grid` para el cuerpo, casi indistinguibles entre sí y del
  fondo `void`, así que se leía como una mancha con puntos de color
  flotando en vez de una figura. Se corrigió pintando la silueta en
  `--c-ink` (claro, con contraste real contra el fondo) y dejando los
  tonos oscuros sólo para el cuello (separación) y los detalles.
  También se corrigió un "codo" del brazo libre que quedaba como un
  hueco en la silueta por no compartir una celda con la pieza anterior
  — cada segmento de un miembro debe solaparse con el siguiente o el
  hueco se lee como un mordisco, no como una articulación.
- **Interacción de hover**: cada ficha de tecnología es enfocable
  (`tabindex="0"`, funciona igual con ratón que con teclado). Al
  entrar el puntero o el foco, la mascota cambia el brazo libre a una
  pose de "pulsando" y aparece un icono flotante junto a la tablet con
  el mismo glifo de la tecnología señalada — mismo gesto siempre, sólo
  cambia qué icono sale. Transición desactivada bajo
  `prefers-reduced-motion`.
- Verificado en el navegador: iconos correctos por tecnología, barras
  con el nivel de cada una, hover mostrando el icono flotante y el
  cambio de pose del brazo. Build limpio, 32/32 tests en verde.

### 2026-07-31 (4) — Stack principal rediseñado (Fase 2 de 3)
- `StackStrip.vue` eliminado; `StackInventory.vue` nuevo lo sustituye
  en el mismo punto (justo bajo la portada, sobre el pliegue).
- `profile.js`: `primaryStack` (tira plana con `kind`) reemplazado por
  `stackColumns`, un array de 4 categorías (`back`, `front`, `database`,
  `misc`) cada una con su lista de tecnologías. De paso resuelve el
  hallazgo anotado en la Fase 1: antes 4 tecnologías distintas
  llevaban `lead: true` a la vez (Laravel, PostgreSQL, Scrum, Vue.js),
  vaciando de sentido el destacado; ahora `lead` es como mucho una
  por columna — el arma equipada de esa categoría, no una etiqueta
  reciclada.
- Categorización: Back Stack (Laravel, PHP, Node.js, Livewire) · Front
  Stack (Vue.js, JavaScript, HTML, CSS) · Database (PostgreSQL, SQL,
  Redis) · Miscellaneous (Git, Docker, Azure, Jira, Scrum, VS Code,
  Figma, Postman, Linux, Vite). `stack` (las barras de EXP de la
  sección 01) y `toolbelt` no se tocaron: siguen siendo la vista
  detallada, esto es sólo el resumen de sobre el pliegue.
- Mascota nueva en pixel-art: un robot compañero de 10×13 dibujado
  como bloques de color (`<rect>` con clases que mapean a los tokens
  existentes — cero hex nuevo), no una imagen. Deliberadamente
  distinto de la nave del jugador y de los aliens del atlas — es un
  personaje nuevo, no un asset reciclado del juego (así lo pidió
  William al elegir entre las opciones).
- Todo el conjunto —mascota + columnas— se enmarca como una ventana
  de diálogo retro (pestaña de título "Inventario" + cuerpo), no como
  una tarjeta suelta: es la idea de "personaje con su ficha de stats
  abierta" que se pidió, no una lista con un dibujo al lado.
- Referencia estructural: se repasó webreactiva.com (bloques
  numerados, tarjetas densas de información, arquitectura por
  tarjetas) — se confirma que ya es la referencia que sigue el resto
  del sitio (ver §7). No se tomó ningún color ni valor de diseño de
  ahí; todo sale de `tokens.css` existente.
- Responsive: 1 columna en móvil, 2 a partir de 40rem, mascota +
  4 columnas en fila a partir de 60rem. Verificado en el navegador de
  escritorio; el chequeo específico en viewport móvil no se pudo
  hacer con las herramientas de esta sesión (ver nota más abajo) —
  las media queries replican el mismo patrón ya probado en
  `StackGrid.vue`/`ProjectGallery.vue`.
- Build limpio, 32/32 tests en verde.

### 2026-07-31 (3) — Contenido real desde el CV (Fase 1 de 3)
William pidió usar su CV real para completar experiencia y formación,
más un rediseño del stack (4 columnas + mascota) y un sistema ES/EN.
Por tamaño, se dividió en 3 fases; esta sesión cerró la Fase 1.

- **`experience` reescrito con las 4 entradas reales del CV**, más
  reciente primero: Analista QA Semisenior y Tester Junior en LinkTic,
  Desarrollador Fullstack en NerdCom SRL, Backend Developer Trainee en
  Shokworks, Inc. Cada `impact` sintetiza en una frase de resultado los
  bullets sueltos del CV (el sitio no lista tareas, lista resultados —
  ver la regla ya documentada en la sección de proyectos).
- **Punto importante, resuelto con William antes de escribir nada:**
  el CV original marca el rol de trainee en **Shokworks**, no en
  NerdCom, y NerdCom Fullstack dura 3 meses (06/2024–09/2024), no un
  año. El primer pedido fue reatribuir ese trainee a NerdCom y
  extenderlo a 1 año — eso habría cambiado de qué empresa fue un
  trabajo real, así que se preguntó antes de tocar el dato. Confirmado:
  **se deja tal cual el CV**, sólo se ampliaron las tareas de cada rol
  por separado.
- **Formación** nueva en `about.education` (objeto único: `degree`,
  `institution`, `year`) — el CV traía un dato que el sitio no
  mostraba en ningún lado. Render nuevo en `AboutPanel.vue`: tarjeta
  con acento ámbar entre la bio y los principios (el ámbar la separa
  visualmente del acento fósforo de los principios, que va justo
  debajo).
- **`contact.linkedin`** actualizado al usuario real (`salazar-william`)
  — venía en el propio CV, así que no hacía falta preguntar. GitHub
  sigue siendo placeholder: no aparece en el CV.
- Verificado: build limpio, 32/32 tests en verde, y revisión visual de
  Experiencia y Sobre mí en el navegador.
- **De paso, hallazgo sin tocar:** `primaryStack` tiene hoy 4 fichas
  marcadas `lead: true` (Laravel, PostgreSQL, Scrum, Vue.js), cuando el
  diseño original de `StackStrip.vue` asume una sola ficha destacada
  ("no todas las tecnologías pesan lo mismo"). No se corrigió porque la
  Fase 2 sustituye ese componente entero — se resuelve solo al
  rediseñar, no antes.

### 2026-07-31 (2) — Última pasada antes de desplegar
Cinco encargos concretos; el diseño no se tocó en ninguno.

**1. Tests (Vitest)** — `npm test`, 32/32 en verde.
- `GlitchEffect.test.js`: centrado con margen, fotograma en t=0 sin
  ruido, ancho de fotograma constante, resultado final centrado, y el
  barrido direccional en sí (las posiciones de la izquierda resuelven
  antes que las de la derecha — la razón de ser de la clase).
  `Math.random` mockeado donde hacía falta determinismo.
- `guard.test.js`: ida y vuelta de `issueRunId`/`verifyRunId`, firma
  manipulada, id manipulado, entradas mal formadas, y el caso sin
  `LEADERBOARD_SECRET` (con `vi.resetModules()` + query única para
  forzar una evaluación fresca del módulo, porque `SECRET` se lee una
  sola vez al cargar). `normalizeInitials` (incluida la sorpresa de
  que trunca en vez de rechazar si sobran letras). `validateSubmission`
  con los cuatro límites de `LIMITS` y el ritmo de puntos/segundo.
  `clientIp` y `applyCors`.

**2. Lighthouse móvil — reportado, NO corregido (pedido explícito)**
Build de producción + `vite preview`, Lighthouse CLI, mobile, sin
Upstash configurado (degrada a `offline`, esperado). Ninguna categoría
llegó a 95:

| Categoría | Puntuación |
|---|---|
| Rendimiento | 90 |
| Accesibilidad | 96 |
| Buenas prácticas | 96 |
| SEO | 92 |

Hallazgos, de mayor a menor impacto:
- **Fuentes de Google Fonts vía `@import` en `base.css`** es la causa
  raíz de casi todo lo de rendimiento: crea una cadena de peticiones
  HTML→CSS→CSS de Google→woff2 en vez de que el navegador las
  descubra desde el HTML. Estimado: ~830ms de ahorro posible
  (`render-blocking-insight`, `network-dependency-tree-insight`,
  `lcp-discovery-insight` señalan lo mismo).
- **`public/img/avatar.jpeg` pesa mucho más de lo necesario**: 960×965
  px reales para 176×176 (298×299 con densidad de píxel) en pantalla.
  ~99 KB de los ~109 KB del fichero son de sobra (`image-delivery-insight`).
- **LCP no es "discoverable" en el HTML inicial**: es una SPA sin SSR
  (decisión ya tomada y documentada en §2), así que el navegador no
  puede empezar a descargar el avatar hasta que Vue lo renderiza. Es
  coherente con la arquitectura elegida, no un descuido — mencionarlo
  porque es la explicación de por qué FCP/LCP rondan 2.7–3.0s pese a
  que TBT es 0ms y CLS 0.012 (ambos excelentes).
- **Contraste de `.u-label` dentro de `.hero__stats`**: axe mide 4.49:1
  sobre `--c-panel`, no 4.5:1. El comentario de `tokens.css` dice que
  `--c-ink-faint` está calibrado "justo por encima" del umbral AA —
  la medición real cae justo por *debajo*. Un solo token, probablemente
  un paso de luminosidad.
- **`robots.txt` inválido, 57 errores**: no existe el fichero; el
  servidor devuelve `index.html` para esa ruta y Lighthouse intenta
  parsear HTML como robots.txt. Falta `public/robots.txt`, sin más.
- **Un error de consola** (`errors-in-console`): el `502` de
  `/api/scores` en este entorno de prueba porque no hay backend bajo
  `vite preview`. En producción real pasará lo mismo *mientras Upstash
  no esté provisionado* (pendiente ya trackeado en Fase 5) — no es un
  hallazgo nuevo, es el mismo pendiente visto desde Lighthouse.
- `mainthread-work-breakdown` (0.5) y un `forced-reflow-insight` de
  ~193ms en el bundle principal: no identificado a qué línea
  corresponde exactamente (haría falta mapear con sourcemaps); candidato
  más probable es una lectura de layout (`getBoundingClientRect`) justo
  después de una escritura al DOM en `Engine.resize()` o `StageNav`.

Ninguno de estos se corrigió. Decisión de William pendiente sobre
cuáles abordar.

**3. Imágenes sin salto de layout — auditado, nada que corregir**
Sólo hay 2 `<img>` en todo el sitio (`HeroCard.vue` y
`ProjectGallery.vue`); ambas ya tenían `width`/`height` explícitos
desde que se escribieron. `base.css` ya usa `max-width: 100%` sin
romper el aspect-ratio porque los navegadores modernos lo calculan
solos a partir de esos atributos.

**4. Recorrido completo con teclado — auditado**
La pestaña del navegador de pruebas está oculta
(`document.hidden === true`) y Chrome no entrega Tab/Enter/Escape
nativos a pestañas ocultas — sólo los `keydown` disparados por JS
(`dispatchEvent`) llegan a los listeners de la app. Con eso:
- Auditoría estructural: las 22 zonas interactivas del CV son
  `<a href>`/`<button>` nativos en orden de DOM natural, sin
  `tabindex` que rompa el orden — el foco por Tab funcionará en
  cualquier navegador real sólo por ser HTML semántico correcto.
  Enlace de salto presente y con el mecanismo correcto (fuera de
  pantalla hasta `:focus`).
  `:where(a, button, [tabindex]):focus-visible` en `base.css` cubre
  todo el sitio con el mismo anillo ámbar.
- Lógica propia verificada disparando eventos reales: Escape aborta
  `glitch`→`idle`; al llegar a `over` el foco entra solo en la
  primera letra; flechas mueven entre las 3 letras; Enter en la
  última confirma y mueve el foco a "Jugar de nuevo".
- **Rough edge encontrado, sin corregir:** "Volver al CV" deja el
  foco en `<body>` (el botón se desmonta y el navegador no tiene
  dónde más ponerlo). No es una trampa de foco, pero obliga a
  tabular desde el principio otra vez.

**5. `public/og.png` (1200×630) — generado**
Página HTML aparte (fuera del repo) con los tokens reales del sitio
—Silkscreen, fósforo con glow, HUD arriba, avatar con el mismo borde
que `hero__avatar`, tiras de stack como `StackStrip`— servida en local
y capturada con Chrome a resolución exacta. Usa el mismo placeholder
de dominio que `index.html` ("arcade-cv.dev" en la esquina): falta
regenerarlo o editarlo cuando el dominio real esté decidido.

### 2026-07-31 — Controles táctiles
Sin esto el juego no existía en móvil, y la mitad de quien abre el
enlace lo hace desde el teléfono.
- `InputHandler.js`: `setTouchAxis(x, y)` / `setTouchFiring(bool)`
  nuevos, sólo escriben estado. Los getters `axisX`/`axisY`/`fire`
  fusionan teclado y táctil (el teclado gana si hay algo pulsado; si
  no, manda el táctil) — la única API que ven `Player` y `Engine` es
  la misma de siempre, ninguno de los dos cambió una línea.
- `TouchControls.vue` nuevo: joystick analógico en la mitad izquierda
  (aparece donde se toca — `position: fixed` anclado al punto de
  contacto, nada visible hasta entonces) y disparo automático en la
  mitad derecha mientras se mantiene el dedo, que es lo estándar en
  shooters táctiles. No importa `InputHandler` ni `Engine`: emite
  `move` ({x,y} normalizados a -1..1, con zona muerta de 8px) y `fire`
  (booleano); es `GameCanvas.vue` quien traduce eso a
  `engine.input.setTouchAxis/setTouchFiring`. Estética sin círculos:
  el stick y el botón de disparo son cuadrados con borde, como el
  resto del sitio — un joystick redondo habría roto la regla de
  "radio 0 en todo".
- Detecta soporte con `matchMedia('(pointer: coarse)')`, no con
  `window.innerWidth`: una tablet ancha con pantalla táctil lo tiene,
  un portátil estrecho sin pantalla táctil no. Verificado en el
  navegador de escritorio de prueba (`pointer: fine` real): el overlay
  no se monta ni en fase `game` — cero interferencia para quien juega
  con teclado.
- Verificado forzando `supportsTouch` temporalmente y disparando
  `TouchEvent`/`Touch` sintéticos sobre las zonas reales del DOM
  (`touchstart`/`touchmove`/`touchend`): el stick produce el eje
  esperado (40px de 56 → 0.714), mueve al jugador, vuelve a 0 al
  soltar; la zona de disparo dispara en ráfaga mientras se mantiene y
  para al soltar. Revertido antes de terminar — no queda ningún forzado
  en el código.
- **Bug encontrado de paso, corregido:** `Engine.setPhase('game')`
  limpiaba proyectiles enemigos y explosiones sólo al *salir* de la
  partida, nunca al *entrar*. En el flujo real nunca se nota (`GAME`
  sólo se alcanza desde `GLITCH`, con los pools ya vacíos de fábrica, o
  desde `OVER`, que ya los limpió al salir de `GAME` la vez anterior),
  pero es un invariante implícito y frágil. Se hizo explícito también
  al entrar: una partida nueva ya no depende de que otra fase haya
  limpiado por ella.

### 2026-07-30 (7) — Bug: matar al jefe no terminaba la partida
William reportó que, tras cablear el combate, matar al jefe dejaba el
juego en bucle: sin enemigos, sin jefe, la partida seguía en fase
`game` para siempre. Era exactamente el gap que había quedado anotado
en *Pendiente* de la sesión anterior (§8, Fase 5): `WaveManager` queda
`cleared` y no hay más nada que pueda terminar la partida, así que el
jugador se quedaba volando indefinidamente en un nivel vacío.
- `Engine.js`: nuevo `completeRun(victory)`, único punto de salida de
  una partida. `damagePlayer()` lo llama con `victory: false` al
  perder la última vida; el hándler de impacto jefe→muerte lo llama
  con `victory: true` justo después de `this.boss = null`. Sustituye
  a la llamada directa a `hooks.onGameOver` que sólo existía en
  `damagePlayer` — matar al jefe nunca la disparaba.
- `App.vue`: el título de la pantalla de resultados usa
  `lastRun.victory` para mostrar "Mission Complete" (fósforo, con
  brillo) en vez de "Game Over" (magenta). El resto de la pantalla
  — iniciales, ranking, reinicio — es exactamente el mismo flujo para
  ambos desenlaces: la puntuación se gana igual, jugando o ganando.
- Verificado igual que la sesión anterior: simulación llamando a
  `engine.update(delta)` a mano (la pestaña automatizada no tiene
  foco, así que `requestAnimationFrame` no corre solo). Confirmado
  con captura de pantalla real: "MISSION COMPLETE", puntuación 010100,
  oleada 05, ranking y reinicio intactos.

### 2026-07-30 (6) — Fase 4 cableada de verdad: por qué no aparecían los enemigos
William reportó que, tras la sesión de Fase 4, ni los enemigos ni el
jefe aparecían en pantalla. Diagnóstico: los 5 ficheros que pidió el
prompt de Fase 4 (`Enemy.js`, `Explosion.js`, `waves.js`,
`WaveManager.js`, `Boss.js`) estaban todos bien construidos — se
revisaron uno a uno y coinciden con lo pedido. El problema es el que
ya quedaba anotado en *Pendiente* de la sesión anterior: ese prompt,
literalmente, sólo pedía esos 5 ficheros ("Sólo eso"). Nadie le había
pedido a `Engine.js` que los usara, y no lo hacía: el bucle de juego
sólo movía al jugador y sus proyectiles. Los sistemas existían,
probados de forma aislada en Node, pero no los llamaba nadie.
- `Engine.js`: instancia `WaveManager` (con `onLevelClear` → crea el
  `Boss`), un pool de `Explosion` y un segundo pool de `Projectile`
  para disparo enemigo. `resolveCombat()` nuevo resuelve, en orden:
  disparo del jugador → enemigo/jefe (`takeHit`, puntúa, explota),
  luego nave del jugador → enemigo/proyectil enemigo/jefe (una vida
  por fotograma como máximo, cortesía de `PLAYER.invulnMs`).
- `updateEnemyFire()`: cada enemigo vivo y el jefe tiran una
  probabilidad por segundo (`ENEMY.fireChancePerSecond`, ya existía
  sin usar; `BOSS.fireChancePerSecond` es nueva en `balance.js` — no
  existía una tasa de disparo para el jefe).
- `damagePlayer()` llama a `hooks.onGameOver(summary)` al perder la
  última vida — antes no lo llamaba nunca, así que `game → over` no
  podía ocurrir en una partida real (la Fase 5 sólo se había probado
  forzándolo desde la consola). Ahora es la partida real la que cierra
  el bucle.
- Parpadeo del jugador mientras dura la invulnerabilidad
  (`ctx.globalAlpha`): sin esa señal, perder una vida era invisible.
- `hooks.onStatsChange` nuevo: Engine avisa cuando cambian puntos,
  oleada o vidas (no cada fotograma — sólo lo escucha `App.vue`, que
  ya no muestra 0 fijo durante la partida). `GameCanvas` lo reemite
  como evento `stats`; `App.vue` lo consume en `handleStats` y
  alimenta `HudBar` con `gameScore`/`gameWave`/`gameLives`.
- Verificado jugando de verdad en el navegador: enemigos entran,
  vuelan su patrón y mueren al recibir un disparo; el HUD pasa de
  "Oleada 00" a "Oleada 01" al arrancar; matar enemigos suma puntos.
  Además, como la pestaña automatizada del navegador no tiene foco
  (Chrome pausa `requestAnimationFrame` en pestañas ocultas) se
  simuló la partida llamando a `engine.update(delta)` a mano varios
  cientos de veces seguidas — el mismo código de producción, sin
  esperar a fotogramas reales — para confirmar sin ambigüedad: las 4
  oleadas limpian, el jefe entra a los ~30s, atraviesa sus 3 fases
  según la vida restante, muere otorgando `BOSS.score`, y perder
  todas las vidas dispara `onGameOver` de verdad — el marcador HUD y
  la pantalla de resultados mostraron después la puntuación real de
  esa partida simulada (002600 en una prueba, 010100 en otra).
- **Gap conocido, no pedido esta vez:** no hay pantalla de victoria
  al matar al jefe (ver Pendiente, Fase 5). Tampoco se tocó el diseño
  de las 4 oleadas ni del jefe: siguen siendo los que se diseñaron en
  la sesión de Fase 4, sólo que ahora el motor los ejecuta.

### 2026-07-30 (5) — Cierre del bucle de juego
- `usePhase.js`: nueva transición `OVER → GAME` y función `restart()`
  — "jugar de nuevo" desde la pantalla de resultados sin repetir la
  cinemática de glitch, que sólo tiene sentido la primera vez.
- `ScoreEntry.vue` nuevo: iniciales por carretes A-Z (`role="spinbutton"`),
  no campo de texto. Decisión deliberada: escribir letras habría
  chocado con la tecla R de reinicio global, y el patrón de carretes
  es más fiel a una recreativa real. Flechas + Enter por teclado,
  botones ▲▼ + OK por ratón/dedo — mismo control, tres formas de darlo.
- `Leaderboard.vue` nuevo: top 20, resalta la entrada recién enviada
  comparando iniciales+puntos (el backend no devuelve un id de fila).
  Si `status === 'offline'` lo dice explícitamente ("Marcador local —
  sin conexión") en vez de enseñar una lista vacía o silenciosa.
- **No se creó `GameHud.vue`.** `HudBar` ya cambia de contenido en fase
  `game`/`over` (oleada, vidas) desde el rediseño anterior; el único
  hueco real era que `App.vue` seguía pasándole el progreso de lectura
  del CV como `score` durante la partida. Se resolvió cambiando qué
  prop recibe `HudBar` según la fase, no añadiendo un componente que
  hubiera duplicado su plantilla y su hoja de estilos.
- `App.vue` cablea `game → over → idle`: escucha `@gameover` de
  `GameCanvas` (→ `endRun`), compone `ScoreEntry` + `Leaderboard` en
  la pantalla de resultados, envía la puntuación con `useLeaderboard`,
  mueve el foco al botón "Jugar de nuevo" tras guardar, y la tecla R
  (más un botón visible, no sólo el atajo) dispara `restart()`.
  `HeroCard` y las secciones del CV ahora sólo se renderizan en
  `showsCv`: antes quedaban montadas encima del canvas durante la
  partida porque nada las ocultaba, así que "pantalla completa" no lo
  era de verdad. Corregido porque de lo contrario la nueva pantalla de
  resultados habría quedado detrás de la portada del CV.
- Verificado en navegador (Chrome, servidor de desarrollo): flujo
  completo con teclado (flechas, Enter, R), con ratón (botones ▲▼/OK/
  reinicio/volver) y con la API sin desplegar (confirma la degradación
  a `offline` con el texto exacto pedido). Probado con un hook temporal
  (`window.__debugEndRun`) para forzar `game → over`, porque `Engine`
  todavía no llama a `onGameOver` — ver Pendiente, Fase 4. El hook se
  quitó antes de terminar; no queda en el código.

### 2026-07-30 (4) — Diseño de niveles: enemigos, oleadas y jefe
- `entities/Enemy.js` nuevo: el tipo (letra del atlas) sólo cambia el
  sprite; el patrón de vuelo es una función en `PATHS` que `WaveManager`
  inyecta en `reset()`. Seis patrones: `sweepLeftToRight/RightToLeft`,
  `diagonalFromLeft/FromRight`, `sineDive`, `loopDrop`. Añadir un
  patrón nuevo es añadir una función; `Enemy` nunca distingue por ifs.
- `entities/Explosion.js` nuevo: animación de 3 fotogramas del atlas
  (`explosion`/`2`/`3`), se auto-destruye (`kill()`) al agotarlos.
  `x, y` son el centro, para poder pasar `centerX/centerY` directos.
- `config/waves.js` nuevo: el nivel como datos. Cuatro oleadas —
  Reconocimiento, Picado en V, Tenaza, Enjambre— pensadas para
  aprenderse: cada una introduce una idea y la repite antes de pasar a
  la siguiente; la última combina las cuatro. El jefe no vive aquí:
  no es una formación de enemigos, es una entidad única.
- `systems/WaveManager.js` nuevo: lee `waves.js`, resuelve `formation`
  (posiciones relativas: `line5`, `v5`, `column4`, `stagger6`) y `path`
  contra tablas propias/de `Enemy`, encola apariciones con retraso y
  avisa (`onWaveClear`, `onLevelClear`) sin que el fichero de datos
  sepa nada de tiempos de asentamiento.
- `entities/Boss.js` nuevo: vida múltiple, patrulla horizontal con
  balanceo vertical creciente. Las 3 fases de `BOSS.phaseHpRatios` no
  son comportamientos distintos: son dos multiplicadores (velocidad,
  amplitud) sobre la misma fórmula. `boss4` no es una cuarta fase: es
  el fotograma de flash al recibir impacto, para aprovechar los 4
  sprites del atlas sin inventar un umbral que `phaseHpRatios` no tiene.
- `balance.js` gana `ENEMY.poolSize/defaultPathDurationS/formationSpacing
  /formationStaggerMs`, `BOSS.entrySpeed` y el bloque `EXPLOSION`.
- Verificado con un script de simulación en Node (sin UI): las 4 oleadas
  limpian en orden, el jefe recorre sus 3 fases al perder vida, la
  explosión se autodestruye a los 3 fotogramas, el AABB detecta solape
  y no-solape correctamente. Ninguna posición se vuelve `NaN`.
- **Sin cablear en `Engine` todavía** (no pedido en esta sesión): estos
  cinco módulos existen y funcionan de forma aislada, pero el motor no
  los invoca aún. Ver Pendiente §8.

### 2026-07-30 (3) — Proyectiles y disparo del jugador
- `entities/Projectile.js` nuevo: un solo tipo con propiedad `faction`
  (`'player' | 'enemy'`) en vez de dos clases — la diferencia real es
  dirección, sprite y contra quién colisiona, no el comportamiento.
- `systems/Pool.js` nuevo: pool genérico que recicla con `Entity.reset()`.
  Sin él, las ráfagas de disparo instanciarían y descartarían objetos sin
  parar y el recolector de basura se notaría como tirones a 60 fps.
  Tamaño en `PROJECTILE.poolSize`.
- `systems/CollisionSystem.js` nuevo: AABB puro, sin dependencias de
  `Entity` ni de ningún tipo concreto (`check(a, b)` y
  `resolve(groupA, groupB, onHit)`). Instanciado en `Engine` pero sin
  invocar todavía: no hay un segundo grupo (enemigos) con el que
  llamar a `resolve()` hasta la Fase 4.
- `InputHandler` gana el getter `fire` (tecla `Space`), igual que
  `axisX`/`axisY`. El cooldown no vive aquí: lo decide quien lee la
  entrada.
- `Engine` orquesta el disparo: cooldown en `updateWeapons()`
  (`PLAYER.fireCooldownMs`), actualiza y dibuja el pool de proyectiles
  del jugador sólo en fase `game`, y limpia el pool al salir de esa
  fase para que la partida siguiente no herede proyectiles "vivos".

### 2026-07-30 (2) — Contenido: stack, proyectos y sección personal
- **Laravel pasa a primera posición** del stack, seguido de JavaScript,
  SQL, PostgreSQL, Vue.js y Node.js. El orden es la señal de prioridad.
- `StackStrip.vue` nuevo: tira de las 6 tecnologías principales justo
  bajo la portada, sobre el pliegue. La principal va destacada.
- `ProjectList.vue` sustituido por `ProjectGallery.vue`: portada,
  problema/solución, stack por proyecto, filtro por tecnología y
  marcador pixel-art determinista cuando falta la imagen.
- `AboutPanel.vue` nuevo: bio, tres principios de trabajo y hobbies
  como ranuras de partida guardada.
- `StageNav.vue` nuevo: navegación pegajosa por secciones con
  `IntersectionObserver`. Alternativa a pestañas sin ocultar contenido.
- `StageSection` acepta `id` explícito: renumerar no rompe enlaces
  compartidos.
- Secciones reordenadas: proyectos antes que experiencia.

### 2026-07-30 — Reestructuración, backend y rediseño
- Carpetas reorganizadas por responsabilidad; `game/` queda sin
  dependencias de Vue.
- Máquina de estados sacada de `AvatarHeader` a `composables/usePhase.js`:
  antes obligaba a que todo colgase de ese componente.
- Contenido del CV extraído a `src/data/profile.js`.
- Siete errores corregidos en el motor (ver §8).
- Rediseño completo bajo la dirección "CRT Terminal". Nuevo sistema de
  tokens y ocho componentes.
- API de ranking global sobre Vercel Functions + Upstash Redis, con
  firma de partidas y degradación a localStorage.
- Configuración de despliegue en Vercel con dominio propio.
- Eliminados `AtlasTester.vue` (herramienta temporal de fase 0),
  `AvatarHeader.vue` y `style.css`.
