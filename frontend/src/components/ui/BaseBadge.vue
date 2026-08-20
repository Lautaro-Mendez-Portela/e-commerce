<script setup>
defineProps({
  tone: {
    type: String,
    default: "primary",
  },
});
</script>

<template>
  <span class="base-badge" :class="`base-badge--${tone}`">
    <slot />
  </span>
</template>
