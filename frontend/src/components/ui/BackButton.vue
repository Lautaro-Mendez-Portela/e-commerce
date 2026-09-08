<script setup>
import { useRouter } from "vue-router";

import AppIcon from "./AppIcon.vue";
import BaseButton from "./BaseButton.vue";

const props = defineProps({
  label: {
    type: String,
    default: "Volver",
  },
  fallbackTo: {
    type: [String, Object],
    default: () => ({ name: "products" }),
  },
});

const router = useRouter();

const goBack = () => {
  if (window.history.state?.back) {
    router.back();
    return;
  }

  router.push(props.fallbackTo);
};
</script>

<template>
  <BaseButton
    class="back-button"
    variant="outline"
    size="sm"
    :aria-label="label"
    @click="goBack"
  >
    <AppIcon name="arrow-left" size="18" />
    {{ label }}
  </BaseButton>
</template>
