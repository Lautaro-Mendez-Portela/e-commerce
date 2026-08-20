<script setup>
import AppIcon from "../ui/AppIcon.vue";

defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  detail: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "chart",
  },
  tone: {
    type: String,
    default: "primary",
  },
});
</script>

<template>
  <article class="stat-card" :class="`stat-card--${tone}`">
    <span class="stat-card__icon">
      <AppIcon :name="icon" size="22" />
    </span>

    <div>
      <p>{{ label }}</p>
      <strong>{{ value }}</strong>
      <span v-if="detail">{{ detail }}</span>
    </div>
  </article>
</template>
