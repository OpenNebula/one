<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { initTimezone } from './utils/timezone';

export default {
  name: 'App',
  mounted() {
    // Fetch server configuration
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        initTimezone(config);
        // Force reactivity if needed
        this.$forceUpdate();
      })
      .catch(() => {
        // Default to browser
        initTimezone({});
      });
  }
}
</script>
