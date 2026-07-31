# Prompts para continuar el proyecto

> Copia y pega estos bloques en Claude Code, **uno por sesión**.
>
> Un solo prompt gigante que pida "termina el juego y la web entera"
> produce peor resultado que cuatro prompts acotados: el modelo pierde
> precisión a medida que crece el contexto, y cuando algo sale mal no
> sabes qué parte revisar. Cada sesión aquí cabe en una revisión
> humana de 10 minutos.

---

## 0 · Prompt de arranque (una vez, al abrir Claude Code)

```
Lee PROJECT.md de principio a fin antes de escribir nada. Es la memoria
del proyecto: contiene la arquitectura, las decisiones tomadas y por qué,
el estado de cada fase y lo que falta.

Reglas del repositorio, no negociables:
- src/game/ no importa nada de Vue. src/components/ no contiene lógica
  de juego. src/data/ no contiene lógica en absoluto.
- Ningún hex suelto: todo color sale de src/assets/styles/tokens.css.
- Ninguna constante de juego suelta: todo número que se ajuste "para que
  se sienta mejor" vive en src/game/config/balance.js.
- Los comentarios explican por qué, nunca qué. Si el código necesita que
  le expliquen qué hace, reescribe el código.
- El CV tiene que seguir siendo navegable con teclado y legible por un
  lector de pantalla en todo momento.

Confírmame que lo has leído resumiéndome en 5 líneas en qué punto está
el proyecto y cuál es el siguiente paso. No escribas código todavía.
```

---

## 1 · Disparos y colisiones

```
Fase 3-4 de PROJECT.md: proyectiles y combate. Sólo eso.

1. src/game/entities/Projectile.js — extiende Entity. Un solo tipo con
   propiedad `faction` ('player' | 'enemy') en vez de dos clases: la
   diferencia real es dirección, sprite y contra quién colisiona.
2. src/game/systems/Pool.js — pool genérico de entidades. Los
   proyectiles se crean en ráfagas y el recolector de basura provoca
   tirones perceptibles a 60 fps; por eso se reciclan con Entity.reset()
   en vez de instanciar. Tamaño en PROJECTILE.poolSize.
3. src/game/systems/CollisionSystem.js — AABB puro, sin dependencias.
   Expón `check(a, b)` y `resolve(groupA, groupB, onHit)`.
4. Disparo del jugador con cooldown (PLAYER.fireCooldownMs) desde
   InputHandler ('Space').
5. Cablea todo en Engine.update(). El motor orquesta; no implementa
   reglas.

Al terminar: actualiza el §8 y el registro de cambios de PROJECT.md, y
dime cómo probarlo a mano en el navegador.
```

---

## 2 · Enemigos, oleadas y jefe final

```
Fase 4 de PROJECT.md: diseño de niveles. Sólo eso.

1. src/game/entities/Enemy.js — vida, puntuación y patrón de movimiento
   inyectado como función, no como cadena de ifs.
2. src/game/entities/Explosion.js — animación de 3 fotogramas del atlas,
   se auto-destruye al terminar.
3. src/game/config/waves.js — las oleadas como DATOS, no como código:
   un array de { at, formation, enemyType, path }. El objetivo es que
   ajustar el nivel sea editar este fichero, nunca tocar el WaveManager.
4. src/game/systems/WaveManager.js — lee waves.js, instancia y avisa
   cuando la oleada se limpia.
5. src/game/entities/Boss.js — vida múltiple, movimiento horizontal y
   cambio de patrón según BOSS.phaseHpRatios. Sprites boss/boss2/3/4
   del atlas.

Diseña 4 oleadas más el jefe. Que se sienta coreografiado al estilo
Starfox 64, no aleatorio: el jugador debe poder aprenderse el patrón.

Actualiza PROJECT.md al terminar.
```

---

## 3 · Fin de partida y marcador

```
Fase 5 de PROJECT.md: cierre del bucle de juego. Sólo eso.

1. src/components/game/GameHud.vue — puntuación, oleada y vidas durante
   la partida. Reutiliza HudBar si encaja; si no, dime por qué no.
2. src/components/game/ScoreEntry.vue — entrada de 3 iniciales estilo
   recreativa. Tiene que funcionar con teclado Y con clic; en móvil,
   con toque.
3. src/components/game/Leaderboard.vue — consume useLeaderboard.js, ya
   escrito. Muestra el top 20 y resalta la entrada recién enviada.
   Cuando status es 'offline', dilo explícitamente en la interfaz:
   "Marcador local — sin conexión". No mientas mostrando una lista vacía.
4. Cablea las transiciones game → over → idle usando usePhase.js. Las
   transiciones legales ya están declaradas; si necesitas una nueva,
   añádela a TRANSITIONS, no la esquives.
5. Tecla R reinicia la partida sin recargar la página.

Actualiza PROJECT.md al terminar.
```

---

## 4 · Controles táctiles

```
Sin esto, en móvil el juego no existe, y la mitad de quien abra el enlace
lo hará desde el teléfono.

Añade control táctil al juego:
- Zona izquierda de la pantalla: joystick virtual que alimenta
  InputHandler.axisX / axisY. Debe aparecer sólo al tocar, no ocupar
  pantalla permanentemente.
- Zona derecha: disparo. Considera disparo automático mientras se
  mantiene el dedo, es lo estándar en shooters táctiles.
- Detecta el soporte con (pointer: coarse), no por el ancho de pantalla:
  hay tablets anchas con pantalla táctil y portátiles estrechos sin ella.
- InputHandler debe exponer la misma API para teclado y táctil. Ni
  Player ni Engine deberían enterarse de que existe el táctil.

Actualiza PROJECT.md al terminar.
```

---

## 5 · Pulido antes de publicar

```
Última pasada antes del despliegue.

1. Tests con Vitest de src/lib/GlitchEffect.js y api/_lib/guard.js.
   Sólo esos dos: son lógica pura con reglas claras y es donde un fallo
   silencioso hace más daño.
2. Auditoría Lighthouse en móvil. Objetivo ≥ 95 en las cuatro
   categorías. Dime qué encuentras ANTES de arreglarlo.
3. Revisa que ninguna imagen provoque desplazamiento de layout: todas
   con width y height explícitos.
4. Comprueba el recorrido completo sólo con teclado, de la portada al
   contacto, pasando por el juego y volviendo.
5. Genera public/og.png (1200×630) con la estética del sitio.

No cambies el diseño. Si algo te parece mejorable visualmente, dímelo y
lo decido yo.
```

---

## Cómo trabajar con estos prompts

**Entre sesión y sesión, ejecuta `/clear`.** El contexto acumulado de la
sesión anterior no ayuda: `PROJECT.md` ya contiene lo que hay que saber,
y arrastrar el historial sólo diluye la atención del modelo.

**Revisa el diff antes de aceptar.** `git diff` después de cada sesión.
Si hay más de ~400 líneas nuevas, el prompt era demasiado ancho: pártelo.

**Haz commit al final de cada sesión**, con `PROJECT.md` incluido en el
mismo commit. El fichero de memoria y el código que describe tienen que
viajar juntos o dejarán de coincidir.

**Cuando algo salga mal**, no pidas "arréglalo". Describe qué esperabas,
qué pasó y qué has probado. La diferencia en la calidad de la respuesta
es grande.
