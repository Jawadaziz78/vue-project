import '@/scss/app.scss'
import { createApp } from 'vue'
//import * as bootstrap from 'bootstrap'
import DefaultLayout from '@/layouts/default/Default.vue'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

app.component('LayoutDefault', DefaultLayout)
app.use(router)
app.mount('#app')
