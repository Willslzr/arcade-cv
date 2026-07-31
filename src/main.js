import { createApp } from 'vue'

// Orden importante: tokens → base → capa CRT.
// Las variables tienen que existir antes de que nadie las use.
import './assets/styles/tokens.css'
import './assets/styles/base.css'
import './assets/styles/crt.css'

import App from './App.vue'

createApp(App).mount('#app')
