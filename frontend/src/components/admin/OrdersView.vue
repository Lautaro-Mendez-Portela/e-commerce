<script setup>
import { onMounted, ref, watch } from "vue";
import PaginationControls from "./PaginationControls.vue";
import { apiClient } from "../../services/apiClient";

const orders = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const statusFilter = ref("ALL");
const dateFrom = ref("");
const dateTo = ref("");
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

const getOrders = async (page = pagination.value.page) => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await apiClient.get("/orders", {
      query: {
        page,
        limit: pagination.value.limit,
        status: statusFilter.value,
        dateFrom: dateFrom.value,
        dateTo: dateTo.value,
      },
    });

    orders.value = data.data;
    pagination.value = data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const changePage = async (page) => {
  await getOrders(page);
};

watch(statusFilter, () => {
  getOrders(1);
});

const applyFilters = async () => {
  await getOrders(1);
};

const clearFilters = async () => {
  statusFilter.value = "ALL";
  dateFrom.value = "";
  dateTo.value = "";

  await getOrders(1);
};

const getOrderTotal = (order) => {
  if (!order.items) return 0;

  return order.items.reduce((total, item) => {
    return total + item.quantity * Number(item.price);
  }, 0);
};

onMounted(() => {
  getOrders();
});
</script>

<template>
  <section>
    <h3>Ordenes</h3>

    <p v-if="loading">Cargando ordenes...</p>

    <p v-if="errorMessage" style="color: red">
      {{ errorMessage }}
    </p>

    <div v-if="!loading && !errorMessage">
      <div class="admin-actions">
        <select v-model="statusFilter">
          <option value="ALL">Todas</option>
          <option value="PENDING">Pendientes</option>
          <option value="PAID">Pagadas</option>
        </select>

        <input v-model="dateFrom" type="date" />

        <input v-model="dateTo" type="date" />

        <button class="filter-btn" @click="applyFilters">
          Filtrar
        </button>

        <button class="clear-btn" @click="clearFilters">
          Limpiar
        </button>
      </div>

      <p>Total ordenes: {{ pagination.total }}</p>

      <div class="admin-list">
        <div class="admin-row admin-header">
          <span>ID</span>
          <span>Usuario</span>
          <span>Estado</span>
          <span>Total</span>
          <span>Fecha</span>
        </div>

        <div
          v-for="order in orders"
          :key="order.id"
          class="admin-row"
        >
          <span>{{ order.id }}</span>
          <span>{{ order.user?.email || "Sin usuario" }}</span>
          <span>{{ order.status }}</span>
          <span>${{ getOrderTotal(order).toFixed(2) }}</span>
          <span>{{ new Date(order.createdAt).toLocaleDateString() }}</span>
        </div>
      </div>

      <PaginationControls
        :pagination="pagination"
        @change-page="changePage"
      />
    </div>
  </section>
</template>
