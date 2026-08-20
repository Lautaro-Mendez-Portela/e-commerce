<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSkeleton from "../components/ui/BaseSkeleton.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import { orderService } from "../services/orderService";
import { useCartStore } from "../stores/cartStore";

const route = useRoute();
const cartStore = useCartStore();

const order = ref(null);
const loading = ref(false);
const polling = ref(false);
const pollTimedOut = ref(false);
const errorMessage = ref("");
const cartRefreshed = ref(false);
const pollAttempts = ref(0);

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 12;

let pollTimeout = null;

const rawOrderId = computed(() => {
  const value = route.query.orderId;
  return Array.isArray(value) ? value[0] : value;
});

const sessionId = computed(() => {
  const value = route.query.session_id;
  return Array.isArray(value) ? value[0] : value;
});

const orderId = computed(() => Number(rawOrderId.value));
const hasValidOrderId = computed(() => {
  return Number.isInteger(orderId.value) && orderId.value > 0;
});

const orderItems = computed(() => order.value?.items || []);
const orderTotal = computed(() => Number(order.value?.total || 0));
const formattedTotal = computed(() => orderTotal.value.toFixed(2));

const confirmedStatuses = new Set([
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
]);

const statusContent = computed(() => {
  const status = order.value?.status;

  if (status === "PAID") {
    return {
      icon: "check",
      tone: "success",
      title: "Pago confirmado",
      message: "Tu pago fue confirmado y la orden quedo registrada.",
    };
  }

  if (status === "PROCESSING") {
    return {
      icon: "package",
      tone: "success",
      title: "Tu pedido esta siendo preparado",
      message: "La compra esta confirmada y el pedido ya esta en preparacion.",
    };
  }

  if (status === "SHIPPED") {
    return {
      icon: "package",
      tone: "success",
      title: "Tu pedido fue enviado",
      message: "La compra esta confirmada y el pedido ya salio de preparacion.",
    };
  }

  if (status === "DELIVERED") {
    return {
      icon: "check",
      tone: "success",
      title: "Pedido entregado",
      message: "La compra esta confirmada y el pedido figura como entregado.",
    };
  }

  if (status === "FAILED") {
    return {
      icon: "warning",
      tone: "danger",
      title: "No pudimos completar el pedido",
      message: "El pago no pudo confirmarse correctamente para esta orden.",
    };
  }

  if (status === "REFUNDED") {
    return {
      icon: "refresh",
      tone: "warning",
      title: "El pago fue reembolsado",
      message: "La orden no pudo completarse y el pago fue reembolsado.",
    };
  }

  if (status === "CANCELLED") {
    return {
      icon: "warning",
      tone: "warning",
      title: "La sesion de pago fue cancelada",
      message: "La orden quedo cancelada y no se completo el pago.",
    };
  }

  return {
    icon: "refresh",
    tone: "info",
    title: "Estamos confirmando tu pago",
    message: pollTimedOut.value
      ? "El pago esta siendo procesado. Podes revisar el estado desde Mis pedidos."
      : "Stripe redirigio correctamente, pero el webhook puede tardar unos segundos.",
  };
});

const formatPrice = (value) => Number(value || 0).toFixed(2);

const refreshCartWhenConfirmed = async (status) => {
  if (!confirmedStatuses.has(status) || cartRefreshed.value) {
    return;
  }

  cartRefreshed.value = true;
  await cartStore.loadCart().catch(() => {});
};

const stopPolling = () => {
  if (pollTimeout) {
    window.clearTimeout(pollTimeout);
    pollTimeout = null;
  }

  polling.value = false;
};

const loadOrder = async ({ silent = false } = {}) => {
  if (!hasValidOrderId.value) {
    errorMessage.value = "No encontramos la referencia de la orden.";
    return null;
  }

  try {
    if (!silent) {
      loading.value = true;
    }

    const data = await orderService.getOrderById(orderId.value);

    if (
      sessionId.value &&
      data.stripeCheckoutSessionId &&
      data.stripeCheckoutSessionId !== sessionId.value
    ) {
      errorMessage.value = "La referencia de pago no coincide con esta orden.";
      stopPolling();
      return null;
    }

    order.value = data;
    errorMessage.value = "";

    await refreshCartWhenConfirmed(data.status);

    return data;
  } catch (err) {
    errorMessage.value = err.message;
    stopPolling();
    return null;
  } finally {
    if (!silent) {
      loading.value = false;
    }
  }
};

const schedulePolling = () => {
  if (!order.value || order.value.status !== "PENDING") {
    stopPolling();
    return;
  }

  if (pollAttempts.value >= MAX_POLL_ATTEMPTS) {
    pollTimedOut.value = true;
    stopPolling();
    return;
  }

  polling.value = true;
  pollTimeout = window.setTimeout(async () => {
    pollAttempts.value += 1;

    const latestOrder = await loadOrder({
      silent: true,
    });

    if (latestOrder?.status === "PENDING") {
      schedulePolling();
      return;
    }

    stopPolling();
  }, POLL_INTERVAL_MS);
};

onMounted(async () => {
  const initialOrder = await loadOrder();

  if (initialOrder?.status === "PENDING") {
    schedulePolling();
  }
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <main class="checkout-status page-shell">
    <section v-if="loading && !order" class="checkout-status-card">
      <BaseSkeleton height="42px" width="64px" rounded="lg" />
      <BaseSkeleton height="34px" width="52%" />
      <BaseSkeleton height="22px" />
      <BaseSkeleton height="120px" rounded="lg" />
    </section>

    <section v-else-if="errorMessage" class="empty-state">
      <AppIcon name="warning" size="42" />
      <h1>No pudimos consultar la orden</h1>
      <p>{{ errorMessage }}</p>
      <RouterLink :to="{ name: 'orders' }">
        <BaseButton>
          Ver mis pedidos
        </BaseButton>
      </RouterLink>
    </section>

    <template v-else-if="order">
      <section
        class="checkout-status-card"
        :class="`checkout-status-card--${statusContent.tone}`"
      >
        <span class="checkout-status-card__icon">
          <AppIcon :name="statusContent.icon" size="30" />
        </span>

        <p class="eyebrow">Orden #{{ order.id }}</p>
        <h1>{{ statusContent.title }}</h1>
        <p>{{ statusContent.message }}</p>

        <p v-if="polling" class="info-message cluster">
          <BaseSpinner size="sm" />
          Consultando estado del pago...
        </p>

        <div class="checkout-status-card__actions">
          <RouterLink :to="{ name: 'orders' }">
            <BaseButton>
              Ver mis pedidos
            </BaseButton>
          </RouterLink>

          <RouterLink
            v-if="order.status === 'FAILED' || order.status === 'REFUNDED'"
            :to="{ name: 'cart' }"
          >
            <BaseButton variant="outline">
              Volver al carrito
            </BaseButton>
          </RouterLink>

          <RouterLink
            v-else
            :to="{ name: 'products' }"
          >
            <BaseButton variant="outline">
              Seguir comprando
            </BaseButton>
          </RouterLink>
        </div>
      </section>

      <section class="checkout-panel">
        <div class="checkout-block">
          <h2>Detalle de la orden</h2>

          <div class="checkout-items">
            <article
              v-for="item in orderItems"
              :key="item.id"
              class="checkout-item"
            >
              <img
                v-if="item.product?.imageUrl"
                :src="item.product.imageUrl"
                :alt="item.productName || item.product?.name"
                loading="lazy"
              />
              <span v-else class="checkout-item__placeholder">
                <AppIcon name="package" size="24" />
              </span>

              <div>
                <h3>{{ item.productName || item.product?.name }}</h3>
                <p>{{ item.quantity }} x $ {{ formatPrice(item.price) }}</p>
              </div>

              <strong>$ {{ formatPrice(item.subtotal) }}</strong>
            </article>
          </div>
        </div>

        <div class="checkout-total-row">
          <span>Total</span>
          <strong>$ {{ formattedTotal }}</strong>
        </div>
      </section>
    </template>
  </main>
</template>
