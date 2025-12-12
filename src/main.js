import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import '@/scss/app.scss' 
// FIX: Import directly for side-effects (avoids "unused variable" error)
import 'bootstrap' 
import DefaultLayout from '@/layouts/default/Default.vue'

const app = createApp(App)

app.component('layout-default', DefaultLayout)
app.use(router)
app.mount('#app')
