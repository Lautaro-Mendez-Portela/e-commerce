<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import AccountLayout from "../components/account/AccountLayout.vue";
import OrderStatusBadge from "../components/orders/OrderStatusBadge.vue";
import OrderTimeline from "../components/orders/OrderTimeline.vue";
import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSkeleton from "../components/ui/BaseSkeleton.vue";
import { orderService } from "../services/orderService";
import { useFeedbackStore } from "../stores/feedbackStore";
import { formatCurrency, formatDateTime } from "../utils/formatters";

const route = useRoute();
const feedbackStore = useFeedbackStore();

const order = ref(null);
const loading = ref(false);
const errorMessage = ref("");

const SUCCESS_TIMELINE_STATUSES = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const SPECIAL_STATUS_CONTENT = {
  PENDING: {
    icon: "refresh",
    title: "Estamos esperando la confirmacion del pago",
    message: "Stripe puede tardar unos segundos en confirmar el pago. Podes refrescar el estado manualmente.",
    tone: "info",
  },
  CANCELLED: {
    icon: "warning",
    title: "Este pedido fue cancelado",
    message: "No se completo el pago para esta orden.",
    tone: "warning",
  },
  FAILED: {
    icon: "warning",
    title: "No pudimos completar esta compra",
    message: "El pago o la confirmacion de la orden no se completo correctamente.",
    tone: "danger",
  },
  REFUNDED: {
    icon: "refresh",
    title: "El pago fue reembolsado",
    message: "La orden no pudo completarse y el pago fue reembolsado.",
    tone: "warning",
  },
};

const orderId = computed(() => Number(route.params.id));
const orderItems = computed(() => order.value?.items || []);
const hasTimeline = computed(() => {
  return SUCCESS_TIMELINE_STATUSES.includes(order.value?.status);
});
const specialStatus = computed(() => {
  return SPECIAL_STATUS_CONTENT[order.value?.status] || null;
});
const itemCount = computed(() => {
  return orderItems.value.reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);
});

const loadOrder = async () => {
  if (!Number.isInteger(orderId.value) || orderId.value < 1) {
    errorMessage.value = "Pedido no valido.";
    return;
  }

  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await orderService.getOrderById(orderId.value);

    order.value = data;
    document.title = `Pedido #${data.id} | E-Commerce`;
  } catch (error) {
    order.value = null;
    errorMessage.value = error.status === 404
      ? "No encontramos este pedido en tu cuenta."
      : "No pudimos cargar el detalle del pedido.";
    feedbackStore.error(error.message);
  } finally {
    loading.value = false;
  }
};

watch(
  () => route.params.id,
  () => {
    loadOrder();
  }
);

onMounted(() => {
  loadOrder();
});
</script>

<template>
  <AccountLayout>
    <section class="account-stack">
      <section v-if="loading" class="order-detail-grid" aria-label="Cargando pedido">
        <div class="account-card stack">
          <BaseSkeleton height="30px" width="42%" />
          <BaseSkeleton height="22px" width="58%" />
          <BaseSkeleton height="120px" rounded="lg" />
        </div>

        <aside class="account-card stack">
          <BaseSkeleton height="28px" width="46%" />
          <BaseSkeleton height="86px" rounded="lg" />
        </aside>
      </section>

      <section v-else-if="errorMessage" class="empty-state">
        <AppIcon name="warning" size="42" />
        <h2>No pudimos cargar el pedido</h2>
        <p>{{ errorMessage }}</p>
        <div class="cluster">
          <BaseButton @click="loadOrder">
            Reintentar
          </BaseButton>
          <RouterLink :to="{ name: 'orders' }">
            <BaseButton variant="outline">
              Volver a mis pedidos
            </BaseButton>
          </RouterLink>
        </div>
      </section>

      <template v-else-if="order">
        <section class="order-detail-hero account-card">
          <div>
            <p class="eyebrow">Pedido #{{ order.id }}</p>
            <h2>{{ formatDateTime(order.createdAt) }}</h2>
            <p>{{ itemCount }} {{ itemCount === 1 ? "producto" : "productos" }}</p>
          </div>

          <OrderStatusBadge :status="order.status" />
        </section>

        <section class="order-detail-grid">
          <div class="account-stack">
            <OrderTimeline
              v-if="hasTimeline"
              :status="order.status"
            />

            <section
              v-else-if="specialStatus"
              class="order-state-panel"
              :class="`order-state-panel--${specialStatus.tone}`"
            >
              <span class="order-state-panel__icon">
                <AppIcon :name="specialStatus.icon" size="26" />
              </span>
              <div>
                <h2>{{ specialStatus.title }}</h2>
                <p>{{ specialStatus.message }}</p>
                <p v-if="order.refundedAt">
                  Reembolsado el {{ formatDateTime(order.refundedAt) }}.
                </p>
                <p v-if="order.cancelledAt">
                  Cancelado el {{ formatDateTime(order.cancelledAt) }}.
                </p>
                <BaseButton
                  v-if="order.status === 'PENDING'"
                  variant="outline"
                  size="sm"
                  :loading="loading"
                  @click="loadOrder"
                >
                  Refrescar estado
                </BaseButton>
              </div>
            </section>

            <section class="account-card">
              <h2>Productos</h2>

              <div class="order-items-list">
                <article
                  v-for="item in orderItems"
                  :key="item.id"
                  class="order-item-row"
                >
                  <img
                    v-if="item.product?.imageUrl"
                    :src="item.product.imageUrl"
                    :alt="item.productName || item.product.name"
                    loading="lazy"
                  />
                  <span v-else class="order-item-row__placeholder">
                    <AppIcon name="package" size="24" />
                  </span>

                  <div>
                    <h3>{{ item.productName || item.product?.name || "Producto" }}</h3>
                    <p>
                      {{ item.quantity }} x {{ formatCurrency(item.price) }}
                    </p>
                  </div>

                  <strong>{{ formatCurrency(item.subtotal) }}</strong>
                </article>
              </div>
            </section>
          </div>

          <aside class="order-detail-summary account-card">
            <h2>Resumen</h2>

            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{{ formatCurrency(order.total) }}</dd>
              </div>
              <div class="order-detail-summary__total">
                <dt>Total</dt>
                <dd>{{ formatCurrency(order.total) }}</dd>
              </div>
            </dl>

            <RouterLink
              class="summary-link-button"
              :to="{ name: 'orders' }"
            >
              Volver a mis pedidos
            </RouterLink>
          </aside>
        </section>
      </template>
    </section>
  </AccountLayout>
</template>
