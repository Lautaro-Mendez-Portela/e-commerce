<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import AccountLayout from "../components/account/AccountLayout.vue";
import OrderStatusBadge from "../components/orders/OrderStatusBadge.vue";
import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSkeleton from "../components/ui/BaseSkeleton.vue";
import PaginationControls from "../components/ui/PaginationControls.vue";
import { orderService } from "../services/orderService";
import { useFeedbackStore } from "../stores/feedbackStore";
import { formatCurrency, formatDate } from "../utils/formatters";

const route = useRoute();
const router = useRouter();
const feedbackStore = useFeedbackStore();

const orders = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const pagination = ref({
  page: 1,
  limit: 6,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

const filters = [
  {
    label: "Todos",
    value: "ALL",
  },
  {
    label: "En curso",
    value: "IN_PROGRESS",
  },
  {
    label: "Entregados",
    value: "DELIVERED",
  },
  {
    label: "Cancelados o no completados",
    value: "CANCELLED",
  },
];

const activeStatusGroup = computed(() => {
  return typeof route.query.statusGroup === "string"
    ? route.query.statusGroup
    : "ALL";
});

const activePage = computed(() => {
  const page = Number(route.query.page || 1);

  return Number.isInteger(page) && page > 0 ? page : 1;
});

const countItems = (order) => {
  return (order.items || []).reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);
};

const itemLabel = (order) => {
  const totalItems = countItems(order);

  return totalItems === 1 ? "1 producto" : `${totalItems} productos`;
};

const loadOrders = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const response = await orderService.getMyOrders({
      page: activePage.value,
      limit: pagination.value.limit,
      statusGroup: activeStatusGroup.value,
    });

    orders.value = response.data || [];
    pagination.value = response.pagination || pagination.value;
  } catch (error) {
    errorMessage.value = "No pudimos cargar tus pedidos.";
    feedbackStore.error(error.message);
  } finally {
    loading.value = false;
  }
};

const setFilter = (statusGroup) => {
  router.push({
    name: "orders",
    query: statusGroup === "ALL"
      ? {}
      : {
          statusGroup,
        },
  });
};

const changePage = (page) => {
  router.push({
    name: "orders",
    query: {
      ...route.query,
      page,
    },
  });
};

watch(
  () => route.query,
  () => {
    loadOrders();
  },
  {
    deep: true,
  }
);

onMounted(() => {
  loadOrders();
});
</script>

<template>
  <AccountLayout>
    <section class="account-stack">
      <div class="orders-toolbar">
        <div class="segmented-control" role="group" aria-label="Filtrar pedidos">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            :class="{ active: activeStatusGroup === filter.value }"
            @click="setFilter(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
      </p>

      <section v-if="loading" class="orders-list" aria-label="Cargando pedidos">
        <article
          v-for="index in 3"
          :key="`order-skeleton-${index}`"
          class="order-card"
        >
          <BaseSkeleton height="24px" width="36%" />
          <BaseSkeleton height="20px" width="50%" />
          <BaseSkeleton height="44px" rounded="lg" />
        </article>
      </section>

      <section v-else-if="orders.length === 0" class="empty-state">
        <AppIcon name="receipt" size="42" />
        <h2>Todavia no realizaste compras</h2>
        <p>Cuando completes una compra, vas a ver el estado de tu pedido aca.</p>
        <RouterLink :to="{ name: 'products' }">
          <BaseButton>
            Explorar productos
          </BaseButton>
        </RouterLink>
      </section>

      <section v-else class="orders-list" aria-label="Historial de pedidos">
        <article
          v-for="order in orders"
          :key="order.id"
          class="order-card"
        >
          <div class="order-card__header">
            <div>
              <p class="eyebrow">Pedido #{{ order.id }}</p>
              <h2>{{ formatDate(order.createdAt) }}</h2>
            </div>

            <OrderStatusBadge :status="order.status" />
          </div>

          <div class="order-card__summary">
            <span>{{ itemLabel(order) }}</span>
            <strong>{{ formatCurrency(order.total) }}</strong>
          </div>

          <RouterLink
            class="summary-link-button"
            :to="{ name: 'order-detail', params: { id: order.id } }"
          >
            Ver pedido
          </RouterLink>
        </article>
      </section>

      <PaginationControls
        v-if="pagination.total > 0"
        :pagination="pagination"
        @change-page="changePage"
      />
    </section>
  </AccountLayout>
</template>
