import DefaultTheme from 'vitepress/theme'
import HomePortal from './HomePortal.vue'
import PublicLanding from './PublicLanding.vue'
import './style.css'
import './landing.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePortal', HomePortal)
    app.component('PublicLanding', PublicLanding)
  },
}
