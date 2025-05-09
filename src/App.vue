<template>
  <div id="app">
    <nav>
      <router-link to="/player">Player</router-link> |
      <router-link to="/gm">GM</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* Global app styling */
#app {
  max-width: none;
  padding: 20px;
}

h1 {
  margin: 0 0 1rem;
  font-size: 20pt;
}

/* Ensure body background fits full screen */
body {
  margin: 0;
}
</style>
