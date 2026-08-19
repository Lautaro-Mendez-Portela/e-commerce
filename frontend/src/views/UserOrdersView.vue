<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import PaginationControls from "../components/admin/PaginationControls.vue";
import { apiClient } from "../services/apiClient";

const route = useRoute();
const profile = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const ordersPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

const selectedOrderId = computed(() => {
  return route.params.id ? Number(route.params.id) : null;
});

const selectedOrder = computed(() => {
  if (!selectedOrderId.value || !profile.value?.orders) {
    return null;
  }

  return profile.value.orders.find((order) => order.id === selectedOrderId.value);
});

const getOrderTotal = (order) => {
  if (!order.items) return 0;

  return order.items.reduce((total, item) => {
    return total + item.quantity * Number(item.price);
  }, 0);
};

const getOrders = async (page = ordersPagination.value.page) => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await apiClient.get("/users/me", {
      query: {
        page,
        limit: ordersPagination.value.limit,
      },
    });

    profile.value = data;
    ordersPagination.value = data.ordersPagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const changeOrdersPage = async (page) => {
  await getOrders(page);
};

watch(
  () => route.params.id,
  () => {
    if (!profile.value) {
      return;
    }

    getOrders(ordersPagination.value.page);
  }
);

onMounted(() => {
  getOrders();
});
</script>

<template>
  <main class="profile-section">
    <h2>Mis ordenes</h2>

    <p v-if="loading">Cargando ordenes...</p>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <section v-if="selectedOrderId && selectedOrder" class="profile-card order-detail">
      <h3>Orden #{{ selectedOrder.id }}</h3>
      <p><strong>Estado:</strong> {{ selectedOrder.status }}</p>
      <p><strong>Total:</strong> ${{ getOrderTotal(selectedOrder).toFixed(2) }}</p>
      <p>
        <strong>Fecha:</strong>
        {{ new Date(selectedOrder.createdAt).toLocaleDateString() }}
      </p>
    </section>

    <p
      v-if="selectedOrderId && profile && !selectedOrder"
      class="empty-cart"
    >
      La orden solicitada no aparece en esta pagina del historial.
    </p>

    <section v-if="profile && !loading">
      <p v-if="profile.orders.length === 0" class="empty-cart">
        No tienes compras registradas
      </p>

      <div v-else class="admin-list">
        <div class="admin-row admin-header">
          <span>ID</span>
          <span>Estado</span>
          <span>Total</span>
          <span>Fecha</span>
        </div>

        <RouterLink
          v-for="order in profile.orders"
          :key="order.id"
          class="admin-row"
          :to="{ name: 'order-detail', params: { id: order.id } }"
        >
          <span>{{ order.id }}</span>
          <span>{{ order.status }}</span>
          <span>${{ getOrderTotal(order).toFixed(2) }}</span>
          <span>{{ new Date(order.createdAt).toLocaleDateString() }}</span>
        </RouterLink>
      </div>

      <PaginationControls
        v-if="ordersPagination.total > 0"
        :pagination="ordersPagination"
        @change-page="changeOrdersPage"
      />
    </section>
  </main>
</template>
