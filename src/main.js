import '@/scss/app.scss'
// FIX: Import directly for side-effects (avoids "unused variable" error)
import 'bootstrap'
import { createApp } from 'vue'
import DefaultLayout from '@/layouts/default/Default.vue'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

app.component('LayoutDefault', DefaultLayout)
app.use(router)
app.mount('#app')
