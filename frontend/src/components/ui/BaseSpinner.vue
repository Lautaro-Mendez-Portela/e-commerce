<script setup>
defineProps({
  size: {
    type: String,
    default: "md",
  },
});
</script>

<template>
  <span
    class="base-spinner"
    :class="`base-spinner--${size}`"
    role="status"
    aria-label="Cargando"
  />
</template>
