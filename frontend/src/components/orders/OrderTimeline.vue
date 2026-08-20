<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const steps = [
  {
    id: "PAID",
    label: "Pago confirmado",
    description: "Recibimos la confirmacion del pago.",
  },
  {
    id: "PROCESSING",
    label: "Preparando pedido",
    description: "El pedido esta en preparacion.",
  },
  {
    id: "SHIPPED",
    label: "Enviado",
    description: "El pedido fue enviado.",
  },
  {
    id: "DELIVERED",
    label: "Entregado",
    description: "El pedido figura como entregado.",
  },
];

const statusIndex = computed(() => {
  return steps.findIndex((step) => step.id === props.status);
});

const visibleSteps = computed(() => {
  return steps.map((step, index) => {
    if (statusIndex.value < 0) {
      return {
        ...step,
        state: "pending",
      };
    }

    if (index < statusIndex.value) {
      return {
        ...step,
        state: "complete",
      };
    }

    if (index === statusIndex.value) {
      return {
        ...step,
        state: props.status === "DELIVERED" ? "complete" : "active",
      };
    }

    return {
      ...step,
      state: "pending",
    };
  });
});

const stateLabel = (state) => {
  if (state === "complete") {
    return "Completado";
  }

  if (state === "active") {
    return "Actual";
  }

  return "Pendiente";
};
</script>

<template>
  <section class="order-timeline" aria-labelledby="order-timeline-title">
    <h2 id="order-timeline-title">Seguimiento</h2>

    <ol>
      <li
        v-for="step in visibleSteps"
        :key="step.id"
        :class="`order-timeline__step order-timeline__step--${step.state}`"
      >
        <span class="order-timeline__marker" aria-hidden="true" />

        <div>
          <strong>{{ step.label }}</strong>
          <span>{{ stateLabel(step.state) }}</span>
          <p>{{ step.description }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>
