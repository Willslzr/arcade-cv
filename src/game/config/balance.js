/**
 * balance.js — todas las constantes de juego en un sitio.
 *
 * Ajustar la dificultad no debería obligar a abrir cinco ficheros
 * de lógica. Aquí viven los números; en las clases, el comportamiento.
 * Regla: si un valor se toca para "que se sienta mejor", va aquí.
 */

export const PLAYER = Object.freeze({
  scale: 6,             // px de pantalla por píxel del atlas
  maxSpeed: 420,        // px/s
  accel: 12,            // rapidez con la que alcanza la velocidad objetivo
  friction: 7,          // rapidez con la que se detiene
  entrySpeed: 260,      // px/s durante la cinemática de entrada
  bottomMargin: 32,
  ceilingRatio: 0.45,   // no puede subir por encima de este % de altura
  engineFrameMs: 90,
  fireCooldownMs: 180,
  lives: 1,
  invulnMs: 1200,
})

export const PROJECTILE = Object.freeze({
  playerScale: 5,
  enemyScale: 5,
  playerSpeed: -760,    // negativo = hacia arriba
  enemySpeed: 340,
  poolSize: 128,
})

export const ENEMY = Object.freeze({
  scale: 5,
  baseHp: 1,
  baseScore: 100,
  driftAmplitude: 40,
  fireChancePerSecond: 0.25,
  poolSize: 32,             // techo de enemigos vivos a la vez en pantalla
  defaultPathDurationS: 4.5, // duración de vuelo si una ola no la especifica
  formationSpacing: 70,     // separación en px entre naves de una misma formación
  formationStaggerMs: 160,  // retraso entre apariciones en formaciones "en cola"
})

export const BOSS = Object.freeze({
  scale: 8,
  hp: 40,
  score: 5000,
  speed: 130,
  entrySpeed: 90,           // px/s durante la cinemática de entrada
  phaseHpRatios: [1, 0.66, 0.33], // cambios de patrón por vida restante
})

export const EXPLOSION = Object.freeze({
  scale: 5,
  frameMs: 90,   // ritmo del parpadeo de sus 3 fotogramas
  poolSize: 16,
})

export const SCORING = Object.freeze({
  waveClearBonus: 500,
  noDamageBonus: 2500,
  maxPlausible: 250000, // techo usado por el backend como anti-trampas
})
