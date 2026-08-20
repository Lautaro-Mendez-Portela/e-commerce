<script setup>
import { onMounted, reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import AdminPageHeader from "./AdminPageHeader.vue";
import AppIcon from "../ui/AppIcon.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseInput from "../ui/BaseInput.vue";
import BaseSelect from "../ui/BaseSelect.vue";
import BaseSkeleton from "../ui/BaseSkeleton.vue";
import OrderStatusBadge from "../orders/OrderStatusBadge.vue";
import PaginationControls from "../ui/PaginationControls.vue";
import { apiClient } from "../../services/apiClient";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

const route = useRoute();
const router = useRouter();

const orders = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const filters = reactive({
  q: "",
  status: "ALL",
  dateFrom: "",
  dateTo: "",
});
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

const statusOptions = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Pagada" },
  { value: "PROCESSING", label: "Preparando" },
  { value: "SHIPPED", label: "Enviada" },
  { value: "DELIVERED", label: "Entregada" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "FAILED", label: "Fallida" },
  { value: "REFUNDED", label: "Reembolsada" },
];

const syncFiltersFromRoute = () => {
  filters.q = typeof route.query.q === "string" ? route.query.q : "";
  filters.status = typeof route.query.status === "string" ? route.query.status : "ALL";
  filters.dateFrom = typeof route.query.dateFrom === "string" ? route.query.dateFrom : "";
  filters.dateTo = typeof route.query.dateTo === "string" ? route.query.dateTo : "";
};

const loadOrders = async (page = pagination.value.page) => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await apiClient.get("/orders", {
      query: {
        page,
        limit: pagination.value.limit,
        q: filters.q.trim(),
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      },
    });

    orders.value = data.data || [];
    pagination.value = data.pagination || pagination.value;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const pushFilters = () => {
  router.push({
    name: "admin-orders",
    query: {
      q: filters.q.trim() || undefined,
      status: filters.status === "ALL" ? undefined : filters.status,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    },
  });
};

const applyFilters = () => {
  pushFilters();
  loadOrders(1);
};

const clearFilters = () => {
  filters.q = "";
  filters.status = "ALL";
  filters.dateFrom = "";
  filters.dateTo = "";
  router.push({ name: "admin-orders" });
  loadOrders(1);
};

const changePage = (page) => {
  loadOrders(page);
};

const customerName = (order) => {
  const firstName = order.user?.firstName || "";
  const lastName = order.user?.lastName || "";
  const name = `${firstName} ${lastName}`.trim();

  return name || "Cliente sin nombre";
};

onMounted(() => {
  syncFiltersFromRoute();
  loadOrders(Number(route.query.page) || 1);
});
</script>

<template>
  <section class="admin-view">
    <AdminPageHeader
      title="Pedidos"
      description="Monitorea pagos, estados y preparacion sin exponer detalles tecnicos de Stripe."
    />

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <section class="admin-filter-panel">
      <BaseInput
        v-model="filters.q"
        label="Buscar"
        placeholder="ID, email o cliente"
      />
      <BaseSelect v-model="filters.status" label="Estado" :options="statusOptions" />
      <BaseInput v-model="filters.dateFrom" label="Desde" type="date" />
      <BaseInput v-model="filters.dateTo" label="Hasta" type="date" />
      <BaseButton @click="applyFilters">Filtrar</BaseButton>
      <BaseButton variant="secondary" @click="clearFilters">Limpiar</BaseButton>
    </section>

    <section v-if="loading" class="admin-card-list" aria-label="Cargando pedidos">
      <BaseSkeleton
        v-for="index in 4"
        :key="`order-row-${index}`"
        height="88px"
        rounded="lg"
      />
    </section>

    <section v-else-if="orders.length === 0" class="empty-state">
      <AppIcon name="receipt" size="42" />
      <h2>No hay pedidos para este filtro</h2>
      <p>Ajusta el estado, el rango de fechas o la busqueda.</p>
      <BaseButton variant="outline" @click="clearFilters">
        Limpiar filtros
      </BaseButton>
    </section>

    <section v-else class="admin-resource-table" aria-label="Pedidos">
      <div class="admin-resource-row admin-resource-row--header">
        <span>Pedido</span>
        <span>Cliente</span>
        <span>Estado</span>
        <span>Total</span>
        <span>Fecha</span>
        <span>Acciones</span>
      </div>

      <article
        v-for="order in orders"
        :key="order.id"
        class="admin-resource-row"
      >
        <div class="resource-product">
          <span class="resource-product__placeholder">
            <AppIcon name="receipt" size="22" />
          </span>
          <div>
            <strong>Orden #{{ order.id }}</strong>
            <span>{{ order.items?.length || 0 }} items</span>
          </div>
        </div>

        <div class="resource-stack">
          <strong>{{ customerName(order) }}</strong>
          <span>{{ order.user?.email || "Sin email" }}</span>
        </div>

        <OrderStatusBadge :status="order.status" />
        <span>{{ formatCurrency(order.total) }}</span>
        <span>{{ formatDateTime(order.createdAt) }}</span>

        <div class="admin-row-actions">
          <RouterLink
            class="base-button base-button--outline base-button--sm"
            :to="{ name: 'admin-order-detail', params: { id: order.id } }"
          >
            <span class="base-button__content">
              <AppIcon name="eye" size="16" />
              Ver
            </span>
          </RouterLink>
        </div>
      </article>
    </section>

    <PaginationControls
      v-if="pagination.total > 0"
      :pagination="pagination"
      @change-page="changePage"
    />
  </section>
</template>
