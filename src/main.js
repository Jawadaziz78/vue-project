import '@/scss/app.scss'
import { createApp } from 'vue'
//import * as bootstrap from 'bootstrap'
// 1. IMPORT THE MISSING LAYOUT (This brings back Header/Footer)
import DefaultLayout from '@/layouts/default/Default.vue'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

// 2. Register the layout so App.vue can find it
app.component('LayoutDefault', DefaultLayout)

app.use(router)
app.mount('#app')
