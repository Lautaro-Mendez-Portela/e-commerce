<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import PaginationControls from "../components/admin/PaginationControls.vue";
import ProductCard from "../components/products/ProductCard.vue";
import ProductCardSkeleton from "../components/products/ProductCardSkeleton.vue";
import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseInput from "../components/ui/BaseInput.vue";
import BaseSelect from "../components/ui/BaseSelect.vue";
import { productService } from "../services/productService";

const route = useRoute();
const router = useRouter();

const DEFAULT_SORT = "newest";
const PRODUCT_LIMIT = 12;
const SORT_VALUES = ["newest", "price_asc", "price_desc", "name_asc"];

const sortOptions = [
  {
    value: "newest",
    label: "Mas recientes",
  },
  {
    value: "price_asc",
    label: "Precio menor",
  },
  {
    value: "price_desc",
    label: "Precio mayor",
  },
  {
    value: "name_asc",
    label: "Nombre",
  },
];

const availabilityOptions = [
  {
    value: "",
    label: "Todos",
  },
  {
    value: "true",
    label: "Disponibles",
  },
  {
    value: "false",
    label: "Sin stock",
  },
];

const products = ref([]);
const filters = ref({
  search: "",
  minPrice: "",
  maxPrice: "",
  inStock: "",
  sort: DEFAULT_SORT,
});
const loading = ref(false);
const errorMessage = ref("");
const isFiltersOpen = ref(false);
const pagination = ref({
  page: 1,
  limit: PRODUCT_LIMIT,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

let debounceTimer = null;
let syncingFromRoute = false;

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.value.search ||
    filters.value.minPrice ||
    filters.value.maxPrice ||
    filters.value.inStock ||
    filters.value.sort !== DEFAULT_SORT
  );
});

const resultLabel = computed(() => {
  const total = pagination.value.total;

  if (total === 1) {
    return "1 producto encontrado";
  }

  return `${total} productos encontrados`;
});

const normalizeRouteFilters = () => {
  const sort = typeof route.query.sort === "string" &&
    SORT_VALUES.includes(route.query.sort)
    ? route.query.sort
    : DEFAULT_SORT;

  const inStock = route.query.inStock === "true" ||
    route.query.inStock === "false"
    ? route.query.inStock
    : "";

  return {
    page: Math.max(Number(route.query.page) || 1, 1),
    search: typeof route.query.search === "string" ? route.query.search : "",
    minPrice: typeof route.query.minPrice === "string" ? route.query.minPrice : "",
    maxPrice: typeof route.query.maxPrice === "string" ? route.query.maxPrice : "",
    inStock,
    sort,
  };
};

const buildQuery = (page = 1) => {
  const query = {};

  if (filters.value.search.trim()) {
    query.search = filters.value.search.trim();
  }

  if (filters.value.minPrice !== "") {
    query.minPrice = filters.value.minPrice;
  }

  if (filters.value.maxPrice !== "") {
    query.maxPrice = filters.value.maxPrice;
  }

  if (filters.value.inStock !== "") {
    query.inStock = filters.value.inStock;
  }

  if (filters.value.sort !== DEFAULT_SORT) {
    query.sort = filters.value.sort;
  }

  if (page > 1) {
    query.page = String(page);
  }

  return query;
};

const fetchProducts = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const response = await productService.getProducts({
      page: pagination.value.page,
      limit: PRODUCT_LIMIT,
      search: filters.value.search.trim() || undefined,
      minPrice: filters.value.minPrice || undefined,
      maxPrice: filters.value.maxPrice || undefined,
      inStock: filters.value.inStock || undefined,
      sort: filters.value.sort,
    });

    products.value = response.data || [];
    pagination.value = response.pagination;
  } catch (error) {
    products.value = [];
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const syncFromRoute = async () => {
  const nextFilters = normalizeRouteFilters();

  syncingFromRoute = true;
  filters.value = {
    search: nextFilters.search,
    minPrice: nextFilters.minPrice,
    maxPrice: nextFilters.maxPrice,
    inStock: nextFilters.inStock,
    sort: nextFilters.sort,
  };
  pagination.value.page = nextFilters.page;
  await nextTick();
  syncingFromRoute = false;

  await fetchProducts();
};

const replaceQuery = (page = 1) => {
  router.push({
    name: "products",
    query: buildQuery(page),
  });
};

const applyFilters = () => {
  isFiltersOpen.value = false;
  replaceQuery(1);
};

const clearFilters = () => {
  filters.value = {
    search: "",
    minPrice: "",
    maxPrice: "",
    inStock: "",
    sort: DEFAULT_SORT,
  };

  router.push({
    name: "products",
    query: {},
  });
};

const changePage = (page) => {
  replaceQuery(page);
};

watch(
  () => route.query,
  () => {
    syncFromRoute();
  },
  {
    immediate: true,
  }
);

watch(
  () => filters.value.search,
  () => {
    if (syncingFromRoute) {
      return;
    }

    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      replaceQuery(1);
    }, 350);
  }
);

watch(
  () => [
    filters.value.minPrice,
    filters.value.maxPrice,
    filters.value.inStock,
    filters.value.sort,
  ],
  () => {
    if (syncingFromRoute) {
      return;
    }

    replaceQuery(1);
  }
);
</script>

<template>
  <main class="catalog-page page-shell">
    <header class="catalog-header">
      <div class="page-header">
        <p class="eyebrow">Catalogo</p>
        <h1>Explora productos</h1>
        <p>
          Busca, filtra y ordena productos con resultados reales desde el backend.
        </p>
      </div>

      <div class="catalog-toolbar">
        <p>{{ resultLabel }}</p>

        <BaseSelect
          v-model="filters.sort"
          label="Ordenar"
          :options="sortOptions"
        />

        <BaseButton
          class="filters-toggle"
          variant="outline"
          @click="isFiltersOpen = true"
        >
          <AppIcon name="filter" size="18" />
          Filtros
        </BaseButton>
      </div>
    </header>

    <div
      v-if="isFiltersOpen"
      class="filters-backdrop"
      @click="isFiltersOpen = false"
    />

    <section class="catalog-layout">
      <aside class="filters-panel" :class="{ 'is-open': isFiltersOpen }">
        <div class="filters-panel__header">
          <h2>Filtros</h2>
          <button
            type="button"
            class="filters-close"
            aria-label="Cerrar filtros"
            @click="isFiltersOpen = false"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <BaseInput
          v-model="filters.search"
          label="Buscar"
          type="search"
          placeholder="Nombre o descripcion"
        />

        <BaseInput
          v-model="filters.minPrice"
          label="Precio minimo"
          type="number"
          min="0"
        />

        <BaseInput
          v-model="filters.maxPrice"
          label="Precio maximo"
          type="number"
          min="0"
        />

        <BaseSelect
          v-model="filters.inStock"
          label="Disponibilidad"
          :options="availabilityOptions"
        />

        <div class="filters-panel__actions">
          <BaseButton @click="applyFilters">
            Aplicar filtros
          </BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="!hasActiveFilters"
            @click="clearFilters"
          >
            Limpiar
          </BaseButton>
        </div>
      </aside>

      <section class="catalog-results">
        <p v-if="errorMessage" class="error">
          {{ errorMessage }}
        </p>

        <div v-if="loading" class="products-grid">
          <ProductCardSkeleton
            v-for="index in 8"
            :key="`catalog-skeleton-${index}`"
          />
        </div>

        <section
          v-else-if="!errorMessage && products.length === 0"
          class="empty-state"
        >
          <AppIcon name="search" size="36" />
          <h2>No encontramos productos</h2>
          <p>Proba ajustar la busqueda o limpiar los filtros aplicados.</p>
          <BaseButton
            variant="outline"
            :disabled="!hasActiveFilters"
            @click="clearFilters"
          >
            Limpiar filtros
          </BaseButton>
        </section>

        <div v-else class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <PaginationControls
          v-if="!loading && !errorMessage && pagination.totalPages > 1"
          :pagination="pagination"
          @change-page="changePage"
        />
      </section>
    </section>
  </main>
</template>
