<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>

<script>
export default {
  name: 'App',
  computed: {
    layout() {
      return `layout-${this.$route.meta.layout || 'default'}`
    },
  },
}
</script>
