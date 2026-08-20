<script setup>
import { computed } from "vue";

import AppIcon from "../ui/AppIcon.vue";
import BaseButton from "../ui/BaseButton.vue";

const props = defineProps({
  subtotal: {
    type: Number,
    default: 0,
  },
  itemCount: {
    type: Number,
    default: 0,
  },
  primaryLabel: {
    type: String,
    default: "",
  },
  primaryLoadingLabel: {
    type: String,
    default: "Procesando...",
  },
  primaryLoading: {
    type: Boolean,
    default: false,
  },
  primaryDisabled: {
    type: Boolean,
    default: false,
  },
  secondaryLabel: {
    type: String,
    default: "",
  },
  secondaryTo: {
    type: [Object, String],
    default: null,
  },
  trustText: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["primary"]);

const formattedSubtotal = computed(() => Number(props.subtotal || 0).toFixed(2));
const itemLabel = computed(() => {
  return props.itemCount === 1 ? "1 producto" : `${props.itemCount} productos`;
});
</script>

<template>
  <aside class="order-summary" aria-label="Resumen del pedido">
    <div class="order-summary__header">
      <h2>Resumen</h2>
      <span>{{ itemLabel }}</span>
    </div>

    <dl class="order-summary__totals">
      <div>
        <dt>Subtotal</dt>
        <dd>$ {{ formattedSubtotal }}</dd>
      </div>
      <div class="order-summary__total">
        <dt>Total</dt>
        <dd>$ {{ formattedSubtotal }}</dd>
      </div>
    </dl>

    <p v-if="trustText" class="order-summary__trust">
      <AppIcon name="lock" size="17" />
      {{ trustText }}
    </p>

    <div class="order-summary__actions">
      <BaseButton
        v-if="primaryLabel"
        size="lg"
        block
        :loading="primaryLoading"
        :disabled="primaryDisabled"
        @click="emit('primary')"
      >
        {{ primaryLoading ? primaryLoadingLabel : primaryLabel }}
      </BaseButton>

      <RouterLink
        v-if="secondaryLabel && secondaryTo"
        class="summary-link-button"
        :to="secondaryTo"
      >
        {{ secondaryLabel }}
      </RouterLink>
    </div>
  </aside>
</template>
