/**
 * translations.js — todas las palabras y párrafos del CV en los dos
 * idiomas soportados.
 *
 * Alcance deliberado: sólo el CV (identidad, stack, proyectos,
 * experiencia, sobre mí, contacto, navegación). El juego —HUD,
 * pantalla de resultados, ranking— se queda en español siempre; por
 * eso `HudBar.vue`, `GameCanvas.vue` y los componentes de
 * `components/game/` no aparecen aquí ni importan nada de este
 * fichero.
 *
 * Dos bloques con propósitos distintos:
 *
 *   `ui`      — texto de interfaz que vive hoy escrito a mano en las
 *               plantillas (etiquetas, pistas de sección, estados
 *               vacíos). No sale de `profile.js` porque no es
 *               contenido del CV, es cómo se presenta.
 *
 *   `content` — la traducción de los campos de `profile.js` que SÍ
 *               son contenido (biografía, notas del stack, el
 *               impacto de cada puesto...). Se indexa por el mismo
 *               `id`/`label` que usa `profile.js`, nunca por
 *               posición en el array: así un cambio de orden en los
 *               datos no desincroniza la traducción.
 *
 * `useLocale.js` es quien combina esto con `profile.js`; este
 * fichero no importa nada de Vue ni de `profile.js` a propósito —
 * es sólo texto.
 */

export const SUPPORTED_LOCALES = ['es', 'en']
export const DEFAULT_LOCALE = 'es'

export const ui = {
  es: {
    skip: 'Saltar al contenido',
    nav: {
      ariaLabel: 'Secciones del CV',
      stages: {
        proyectos: 'Proyectos',
        experiencia: 'Experiencia',
        sobreMi: 'Sobre mí',
        contacto: 'Contacto',
      },
    },
    hints: {
      proyectos: 'Qué problema resolvía cada uno y cómo. Filtra por tecnología si buscas algo concreto.',
      experiencia: 'Cada puesto con el resultado que dejó, no con la lista de tareas.',
      sobreMi: 'Cómo trabajo y qué hago cuando no trabajo.',
      contacto: 'Respondo en menos de 24 h.',
    },
    hero: {
      insertCoin: 'Insert coin — 1 crédito',
      start: 'Pulsa start',
      nivel: 'Nivel',
      base: 'Base',
      clase: 'Clase',
      claseValor: 'Analista / Dev',
      avatarAriaLabel: (name) => `Iniciar el juego. Avatar de ${name}`,
    },
    stack: {
      title: 'Stack principal',
    },
    projects: {
      filterAll: 'Todos',
      filterAriaLabel: 'Filtrar proyectos por tecnología',
      problema: 'Problema',
      solucion: 'Solución',
      captureAlt: (name) => `Captura de ${name}`,
      empty: (tech) => `Ningún proyecto usa ${tech} todavía.`,
    },
    about: {
      formacion: 'Formación',
      fueraDelTrabajo: 'Fuera del trabajo',
      slot: (n) => `Slot ${n}`,
    },
    contact: {
      downloadCv: 'Descargar CV',
    },
    footer: {
      build: 'Build',
      line: (year) => `${year} · Vue 3 + Canvas 2D, sin librerías de juego`,
      hint: 'Pulsa el avatar para jugar · Escape para volver',
    },
    languageToggle: {
      switchTo: 'English',
      ariaLabel: 'Cambiar el CV a inglés',
    },
  },

  en: {
    skip: 'Skip to content',
    nav: {
      ariaLabel: 'CV sections',
      stages: {
        proyectos: 'Projects',
        experiencia: 'Experience',
        sobreMi: 'About me',
        contacto: 'Contact',
      },
    },
    hints: {
      proyectos: 'What problem each one solved and how. Filter by technology if you’re after something specific.',
      experiencia: 'Every role with the result it left behind, not a list of tasks.',
      sobreMi: 'How I work, and what I do when I’m not working.',
      contacto: 'I reply within 24 hours.',
    },
    hero: {
      insertCoin: 'Insert coin — 1 credit',
      start: 'Press start',
      nivel: 'Level',
      base: 'Base',
      clase: 'Class',
      claseValor: 'Analyst / Dev',
      avatarAriaLabel: (name) => `Start the game. Avatar of ${name}`,
    },
    stack: {
      title: 'Main Stack',
    },
    projects: {
      filterAll: 'All',
      filterAriaLabel: 'Filter projects by technology',
      problema: 'Problem',
      solucion: 'Solution',
      captureAlt: (name) => `Screenshot of ${name}`,
      empty: (tech) => `No project uses ${tech} yet.`,
    },
    about: {
      formacion: 'Education',
      fueraDelTrabajo: 'Outside work',
      slot: (n) => `Slot ${n}`,
    },
    contact: {
      downloadCv: 'Download CV',
    },
    footer: {
      build: 'Build',
      line: (year) => `${year} · Vue 3 + Canvas 2D, no game libraries`,
      hint: 'Press the avatar to play · Escape to go back',
    },
    languageToggle: {
      switchTo: 'Español',
      ariaLabel: 'Switch the CV to Spanish',
    },
  },
}

/**
 * Traducciones de contenido, indexadas igual que `profile.js`:
 *   - `stackColumns` por id de columna y luego por `label` de la
 *     tecnología (el label es la clave estable: no cambia entre
 *     idiomas porque son nombres propios).
 *   - `experience` y `projects` por su `id`.
 *   - `about` con la misma forma que `profile.js`, pero sólo los
 *     campos que se traducen.
 *
 * Lo que NO aparece aquí (nombres de empresas, tecnologías, años,
 * enlaces) se toma tal cual de `profile.js` en ambos idiomas: son
 * nombres propios o datos, no prosa.
 */
export const content = {
  es: {
    // La versión "es" está vacía a propósito: profile.js YA está en
    // español, así que no hay nada que sobreescribir. Sólo existe
    // para que useLocale.js tenga una rama simétrica a "en".
    identity: {},
    glitchScript: {},
    stackColumns: {},
    experience: {},
    projects: {},
    about: {},
  },

  en: {
    identity: {
      role: 'Requirements Analyst & Developer',
      tagline: 'I translate business needs into software that holds up.',
    },

    glitchScript: {
      analystWord: 'ANALYST',
      nameTo: 'SYSTEM COMPROMISED',
      roleTo: 'DESTROY THE INVADERS. SAVE THE PLANET.',
    },

    stackColumns: {
      back: {
        Laravel: 'Eloquent, queues, authorization policies, testing with Pest',
        PHP: 'Gradual typing, OOP, Composer',
        'Node.js': 'REST APIs, serverless functions, scripting',
        Livewire: 'Reactive components without leaving Blade',
      },
      front: {
        'Vue.js': 'Composition API, SFC, composables, Pinia',
        JavaScript: 'ES2023, async, DOM and Canvas 2D',
        HTML: 'Semantics and accessibility',
        CSS: 'Flexbox, Grid, animations',
      },
      database: {
        PostgreSQL: 'JSONB, materialized views, zero-downtime migrations',
        SQL: 'Modeling, indexes, execution plans',
        Redis: 'Cache and sorted sets — this site’s leaderboard runs on it',
      },
      misc: {
        Git: 'Version control, branching workflows',
        Docker: 'Containers for reproducible environments',
        Azure: 'Pipelines and deployment',
        Jira: 'Agile task management',
      },
    },

    experience: {
      'exp-linktic-qa-ssr': {
        role: 'Semi-Senior QA Analyst',
        org: 'LinkTic (Remote)',
        to: 'Present',
        impact: 'I translate business requirements into user stories and test cases, and automate regression testing with Puppeteer — less manual QA time on every release.',
        tags: ['Requirements analysis', 'QA', 'Puppeteer', 'Automation'],
      },
      'exp-linktic-tester': {
        role: 'Junior Tester',
        org: 'LinkTic (Remote)',
        impact: 'I ran and documented test cases, validated fixes, and automated regression testing with Puppeteer — laying the groundwork for the process I now maintain as a semi-senior.',
        tags: ['Testing', 'Puppeteer', 'Automation', 'Bug documentation'],
      },
      'exp-nerdcom': {
        role: 'Fullstack Developer',
        org: 'NerdCom SRL (Remote)',
        impact: 'I implemented an end-to-end multilingual system and redesigned entire modules of the application (Livewire + Metronic 7), working directly with the product owner on UI and usability changes.',
        tags: ['Livewire', 'Metronic 7', 'Fullstack', 'i18n'],
      },
      'exp-shokworks': {
        role: 'Backend Developer Trainee',
        org: 'Shokworks, Inc (Remote)',
        impact: 'I built services and APIs in Laravel and reusable components in Vue.js — my first professional experience fixing real bugs under a senior team’s mentorship.',
        tags: ['Laravel', 'REST APIs', 'Vue.js'],
      },
    },

    projects: {
      'arcade-cv': {
        summary: 'This very site: a résumé that turns into a shoot’em up.',
        problem: 'Just another portfolio doesn’t get remembered. I wanted the technical demo to be the site itself, not a screenshot of some other project.',
        detail: 'A game engine built from scratch on Canvas 2D: a loop with clamped deltaTime, AABB collisions, projectile pooling, and a 128×128 texture atlas served in a single request.',
        links: ['View code'],
      },
      'proyecto-2': {
        summary: 'A sentence explaining what it does, readable by a business person.',
        problem: 'What hurt before it existed. Be specific: a number or a situation, not “improving processes”.',
        detail: 'How you solved it. This is where you can get technical: architecture, decisions, and why.',
        links: [],
      },
      'proyecto-3': {
        summary: 'Another short sentence. If it doesn’t fit in a tweet, the project isn’t well told.',
        problem: 'The starting problem.',
        detail: 'The solution and what you learned.',
        links: [],
      },
    },

    about: {
      bio: [
        'I started on the analysis side: understanding what someone actually needs before writing a line of code. I still think that’s where a project is won or lost.',
        'I code mostly in Laravel, and I enjoy the part nobody sees: the data model, queries that don’t time out, code someone else can still read a year from now.',
      ],
      education: {
        degree: 'Systems Engineering',
      },
      hobbies: {
        h1: { label: 'Retro video games', detail: '90s shoot’em ups. That’s where this site came from.' },
        h2: { label: 'Pixel art', detail: 'I drew the game’s sprites myself, pixel by pixel.' },
        h3: { label: 'Change this', detail: 'Put something real: music, cooking, running, whatever.' },
      },
      principles: [
        'I’d rather ask twice than redo something once.',
        'Code nobody understands isn’t finished.',
        'If it can’t be measured, I don’t know if I’ve improved it.',
      ],
    },
  },
}
