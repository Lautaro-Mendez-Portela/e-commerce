<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const STATUS_CONTENT = {
  PENDING: {
    label: "Procesando pago",
    tone: "info",
  },
  PAID: {
    label: "Pago confirmado",
    tone: "success",
  },
  PROCESSING: {
    label: "Preparando pedido",
    tone: "info",
  },
  SHIPPED: {
    label: "Enviado",
    tone: "info",
  },
  DELIVERED: {
    label: "Entregado",
    tone: "success",
  },
  CANCELLED: {
    label: "Cancelado",
    tone: "neutral",
  },
  FAILED: {
    label: "Pago no completado",
    tone: "danger",
  },
  REFUNDED: {
    label: "Reembolsado",
    tone: "warning",
  },
};

const content = computed(() => {
  return STATUS_CONTENT[props.status] || {
    label: "Estado no disponible",
    tone: "neutral",
  };
});
</script>

<template>
  <span
    class="order-status-badge"
    :class="`order-status-badge--${content.tone}`"
  >
    {{ content.label }}
  </span>
</template>
