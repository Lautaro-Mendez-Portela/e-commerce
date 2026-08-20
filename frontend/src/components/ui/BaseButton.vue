<script setup>
import BaseSpinner from "./BaseSpinner.vue";

defineProps({
  variant: {
    type: String,
    default: "primary",
  },
  size: {
    type: String,
    default: "md",
  },
  type: {
    type: String,
    default: "button",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <button
    class="base-button"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--block': block }
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-label="ariaLabel || undefined"
  >
    <BaseSpinner v-if="loading" size="sm" />
    <span class="base-button__content" :class="{ 'is-loading': loading }">
      <slot />
    </span>
  </button>
</template>
