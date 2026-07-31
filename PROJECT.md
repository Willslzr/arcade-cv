# PROJECT.md — Memoria del proyecto

> **Para la IA que lea esto:** este fichero es la fuente de verdad del
> estado del proyecto. Léelo antes de tocar código. No hace falta
> revisar el historial de conversación: lo relevante está aquí.
> Al terminar cualquier cambio, actualiza *Estado actual*, *Registro de
> cambios* y *Pendiente*. Sé concreto y breve; esto no es un diario.

**Última actualización:** 2026-07-31
**Fase actual:** 5 de 6 — jugable de verdad en escritorio y en móvil (controles táctiles añadidos)

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
│   │   └── guard.js              Validación, HMAC de partidas, rate limit
│   └── scores/
│       ├── index.js              GET top 20 · POST registrar puntuación
│       └── start.js              POST abrir partida → runId firmado
│
├── public/
│   ├── assets/atlas.png          Texture atlas 128×128
│   ├── img/avatar.jpeg           Foto de perfil
│   ├── img/pixel-avatar.jpeg     Versión pixel art (sin usar aún)
│   └── favicon.svg               Nave del jugador en SVG
│
├── src/
│   ├── main.js                   Punto de entrada; orden de los CSS
│   ├── App.vue                   Composición y cableado de la máquina de estados
│   │
│   ├── assets/styles/
│   │   ├── tokens.css            ÚNICO sitio con valores de color/tipo/espaciado
│   │   ├── base.css              Reset, tipografía global, utilidades, a11y
│   │   └── crt.css               Capa de vidrio: scanlines, viñeta, barrido
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── HudBar.vue        Marcador fijo superior (elemento firma)
│   │   │   ├── CrtOverlay.vue    Overlay del monitor, sin eventos
│   │   │   └── StageSection.vue  Envoltorio de sección numerada
│   │   │   ├── StageNav.vue      Selector de sección pegajoso (anclas, no pestañas)
│   │   ├── cv/
│   │   │   ├── HeroCard.vue      Portada + avatar-botón que dispara el juego
│   │   │   ├── StackStrip.vue    Tira de stack principal, sobre el pliegue
│   │   │   ├── StackGrid.vue     Stack detallado como barras de EXP
│   │   │   ├── ProjectGallery.vue Galería de proyectos con portada y filtro
│   │   │   ├── TimelineList.vue  Experiencia como línea temporal
│   │   │   ├── AboutPanel.vue    Bio, principios y hobbies
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
│   │   └── useReadProgress.js    Progreso de scroll → marcador del HUD
│   │
│   ├── data/
│   │   └── profile.js            TODO el contenido del CV. Editar aquí.
│   │
│   ├── lib/
│   │   ├── GlitchEffect.js       Algoritmo de corrupción de texto (JS puro)
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
- [ ] Generar `public/og.png` (1200×630)
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
- [ ] Empresas y fechas reales en `experience`
- [ ] Dos proyectos reales sustituyendo las plantillas
- [ ] Capturas en `public/img/projects/`
- [ ] Usuarios reales de GitHub y LinkedIn
- [ ] Tercer hobby real

**Calidad**
- [ ] Tests de `GlitchEffect` y del guard de la API (Vitest)
- [ ] Auditoría Lighthouse — objetivo ≥ 95 en las cuatro categorías
- [ ] `public/og.png` y `public/cv-william-salazar.pdf`

---

## 9. Estructura de contenido del CV

Orden de secciones. **No es el orden en que se escribieron: es el
orden en que un reclutador decide.**

| # | Sección | Pregunta que responde |
|---|---|---|
| — | Portada + tira de stack | ¿Quién es y con qué trabaja? (sobre el pliegue) |
| 01 | Stack | ¿Encaja con la vacante? |
| 02 | Proyectos | ¿Sabe hacerlo de verdad? |
| 03 | Experiencia | ¿Dónde lo ha hecho? |
| 04 | Sobre mí | ¿Quiero trabajar con esta persona? |
| 05 | Contacto | ¿Cómo le escribo? |

**Proyectos va antes que experiencia a propósito:** la prueba pesa más
que el historial, sobre todo en perfiles que no tienen 15 años de
recorrido.

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

## 10. Registro de cambios

> Una línea por sesión. Qué cambió y por qué, no cómo.

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
