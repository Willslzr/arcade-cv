/**
 * waves.js — el nivel como datos.
 *
 * Cada entrada de `spawns` es un grupo que aparece a los `at` segundos
 * desde que arranca su ola, con una `formation` (cómo se colocan entre
 * sí) y un `path` (cómo se mueven una vez en pantalla). Ajustar el
 * nivel es editar estos números; `WaveManager` no sabe de coreografía,
 * sólo ejecuta lo que hay aquí. Nombres válidos hoy: formaciones en
 * `WaveManager.FORMATIONS`, patrones en `Enemy.PATHS`.
 *
 * Progresión pensada para aprenderse, no para memorizarse al azar:
 * cada ola introduce una idea y la repite una vez antes de pasar a la
 * siguiente. La ola 4 combina las cuatro. El jefe no vive aquí: no es
 * una formación de enemigos, es una entidad única (ver Boss.js).
 */

export const WAVES = [
  {
    id: 'wave-1',
    name: 'Reconocimiento',
    spawns: [
      { at: 0, formation: 'line5', enemyType: 'A', path: 'sweepLeftToRight', durationS: 4.5 },
      { at: 3.2, formation: 'line5', enemyType: 'A', path: 'sweepRightToLeft', durationS: 4.5 },
    ],
  },
  {
    id: 'wave-2',
    name: 'Picado en V',
    spawns: [
      { at: 0, formation: 'v5', enemyType: 'B', path: 'sineDive', durationS: 5 },
      { at: 2.8, formation: 'v5', enemyType: 'B', path: 'sineDive', durationS: 5 },
    ],
  },
  {
    id: 'wave-3',
    name: 'Tenaza',
    spawns: [
      { at: 0, formation: 'stagger6', enemyType: 'C', path: 'diagonalFromLeft', durationS: 4 },
      { at: 0, formation: 'stagger6', enemyType: 'D', path: 'diagonalFromRight', durationS: 4 },
      { at: 3.6, formation: 'stagger6', enemyType: 'D', path: 'diagonalFromLeft', durationS: 4 },
      { at: 3.6, formation: 'stagger6', enemyType: 'C', path: 'diagonalFromRight', durationS: 4 },
    ],
  },
  {
    id: 'wave-4',
    name: 'Enjambre',
    spawns: [
      { at: 0, formation: 'column4', enemyType: 'E', path: 'loopDrop', durationS: 5.5 },
      { at: 1.6, formation: 'line5', enemyType: 'F', path: 'sweepLeftToRight', durationS: 4 },
      { at: 3.2, formation: 'v5', enemyType: 'G', path: 'sineDive', durationS: 5 },
      { at: 4.8, formation: 'stagger6', enemyType: 'H', path: 'diagonalFromLeft', durationS: 4 },
    ],
  },
]
