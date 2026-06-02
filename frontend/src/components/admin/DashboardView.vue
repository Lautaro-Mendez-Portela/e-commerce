<script setup>
import { onMounted, ref } from "vue";

const API_URL = "http://localhost:3000";

const dashboard = ref(null);
const loading = ref(false);
const errorMessage = ref("");

const getToken = () => `Bearer ${localStorage.getItem("token")}`;

const formatMoney = (value) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
};

const getOrderTotal = (order) => {
  if (!order?.items) return 0;

  return order.items.reduce((total, item) => {
    return total + item.quantity * item.price;
  }, 0);
};

const getDashboard = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const response = await fetch(`${API_URL}/dashboard/admin`, {
      headers: {
        Authorization: getToken(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al obtener dashboard");
    }

    dashboard.value = data;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getDashboard();
});
</script>

<template>
  <section>
    <div class="products-header">
      <h3>Dashboard</h3>

      <button class="filter-btn" @click="getDashboard">
        Actualizar
      </button>
    </div>

    <p v-if="loading">Cargando dashboard...</p>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <div v-if="dashboard && !loading" class="dashboard-grid">
      <article class="dashboard-card">
        <span>Total de ventas</span>
        <strong>{{ formatMoney(dashboard.totalSales) }}</strong>
      </article>

      <article class="dashboard-card">
        <span>Cantidad de ordenes</span>
        <strong>{{ dashboard.orderCount }}</strong>
      </article>

      <article class="dashboard-card">
        <span>Usuarios registrados</span>
        <strong>{{ dashboard.registeredUsers }}</strong>
      </article>

      <article class="dashboard-card warning-card">
        <span>Productos con bajo stock</span>
        <strong>{{ dashboard.lowStockProducts.length }}</strong>
      </article>
    </div>

    <div v-if="dashboard && !loading" class="dashboard-panels">
      <section class="profile-card">
        <h3>Avisos de bajo stock</h3>

        <p
          v-if="dashboard.lowStockProducts.length === 0"
          class="empty-cart"
        >
          No hay productos con bajo stock
        </p>

        <div v-else class="admin-list compact-list">
          <div class="admin-row admin-header">
            <span>Producto</span>
            <span>Stock</span>
          </div>

          <div
            v-for="product in dashboard.lowStockProducts"
            :key="product.id"
            class="admin-row"
          >
            <span>{{ product.name }}</span>
            <span>{{ product.stock }}</span>
          </div>
        </div>
      </section>

      <section class="profile-card">
        <h3>Ultima compra del sitio</h3>

        <p v-if="!dashboard.lastPurchase" class="empty-cart">
          Todavia no hay compras pagadas
        </p>

        <div v-else class="dashboard-detail">
          <p><strong>Orden:</strong> #{{ dashboard.lastPurchase.id }}</p>
          <p>
            <strong>Usuario:</strong>
            {{ dashboard.lastPurchase.user?.email || "Sin usuario" }}
          </p>
          <p>
            <strong>Total:</strong>
            {{ formatMoney(getOrderTotal(dashboard.lastPurchase)) }}
          </p>
          <p>
            <strong>Fecha:</strong>
            {{ new Date(dashboard.lastPurchase.createdAt).toLocaleString() }}
          </p>
        </div>
      </section>

      <section class="profile-card">
        <h3>Producto mas vendido</h3>

        <p v-if="!dashboard.topSellingProduct" class="empty-cart">
          Todavia no hay ventas pagadas
        </p>

        <div v-else class="dashboard-detail">
          <p><strong>Producto:</strong> {{ dashboard.topSellingProduct.name }}</p>
          <p>
            <strong>Unidades vendidas:</strong>
            {{ dashboard.topSellingProduct.quantitySold }}
          </p>
          <p>
            <strong>Precio actual:</strong>
            {{ formatMoney(dashboard.topSellingProduct.price) }}
          </p>
          <p><strong>Stock actual:</strong> {{ dashboard.topSellingProduct.stock }}</p>
        </div>
      </section>
    </div>
  </section>
</template>
