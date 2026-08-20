<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";

import AdminPageHeader from "./AdminPageHeader.vue";
import AppIcon from "../ui/AppIcon.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseSkeleton from "../ui/BaseSkeleton.vue";
import ConfirmModal from "../ui/ConfirmModal.vue";
import OrderStatusBadge from "../orders/OrderStatusBadge.vue";
import OrderTimeline from "../orders/OrderTimeline.vue";
import { apiClient } from "../../services/apiClient";
import { useFeedbackStore } from "../../stores/feedbackStore";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

const route = useRoute();
const feedbackStore = useFeedbackStore();

const order = ref(null);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const nextStatus = ref("");

const ADMIN_TRANSITIONS = {
  PENDING: [
    {
      status: "CANCELLED",
      label: "Cancelar orden",
      tone: "danger",
    },
  ],
  PAID: [
    {
      status: "PROCESSING",
      label: "Pasar a preparacion",
      tone: "primary",
    },
  ],
  PROCESSING: [
    {
      status: "SHIPPED",
      label: "Marcar enviada",
      tone: "primary",
    },
  ],
  SHIPPED: [
    {
      status: "DELIVERED",
      label: "Marcar entregada",
      tone: "primary",
    },
  ],
};

const availableTransitions = computed(() => {
  return ADMIN_TRANSITIONS[order.value?.status] || [];
});

const selectedTransition = computed(() => {
  return availableTransitions.value.find((transition) => transition.status === nextStatus.value);
});

const customerName = computed(() => {
  if (!order.value?.user) {
    return "Cliente no disponible";
  }

  const firstName = order.value.user.firstName || "";
  const lastName = order.value.user.lastName || "";
  const name = `${firstName} ${lastName}`.trim();

  return name || "Cliente sin nombre";
});

const operationalDates = computed(() => {
  if (!order.value) {
    return [];
  }

  return [
    {
      label: "Creada",
      value: order.value.createdAt,
    },
    {
      label: "Actualizada",
      value: order.value.updatedAt,
    },
    {
      label: "Pagada",
      value: order.value.paidAt,
    },
    {
      label: "Cancelada",
      value: order.value.cancelledAt,
    },
    {
      label: "Reembolsada",
      value: order.value.refundedAt,
    },
  ].filter((item) => item.value);
});

const loadOrder = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    order.value = await apiClient.get(`/orders/admin/${route.params.id}`);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const askStatusChange = (status) => {
  nextStatus.value = status;
};

const changeStatus = async () => {
  if (!nextStatus.value || !order.value) {
    return;
  }

  try {
    saving.value = true;

    await apiClient.patch(`/orders/${order.value.id}/status`, {
      status: nextStatus.value,
    });

    feedbackStore.success("Estado de la orden actualizado");
    nextStatus.value = "";
    await loadOrder();
  } catch (error) {
    feedbackStore.error(error.message);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadOrder();
});
</script>

<template>
  <section class="admin-view">
    <AdminPageHeader
      title="Detalle de pedido"
      :description="order ? `Orden #${order.id}` : 'Cargando informacion del pedido.'"
    >
      <template #actions>
        <RouterLink
          class="base-button base-button--secondary base-button--md"
          :to="{ name: 'admin-orders' }"
        >
          <span class="base-button__content">
            Volver
          </span>
        </RouterLink>
      </template>
    </AdminPageHeader>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <section v-if="loading" class="admin-detail-grid" aria-label="Cargando pedido">
      <BaseSkeleton height="420px" rounded="lg" />
      <BaseSkeleton height="320px" rounded="lg" />
    </section>

    <section v-else-if="order" class="admin-detail-grid">
      <div class="admin-detail-main">
        <article class="admin-panel-card order-admin-hero">
          <div>
            <p class="eyebrow">Pedido</p>
            <h2>Orden #{{ order.id }}</h2>
            <p>{{ customerName }} · {{ order.user?.email || "Sin email" }}</p>
          </div>
          <OrderStatusBadge :status="order.status" />
        </article>

        <OrderTimeline
          v-if="['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)"
          :status="order.status"
        />

        <article
          v-else
          class="order-state-panel"
          :class="{
            'order-state-panel--warning': order.status === 'PENDING' || order.status === 'REFUNDED',
            'order-state-panel--danger': order.status === 'FAILED'
          }"
        >
          <span class="order-state-panel__icon">
            <AppIcon
              :name="order.status === 'FAILED' ? 'warning' : 'info'"
              size="24"
            />
          </span>
          <div>
            <h2>{{ order.status === "PENDING" ? "Pago pendiente" : "Seguimiento detenido" }}</h2>
            <p>
              Esta orden no tiene avance operativo hasta que el pago quede confirmado
              o se resuelva su estado final.
            </p>
          </div>
        </article>

        <article class="admin-panel-card">
          <header class="admin-card-header">
            <h2>Items</h2>
            <span>{{ order.items?.length || 0 }} productos</span>
          </header>

          <div class="order-items-list">
            <article
              v-for="item in order.items"
              :key="item.id"
              class="order-item-row"
            >
              <img
                v-if="item.product?.imageUrl"
                :src="item.product.imageUrl"
                :alt="item.productName || item.product?.name || 'Producto'"
                loading="lazy"
              />
              <span v-else class="order-item-row__placeholder">
                <AppIcon name="package" size="22" />
              </span>

              <div>
                <h3>{{ item.productName || item.product?.name || "Producto no disponible" }}</h3>
                <p>{{ item.quantity }} x {{ formatCurrency(item.price) }}</p>
              </div>

              <strong>{{ formatCurrency(item.subtotal) }}</strong>
            </article>
          </div>
        </article>
      </div>

      <aside class="admin-detail-side">
        <article class="admin-panel-card">
          <header class="admin-card-header">
            <h2>Resumen</h2>
            <OrderStatusBadge :status="order.status" />
          </header>

          <dl class="admin-detail-list">
            <div>
              <dt>Total</dt>
              <dd>{{ formatCurrency(order.total) }}</dd>
            </div>
            <div>
              <dt>Cliente</dt>
              <dd>{{ customerName }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ order.user?.email || "No disponible" }}</dd>
            </div>
            <div
              v-for="dateItem in operationalDates"
              :key="dateItem.label"
            >
              <dt>{{ dateItem.label }}</dt>
              <dd>{{ formatDateTime(dateItem.value) }}</dd>
            </div>
          </dl>
        </article>

        <article class="admin-panel-card">
          <header class="admin-card-header">
            <h2>Acciones</h2>
            <span>{{ availableTransitions.length ? "Cambios disponibles" : "Sin acciones" }}</span>
          </header>

          <div v-if="availableTransitions.length" class="admin-action-stack">
            <BaseButton
              v-for="transition in availableTransitions"
              :key="transition.status"
              :variant="transition.tone"
              block
              @click="askStatusChange(transition.status)"
            >
              {{ transition.label }}
            </BaseButton>
          </div>

          <p v-else class="muted-text">
            El estado actual no permite transiciones manuales desde el panel.
          </p>
        </article>
      </aside>

      <ConfirmModal
        :model-value="Boolean(nextStatus)"
        title="Actualizar estado"
        :message="`Confirmas cambiar la orden #${order.id} a ${selectedTransition?.label || nextStatus}?`"
        :confirm-label="selectedTransition?.label || 'Actualizar'"
        :danger="selectedTransition?.tone === 'danger'"
        :loading="saving"
        @update:model-value="nextStatus = $event ? nextStatus : ''"
        @confirm="changeStatus"
        @cancel="nextStatus = ''"
      />
    </section>
  </section>
</template>
