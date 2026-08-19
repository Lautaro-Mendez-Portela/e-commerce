<script setup>
import { onMounted, ref } from "vue";
import PaginationControls from "./admin/PaginationControls.vue";
import { apiClient } from "../services/apiClient";

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

const getOrderTotal = (order) => {
  if (!order.items) return 0;

  return order.items.reduce((total, item) => {
    return total + item.quantity * Number(item.price);
  }, 0);
};

const getProfile = async (page = ordersPagination.value.page) => {
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
  await getProfile(page);
};

onMounted(() => {
  getProfile();
});
</script>

<template>
  <main class="profile-section">
    <h2>Mi perfil</h2>

    <p v-if="loading">Cargando perfil...</p>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <div v-if="profile && !loading" class="profile-layout">
      <section class="profile-card">
        <h3>Datos del usuario</h3>

        <p><strong>Nombre:</strong> {{ profile.firstName }}</p>
        <p><strong>Apellido:</strong> {{ profile.lastName }}</p>
        <p><strong>Email:</strong> {{ profile.email }}</p>
        <p><strong>Rol:</strong> {{ profile.role }}</p>
        <p>
          <strong>Fecha de registro:</strong>
          {{ new Date(profile.createdAt).toLocaleDateString() }}
        </p>
      </section>

      <section>
        <h3>Historial de compras</h3>

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

          <div
            v-for="order in profile.orders"
            :key="order.id"
            class="admin-row"
          >
            <span>{{ order.id }}</span>
            <span>{{ order.status }}</span>
            <span>${{ getOrderTotal(order).toFixed(2) }}</span>
            <span>{{ new Date(order.createdAt).toLocaleDateString() }}</span>
          </div>
        </div>

        <PaginationControls
          v-if="ordersPagination.total > 0"
          :pagination="ordersPagination"
          @change-page="changeOrdersPage"
        />
      </section>
    </div>
  </main>
</template>
