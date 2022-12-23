import { templates } from './components/templates.tpl.js';
import { initializeCache } from './cache.js'

initializeCache()

document.body.appendChild(templates.bouncer());