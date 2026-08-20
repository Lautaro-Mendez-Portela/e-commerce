<script setup>
defineProps({
  height: {
    type: String,
    default: "1rem",
  },
  width: {
    type: String,
    default: "100%",
  },
  rounded: {
    type: String,
    default: "md",
  },
});
</script>

<template>
  <span
    class="base-skeleton"
    :class="`base-skeleton--${rounded}`"
    :style="{ height, width }"
    aria-hidden="true"
  />
</template>
