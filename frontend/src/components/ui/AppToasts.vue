<script setup>
import { storeToRefs } from "pinia";

import AppIcon from "./AppIcon.vue";
import { useFeedbackStore } from "../../stores/feedbackStore";

const feedbackStore = useFeedbackStore();
const { toasts } = storeToRefs(feedbackStore);
</script>

<template>
  <div class="toast-region" aria-live="polite" aria-relevant="additions">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.type}`"
    >
      <AppIcon
        :name="toast.type === 'error' ? 'warning' : toast.type === 'success' ? 'check' : 'info'"
        size="18"
      />
      <p>{{ toast.message }}</p>
      <button
        type="button"
        class="toast__close"
        aria-label="Cerrar notificacion"
        @click="feedbackStore.dismiss(toast.id)"
      >
        <AppIcon name="close" size="16" />
      </button>
    </div>
  </div>
</template>
