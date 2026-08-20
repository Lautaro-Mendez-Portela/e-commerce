<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import AdminPageHeader from "./AdminPageHeader.vue";
import AppIcon from "../ui/AppIcon.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseInput from "../ui/BaseInput.vue";
import BaseSelect from "../ui/BaseSelect.vue";
import BaseSkeleton from "../ui/BaseSkeleton.vue";
import PaginationControls from "../ui/PaginationControls.vue";
import { apiClient } from "../../services/apiClient";
import { useFeedbackStore } from "../../stores/feedbackStore";

const route = useRoute();
const router = useRouter();
const feedbackStore = useFeedbackStore();

const products = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const stockInputs = reactive({});
const savingIds = ref(new Set());
const filters = reactive({
  search: "",
  stockFilter: "ALL",
});
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

const stockFilterOptions = [
  {
    value: "ALL",
    label: "Todos",
  },
  {
    value: "LOW",
    label: "Stock bajo",
  },
  {
    value: "OUT",
    label: "Sin stock",
  },
];

const isSaving = (id) => savingIds.value.has(id);

const setSaving = (id, saving) => {
  const nextIds = new Set(savingIds.value);

  if (saving) {
    nextIds.add(id);
  } else {
    nextIds.delete(id);
  }

  savingIds.value = nextIds;
};

const syncStockInputs = () => {
  products.value.forEach((product) => {
    stockInputs[product.id] = product.stock;
  });
};

const loadInventory = async (page = pagination.value.page) => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await apiClient.get("/products/admin", {
      query: {
        page,
        limit: pagination.value.limit,
        search: filters.search,
        status: "ALL",
        stockFilter: filters.stockFilter,
        sort: filters.stockFilter === "ALL" ? "stock_asc" : "name_asc",
      },
    });

    products.value = data.data || [];
    pagination.value = data.pagination || pagination.value;
    syncStockInputs();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const updateStock = async (product) => {
  const stock = Number(stockInputs[product.id]);

  if (!Number.isInteger(stock) || stock < 0) {
    feedbackStore.error("El stock debe ser un entero no negativo");
    return;
  }

  try {
    setSaving(product.id, true);

    await apiClient.patch(`/products/${product.id}/stock`, {
      stock,
    });

    feedbackStore.success("Stock actualizado");
    await loadInventory(pagination.value.page);
  } catch (error) {
    feedbackStore.error(error.message);
  } finally {
    setSaving(product.id, false);
  }
};

const applyFilters = () => {
  router.push({
    name: "admin-inventory",
    query: {
      search: filters.search || undefined,
      stockFilter: filters.stockFilter === "ALL" ? undefined : filters.stockFilter,
    },
  });
};

const clearFilters = () => {
  filters.search = "";
  filters.stockFilter = "ALL";
  router.push({ name: "admin-inventory" });
};

const changePage = (page) => {
  loadInventory(page);
};

watch(
  () => route.query,
  () => {
    filters.search = typeof route.query.search === "string" ? route.query.search : "";
    filters.stockFilter = typeof route.query.stockFilter === "string"
      ? route.query.stockFilter
      : "ALL";
    loadInventory(1);
  },
  {
    deep: true,
  }
);

onMounted(() => {
  filters.search = typeof route.query.search === "string" ? route.query.search : "";
  filters.stockFilter = typeof route.query.stockFilter === "string"
    ? route.query.stockFilter
    : "ALL";
  loadInventory();
});
</script>

<template>
  <section class="admin-view">
    <AdminPageHeader
      title="Inventario"
      description="Ajusta stock de forma explicita. El backend impide valores negativos."
    />

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <section class="admin-filter-panel">
      <BaseInput v-model="filters.search" label="Buscar producto" />
      <BaseSelect v-model="filters.stockFilter" label="Stock" :options="stockFilterOptions" />
      <BaseButton @click="applyFilters">Filtrar</BaseButton>
      <BaseButton variant="secondary" @click="clearFilters">Limpiar</BaseButton>
    </section>

    <section v-if="loading" class="admin-card-list" aria-label="Cargando inventario">
      <BaseSkeleton
        v-for="index in 4"
        :key="`inventory-row-${index}`"
        height="86px"
        rounded="lg"
      />
    </section>

    <section v-else-if="products.length === 0" class="empty-state">
      <AppIcon name="package" size="42" />
      <h2>Sin productos para este filtro</h2>
      <p>Proba con otro filtro de stock o limpia la busqueda.</p>
      <BaseButton variant="outline" @click="clearFilters">
        Limpiar filtros
      </BaseButton>
    </section>

    <section v-else class="admin-resource-table" aria-label="Inventario">
      <div class="admin-resource-row admin-resource-row--header">
        <span>Producto</span>
        <span>Stock actual</span>
        <span>Estado</span>
        <span>Ajuste</span>
      </div>

      <article
        v-for="product in products"
        :key="product.id"
        class="admin-resource-row"
      >
        <div class="resource-product">
          <span class="resource-product__placeholder">
            <AppIcon name="package" size="22" />
          </span>
          <div>
            <strong>{{ product.name }}</strong>
            <span>#{{ product.id }}</span>
          </div>
        </div>

        <span>{{ product.stock }} u.</span>
        <span
          class="resource-status"
          :class="product.stock === 0 ? 'resource-status--inactive' : product.stock <= 5 ? 'resource-status--warning' : 'resource-status--active'"
        >
          {{ product.stock === 0 ? "Sin stock" : product.stock <= 5 ? "Stock bajo" : "Stock OK" }}
        </span>

        <form class="inventory-adjustment" @submit.prevent="updateStock(product)">
          <BaseInput
            v-model="stockInputs[product.id]"
            label="Nuevo stock"
            type="number"
            min="0"
            numeric
          />
          <BaseButton
            type="submit"
            size="sm"
            :loading="isSaving(product.id)"
          >
            Guardar
          </BaseButton>
        </form>
      </article>
    </section>

    <PaginationControls
      v-if="pagination.total > 0"
      :pagination="pagination"
      @change-page="changePage"
    />
  </section>
</template>
