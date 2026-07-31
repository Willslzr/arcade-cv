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
   STACK PRINCIPAL — el "inventario" que se ve nada más entrar,
   antes de hacer scroll. Se agrupa en las 4 categorías con las
   que un fullstack real organiza su cabeza: qué corre en el
   servidor, qué corre en el navegador, dónde viven los datos, y
   las herramientas que no encajan en ninguna de las anteriores.
   `lead: true` como máximo UNA vez por columna — es la pieza
   "equipada", no una etiqueta que se reparte a todos por igual.
   ============================================================ */
export const stackColumns = [
  {
    id: 'back',
    label: 'Back Stack',
    items: [
      { label: 'Laravel',  icon: 'laravel',  level: 92, note: 'Eloquent, colas, políticas de autorización, testing con Pest', lead: true },
      { label: 'PHP',      icon: 'php',      level: 88, note: 'Tipado gradual, POO, Composer' },
      { label: 'Node.js',  icon: 'node',     level: 74, note: 'APIs REST, funciones serverless, scripting' },
      { label: 'Livewire', icon: 'livewire', level: 78, note: 'Componentes reactivos sin salir de Blade' },
    ],
  },
  {
    id: 'front',
    label: 'Front Stack',
    items: [
      { label: 'Vue.js',      icon: 'vue',        level: 80, note: 'Composition API, SFC, composables, Pinia', lead: true },
      { label: 'JavaScript',  icon: 'javascript', level: 88, note: 'ES2023, async, DOM y Canvas 2D' },
      { label: 'HTML',        icon: 'html',       level: 85, note: 'Semántica y accesibilidad' },
      { label: 'CSS',         icon: 'css',        level: 82, note: 'Flexbox, Grid, animaciones' },
    ],
  },
  {
    id: 'database',
    label: 'Database',
    items: [
      { label: 'PostgreSQL', icon: 'postgresql', level: 82, note: 'JSONB, vistas materializadas, migraciones sin downtime', lead: true },
      { label: 'SQL',        iconText: 'SQL',    level: 85, note: 'Modelado, índices, planes de ejecución' },
      { label: 'Redis',      icon: 'redis',      level: 70, note: 'Cache y sorted sets — el ranking de este sitio corre aquí' },
    ],
  },
  {
    id: 'misc',
    label: 'Miscellaneous',
    items: [
      { label: 'Git',      icon: 'git',     level: 90, note: 'Control de versiones, flujos de ramas', lead: true },
      { label: 'Docker',   icon: 'docker',  level: 75, note: 'Contenedores para entornos reproducibles' },
      { label: 'Azure',    icon: 'azure',   level: 65, note: 'Pipelines y despliegue' },
      { label: 'Jira',     icon: 'jira',    level: 80, note: 'Gestión ágil de tareas' },
    ],
  },
]

/* ============================================================
   EXPERIENCIA
   `impact` es obligatorio: una línea con el resultado, no la tarea.
   Orden: más reciente primero.
   ============================================================ */
export const experience = [
  {
    id: 'exp-linktic-qa-ssr',
    from: '06/2025',
    to: 'Actualidad',
    role: 'Analista QA Semisenior',
    org: 'LinkTic (Remoto)',
    impact: 'Traduzco requisitos de negocio en historias de usuario y casos de uso, y automatizo las pruebas de regresión con Puppeteer — menos tiempo de QA manual en cada entrega.',
    tags: ['Análisis de requisitos', 'QA', 'Puppeteer', 'Automatización'],
  },
  {
    id: 'exp-linktic-tester',
    from: '09/2024',
    to: '06/2025',
    role: 'Tester Junior',
    org: 'LinkTic (Remoto)',
    impact: 'Ejecuté y documenté casos de prueba, validé correcciones y automaticé pruebas de regresión con Puppeteer, sentando la base del proceso que hoy mantengo como semisenior.',
    tags: ['Testing', 'Puppeteer', 'Automatización', 'Documentación de bugs'],
  },
  {
    id: 'exp-nerdcom',
    from: '06/2024',
    to: '09/2024',
    role: 'Desarrollador Fullstack',
    org: 'NerdCom SRL (Remoto)',
    impact: 'Implementé un sistema multilingüe end-to-end y rediseñé módulos completos de la aplicación (Livewire + Metronic 7), coordinando directamente con el dueño del producto los cambios de estética y usabilidad.',
    tags: ['Livewire', 'Metronic 7', 'Fullstack', 'i18n'],
  },
  {
    id: 'exp-shokworks',
    from: '12/2023',
    to: '06/2024',
    role: 'Backend Developer Trainee',
    org: 'Shokworks, Inc (Remoto)',
    impact: 'Construí servicios y APIs en Laravel y componentes reutilizables en Vue.js: mi primera experiencia profesional resolviendo bugs reales bajo mentoring de un equipo senior.',
    tags: ['Laravel', 'APIs REST', 'Vue.js'],
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
  // Formación reglada. Un solo título, así que un objeto y no una
  // lista — si algún día hay más de uno, esto pasa a array sin
  // tocar AboutPanel.vue más que el v-for.
  education: {
    degree: 'Ingeniería de Sistemas',
    institution: 'Instituto Universitario Politécnico Santiago Mariño',
    year: '2023',
  },
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
  { id: 'linkedin', label: 'LinkedIn', value: 'in/salazar-william',    href: 'https://www.linkedin.com/in/salazar-william/' },
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
