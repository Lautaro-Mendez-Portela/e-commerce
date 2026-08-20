<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";

import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import { useCartStore } from "../stores/cartStore";

const route = useRoute();
const cartStore = useCartStore();

const orderId = computed(() => {
  const value = route.query.orderId;
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(rawValue);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
});

onMounted(() => {
  cartStore.loadCart().catch(() => {});
});
</script>

<template>
  <main class="checkout-status page-shell">
    <section class="checkout-status-card checkout-status-card--warning">
      <span class="checkout-status-card__icon">
        <AppIcon name="warning" size="30" />
      </span>

      <p class="eyebrow">
        Pago cancelado
      </p>

      <h1>El pago no se completo</h1>
      <p>
        No se desconto stock por esta operacion. Podes volver al carrito o seguir explorando productos.
      </p>

      <p v-if="orderId" class="checkout-status-card__note">
        Referencia de orden #{{ orderId }}.
      </p>

      <div class="checkout-status-card__actions">
        <RouterLink :to="{ name: 'cart' }">
          <BaseButton>
            Volver al carrito
          </BaseButton>
        </RouterLink>

        <RouterLink :to="{ name: 'products' }">
          <BaseButton variant="outline">
            Seguir comprando
          </BaseButton>
        </RouterLink>
      </div>
    </section>
  </main>
</template>
