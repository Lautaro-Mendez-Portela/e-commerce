<script setup>
import BackButton from "../components/ui/BackButton.vue";
</script>

<template>
  <div class="auth-shell">
    <div class="auth-shell__back">
      <BackButton />
    </div>

    <RouterView />
  </div>
</template>
