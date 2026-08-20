<script setup>
import { computed, onMounted, ref } from "vue";

import AdminPageHeader from "./AdminPageHeader.vue";
import StatCard from "./StatCard.vue";
import OrderStatusBadge from "../orders/OrderStatusBadge.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseSelect from "../ui/BaseSelect.vue";
import BaseSkeleton from "../ui/BaseSkeleton.vue";
import { apiClient } from "../../services/apiClient";
import { formatCurrency, formatDate, formatDateTime } from "../../utils/formatters";

const dashboard = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const chartRange = ref("7");

const chartRangeOptions = [
  {
    value: "7",
    label: "Ultimos 7 dias",
  },
  {
    value: "30",
    label: "Ultimos 30 dias",
  },
];

const getDashboard = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    dashboard.value = await apiClient.get("/dashboard/admin");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const chartData = computed(() => {
  const days = Number(chartRange.value);

  return (dashboard.value?.dailySales || []).slice(-days);
});

const maxChartValue = computed(() => {
  return Math.max(
    ...chartData.value.map((item) => Number(item.total || 0)),
    1
  );
});

const statusEntries = computed(() => {
  const statusCounts = dashboard.value?.statusCounts || {};

  return Object.entries(statusCounts)
    .map(([status, count]) => ({
      status,
      count,
    }))
    .sort((first, second) => second.count - first.count);
});

const lastPurchaseTotal = computed(() => {
  if (!dashboard.value?.lastPurchase?.items) {
    return 0;
  }

  return dashboard.value.lastPurchase.items.reduce((total, item) => {
    return total + Number(item.subtotal || 0);
  }, 0);
});

onMounted(() => {
  getDashboard();
});
</script>

<template>
  <section class="admin-view">
    <AdminPageHeader
      title="Dashboard"
      description="Metricas operativas calculadas desde datos reales del e-commerce."
    >
      <template #actions>
        <BaseButton size="sm" :loading="loading" @click="getDashboard">
          Actualizar
        </BaseButton>
      </template>
    </AdminPageHeader>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <section v-if="loading" class="admin-stat-grid" aria-label="Cargando metricas">
      <BaseSkeleton
        v-for="index in 5"
        :key="`dashboard-stat-${index}`"
        height="112px"
        rounded="lg"
      />
    </section>

    <template v-else-if="dashboard">
      <section class="admin-stat-grid">
        <StatCard
          label="Ventas totales"
          :value="formatCurrency(dashboard.totalSales)"
          detail="PAID, PROCESSING, SHIPPED y DELIVERED"
          icon="chart"
          tone="success"
        />

        <StatCard
          label="Ventas ultimos 7 dias"
          :value="formatCurrency(dashboard.salesLast7Days)"
          detail="Excluye pendientes, fallidas, canceladas y reembolsadas"
          icon="chart"
        />

        <StatCard
          label="Pedidos"
          :value="dashboard.orderCount"
          :detail="`${dashboard.ordersLast7Days} en los ultimos 7 dias`"
          icon="receipt"
        />

        <StatCard
          label="Clientes activos"
          :value="dashboard.registeredUsers"
          detail="Usuarios habilitados"
          icon="users"
        />

        <StatCard
          label="Productos activos"
          :value="dashboard.productCount"
          :detail="`${dashboard.lowStockProducts.length} con stock bajo`"
          icon="package"
          tone="warning"
        />
      </section>

      <section class="admin-dashboard-grid">
        <article class="admin-panel-card admin-panel-card--wide">
          <div class="admin-card-header">
            <div>
              <h2>Ventas por dia</h2>
              <p>Revenue segun estados reales de venta.</p>
            </div>

            <BaseSelect
              v-model="chartRange"
              label="Rango"
              :options="chartRangeOptions"
            />
          </div>

          <div class="sales-chart" role="img" aria-label="Grafico de ventas por dia">
            <div
              v-for="item in chartData"
              :key="item.date"
              class="sales-chart__bar"
              :style="{ height: `${Math.max((Number(item.total || 0) / maxChartValue) * 100, 4)}%` }"
            >
              <span>{{ formatCurrency(item.total) }}</span>
              <small>{{ formatDate(item.date) }}</small>
            </div>
          </div>
        </article>

        <article class="admin-panel-card">
          <div class="admin-card-header">
            <div>
              <h2>Pedidos por estado</h2>
              <p>Distribucion completa del ciclo de ordenes.</p>
            </div>
          </div>

          <div v-if="statusEntries.length === 0" class="empty-compact">
            Sin pedidos registrados.
          </div>

          <div v-else class="status-distribution">
            <div
              v-for="entry in statusEntries"
              :key="entry.status"
              class="status-distribution__row"
            >
              <OrderStatusBadge :status="entry.status" />
              <strong>{{ entry.count }}</strong>
            </div>
          </div>
        </article>

        <article class="admin-panel-card">
          <div class="admin-card-header">
            <div>
              <h2>Stock bajo</h2>
              <p>Threshold: {{ dashboard.lowStockThreshold }} unidades.</p>
            </div>

            <RouterLink :to="{ name: 'admin-inventory', query: { stockFilter: 'LOW' } }">
              <BaseButton size="sm" variant="outline">
                Gestionar inventario
              </BaseButton>
            </RouterLink>
          </div>

          <div v-if="dashboard.lowStockProducts.length === 0" class="empty-compact">
            No hay productos con stock bajo.
          </div>

          <div v-else class="compact-resource-list">
            <RouterLink
              v-for="product in dashboard.lowStockProducts"
              :key="product.id"
              :to="{ name: 'admin-inventory', query: { search: product.name } }"
            >
              <span>{{ product.name }}</span>
              <strong>{{ product.stock }} u.</strong>
            </RouterLink>
          </div>
        </article>

        <article class="admin-panel-card">
          <div class="admin-card-header">
            <div>
              <h2>Ultima venta</h2>
              <p>Solo ventas confirmadas o en proceso operativo.</p>
            </div>
          </div>

          <div v-if="!dashboard.lastPurchase" class="empty-compact">
            Todavia no hay ventas reales.
          </div>

          <div v-else class="dashboard-detail-list">
            <p><span>Pedido</span><strong>#{{ dashboard.lastPurchase.id }}</strong></p>
            <p><span>Cliente</span><strong>{{ dashboard.lastPurchase.user?.email }}</strong></p>
            <p><span>Total</span><strong>{{ formatCurrency(lastPurchaseTotal || dashboard.lastPurchase.total) }}</strong></p>
            <p><span>Fecha</span><strong>{{ formatDateTime(dashboard.lastPurchase.createdAt) }}</strong></p>
          </div>
        </article>

        <article class="admin-panel-card">
          <div class="admin-card-header">
            <div>
              <h2>Producto mas vendido</h2>
              <p>Basado en cantidades vendidas reales.</p>
            </div>
          </div>

          <div v-if="!dashboard.topSellingProduct" class="empty-compact">
            Todavia no hay ventas suficientes.
          </div>

          <div v-else class="dashboard-detail-list">
            <p><span>Producto</span><strong>{{ dashboard.topSellingProduct.name }}</strong></p>
            <p><span>Unidades</span><strong>{{ dashboard.topSellingProduct.quantitySold }}</strong></p>
            <p><span>Precio actual</span><strong>{{ formatCurrency(dashboard.topSellingProduct.price) }}</strong></p>
            <p><span>Stock actual</span><strong>{{ dashboard.topSellingProduct.stock }}</strong></p>
          </div>
        </article>
      </section>
    </template>
  </section>
</template>
