/**
 * profile.js — Fuente única de verdad del contenido del CV.
 *
 * Ningún componente escribe texto de perfil en su template.
 * Cambiar el CV = editar este fichero. Esto mantiene la capa de
 * presentación reutilizable y hace trivial traducirlo o
 * exportarlo a JSON-LD para SEO.
 */

export const identity = {
  name: 'William E. Salazar O.',
  handle: 'WLM',
  role: 'Analista de Requerimientos & Desarrollador',
  level: 30,
  base: 'Buenos Aires, Argentina',
  tagline: 'Traduzco necesidades de negocio a software que se sostiene.',
  avatar: '/img/avatar.jpeg',
  cv: '/cv-william-salazar.pdf',
  available: true, // pinta el indicador "disponible" del hero
}

/* ============================================================
   STACK PRINCIPAL — la tira que ve el reclutador sin scroll.
   Orden = prioridad real, no alfabético ni cronológico. Lo
   primero de la lista es lo que mejor dominas, y así se lee.
   Máximo 6: a partir de ahí deja de ser una señal y pasa a ser
   una lista de la compra.
   ============================================================ */
export const primaryStack = [
  { id: 'laravel',    label: 'Laravel',    kind: 'Backend',  lead: true },
  { id: 'javascript', label: 'JavaScript', kind: 'Lenguaje' },
  { id: 'sql',        label: 'SQL',        kind: 'Datos' },
  { id: 'postgresql', label: 'PostgreSQL', kind: 'Base de datos' },
  { id: 'vue',        label: 'Vue.js',     kind: 'Frontend' },
  { id: 'node',       label: 'Node.js',    kind: 'Backend' },
]

/**
 * Detalle del stack (sección 02). `level` es 0–100 y se dibuja
 * como barra de EXP. `note` explica en qué lo has usado de verdad
 * — evita el clásico listado de logos sin contexto.
 */
export const stack = [
  { id: 'laravel',    label: 'Laravel',    level: 92, note: 'Eloquent, colas, políticas de autorización, testing con Pest' },
  { id: 'javascript', label: 'JavaScript', level: 88, note: 'ES2023, async, DOM y Canvas 2D' },
  { id: 'sql',        label: 'SQL',        level: 85, note: 'Modelado, índices, planes de ejecución, consultas analíticas' },
  { id: 'postgresql', label: 'PostgreSQL', level: 82, note: 'JSONB, vistas materializadas, migraciones sin downtime' },
  { id: 'vue',        label: 'Vue.js',     level: 80, note: 'Composition API, SFC, composables, Pinia' },
  { id: 'node',       label: 'Node.js',    level: 74, note: 'APIs REST, funciones serverless, scripting' },
]

/** Herramientas secundarias. Se listan en texto, sin barra. */
export const toolbelt = [
  'Git', 'Docker', 'Redis', 'Figma', 'Postman', 'Linux', 'Vite',
]

/* ============================================================
   EXPERIENCIA
   `impact` es obligatorio: una línea con el resultado, no la tarea.
   ============================================================ */
export const experience = [
  {
    id: 'exp-1',
    from: '2023',
    to: 'Hoy',
    role: 'Analista de Requerimientos',
    org: 'Nombre de la empresa',
    impact: 'Sustituí la toma de requisitos por correo con un proceso documentado; el retrabajo por malentendidos cayó de forma medible.',
    tags: ['Análisis', 'Documentación', 'SQL'],
  },
  {
    id: 'exp-2',
    from: '2021',
    to: '2023',
    role: 'Desarrollador Full Stack',
    org: 'Nombre de la empresa',
    impact: 'Construí y mantuve el frontend en Vue de la plataforma interna, con backend Laravel y PostgreSQL.',
    tags: ['Laravel', 'Vue', 'PostgreSQL'],
  },
]

/* ============================================================
   PROYECTOS
   Cada ficha necesita: portada, una frase que se entienda sin
   contexto, el problema que resolvía y el stack real.
   `cover` puede ser null: la galería dibuja un marcador pixel-art
   en su lugar, así que puedes publicar sin esperar a tener fotos.
   Formato recomendado: 1200×750 (ratio 16:10), .webp.
   ============================================================ */
export const projects = [
  {
    id: 'arcade-cv',
    name: 'Arcade CV',
    year: '2026',
    // Una frase. Si necesitas dos, la primera no estaba bien escrita.
    summary: 'Este mismo sitio: un CV que se convierte en un shoot’em up.',
    problem: 'Un portfolio más no se recuerda. Quería que la demostración técnica fuese el propio sitio, no una captura de otro proyecto.',
    detail: 'Motor de juego escrito desde cero sobre Canvas 2D: bucle con deltaTime acotado, colisiones AABB, pooling de proyectiles y un texture atlas de 128×128 servido en una sola petición.',
    stack: ['Vue 3', 'Canvas 2D', 'Vite', 'Node.js'],
    cover: null, // → /img/projects/arcade-cv.webp
    links: [
      { label: 'Ver código', href: 'https://github.com/tu-usuario/arcade-cv' },
    ],
    featured: true,
  },
  {
    id: 'proyecto-2',
    name: 'Nombre del proyecto',
    year: '2025',
    summary: 'Una frase que explique qué hace, legible por alguien de negocio.',
    problem: 'Qué dolía antes de que existiera. Sé concreto: un número o una situación, no “mejorar procesos”.',
    detail: 'Cómo lo resolviste. Aquí sí puedes ser técnico: arquitectura, decisiones y por qué.',
    stack: ['Laravel', 'PostgreSQL', 'Vue.js'],
    cover: null,
    links: [],
    featured: false,
  },
  {
    id: 'proyecto-3',
    name: 'Nombre del proyecto',
    year: '2024',
    summary: 'Otra frase corta. Si no cabe en un tuit, el proyecto no está bien contado.',
    problem: 'El problema de partida.',
    detail: 'La solución y lo que aprendiste.',
    stack: ['Laravel', 'SQL', 'Docker'],
    cover: null,
    links: [],
    featured: false,
  },
]

/* ============================================================
   SOBRE MÍ
   Va después de proyectos a propósito: primero demuestras, luego
   te presentas. Un reclutador que ha llegado hasta aquí ya está
   interesado, y es cuando la parte humana suma en vez de estorbar.
   ============================================================ */
export const about = {
  // Primera persona, frases cortas. Sin "apasionado por la tecnología".
  bio: [
    'Empecé por el lado del análisis: entender qué necesita alguien antes de escribir una línea de código. Sigo pensando que ahí se gana o se pierde un proyecto.',
    'Programo sobre todo en Laravel, y disfruto la parte que no se ve: el modelo de datos, las consultas que no se van de tiempo, el código que otra persona puede leer dentro de un año.',
  ],
  // Los hobbies se presentan como partidas guardadas: mantiene el
  // tono sin convertirse en un chiste que se agota a la segunda línea.
  hobbies: [
    { id: 'h1', label: 'Videojuegos retro', detail: 'Shoot’em ups de los 90. De ahí salió este sitio.' },
    { id: 'h2', label: 'Pixel art',         detail: 'Los sprites del juego los dibujé yo, píxel a píxel.' },
    { id: 'h3', label: 'Cambia esto',       detail: 'Pon algo real: música, cocina, correr, lo que sea.' },
  ],
  // Tres cosas que te definen como profesional. Se leen en 5 segundos.
  principles: [
    'Prefiero preguntar dos veces a rehacer una vez.',
    'El código que nadie entiende no está terminado.',
    'Si no se puede medir, no sé si lo he mejorado.',
  ],
}

export const contact = [
  { id: 'email',    label: 'Email',    value: 'williamyenn@gmail.com', href: 'mailto:williamyenn@gmail.com' },
  { id: 'github',   label: 'GitHub',   value: 'github.com/tu-usuario', href: 'https://github.com/tu-usuario' },
  { id: 'linkedin', label: 'LinkedIn', value: 'in/tu-usuario',         href: 'https://www.linkedin.com/in/tu-usuario' },
]

/**
 * Copia del modo glitch. Vive aquí porque es contenido narrativo,
 * no lógica: la clase GlitchEffect sólo recibe cadenas y no sabe
 * nada del CV.
 */
export const glitchScript = {
  nameFrom: identity.name,
  nameTo:   'SISTEMA COMPROMETIDO',
  roleFrom: `LEVEL ${identity.level} · ANALISTA & DEV · LARAVEL JS SQL POSTGRES VUE NODE · ${identity.base.toUpperCase()}`,
  roleTo:   'DESTRUYE A LOS INVASORES. SALVA EL PLANETA.',
}
