<script setup>
import { computed, onMounted, reactive, ref } from "vue";

import AdminPageHeader from "./AdminPageHeader.vue";
import AppIcon from "../ui/AppIcon.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseInput from "../ui/BaseInput.vue";
import BaseModal from "../ui/BaseModal.vue";
import BaseSelect from "../ui/BaseSelect.vue";
import BaseSkeleton from "../ui/BaseSkeleton.vue";
import BaseTextarea from "../ui/BaseTextarea.vue";
import ConfirmModal from "../ui/ConfirmModal.vue";
import PaginationControls from "../ui/PaginationControls.vue";
import { apiClient } from "../../services/apiClient";
import { useFeedbackStore } from "../../stores/feedbackStore";
import { formatCurrency } from "../../utils/formatters";

const feedbackStore = useFeedbackStore();

const products = ref([]);
const loading = ref(false);
const saving = ref(false);
const confirmLoading = ref(false);
const errorMessage = ref("");
const isProductModalOpen = ref(false);
const productToDeactivate = ref(null);
const editingProductId = ref(null);
const imageFailedIds = ref(new Set());
const filters = reactive({
  search: "",
  status: "ALL",
  sort: "newest",
});
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
const productForm = reactive({
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  stock: "",
});
const formErrors = reactive({});

const statusOptions = [
  {
    value: "ALL",
    label: "Todos",
  },
  {
    value: "ACTIVE",
    label: "Activos",
  },
  {
    value: "INACTIVE",
    label: "Inactivos",
  },
];

const sortOptions = [
  {
    value: "newest",
    label: "Mas recientes",
  },
  {
    value: "name_asc",
    label: "Nombre A-Z",
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
    value: "stock_asc",
    label: "Stock menor",
  },
];

const modalTitle = computed(() => {
  return editingProductId.value ? "Editar producto" : "Crear producto";
});

const resetForm = () => {
  editingProductId.value = null;
  productForm.name = "";
  productForm.description = "";
  productForm.imageUrl = "";
  productForm.price = "";
  productForm.stock = "";
  Object.keys(formErrors).forEach((key) => delete formErrors[key]);
};

const validateForm = () => {
  Object.keys(formErrors).forEach((key) => delete formErrors[key]);

  if (productForm.name.trim().length < 3) {
    formErrors.name = "El nombre debe tener al menos 3 caracteres.";
  }

  if (productForm.description.trim().length < 5) {
    formErrors.description = "La descripcion debe tener al menos 5 caracteres.";
  }

  if (!Number.isFinite(Number(productForm.price)) || Number(productForm.price) <= 0) {
    formErrors.price = "El precio debe ser mayor a 0.";
  }

  if (!Number.isInteger(Number(productForm.stock)) || Number(productForm.stock) < 0) {
    formErrors.stock = "El stock debe ser un entero no negativo.";
  }

  if (productForm.imageUrl.trim()) {
    try {
      new URL(productForm.imageUrl.trim());
    } catch {
      formErrors.imageUrl = "Ingresa una URL valida.";
    }
  }

  return Object.keys(formErrors).length === 0;
};

const getProducts = async (page = pagination.value.page) => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await apiClient.get("/products/admin", {
      query: {
        page,
        limit: pagination.value.limit,
        search: filters.search,
        status: filters.status,
        sort: filters.sort,
      },
    });

    products.value = data.data || [];
    pagination.value = data.pagination || pagination.value;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const openCreateForm = () => {
  resetForm();
  isProductModalOpen.value = true;
};

const startEdit = (product) => {
  resetForm();
  editingProductId.value = product.id;
  productForm.name = product.name || "";
  productForm.description = product.description || "";
  productForm.imageUrl = product.imageUrl || "";
  productForm.price = String(product.price || "");
  productForm.stock = String(product.stock ?? 0);
  isProductModalOpen.value = true;
};

const saveProduct = async () => {
  if (!validateForm() || saving.value) {
    return;
  }

  const payload = {
    name: productForm.name.trim(),
    description: productForm.description.trim(),
    imageUrl: productForm.imageUrl.trim(),
    price: Number(productForm.price),
    stock: Number(productForm.stock),
  };

  try {
    saving.value = true;
    errorMessage.value = "";

    if (editingProductId.value) {
      await apiClient.put(`/products/${editingProductId.value}`, payload);
      feedbackStore.success("Producto actualizado");
    } else {
      await apiClient.post("/products", payload);
      feedbackStore.success("Producto creado");
    }

    isProductModalOpen.value = false;
    await getProducts(editingProductId.value ? pagination.value.page : 1);
  } catch (error) {
    errorMessage.value = error.message;
    feedbackStore.error(error.message);
  } finally {
    saving.value = false;
  }
};

const askDeactivate = (product) => {
  productToDeactivate.value = product;
};

const deactivateProduct = async () => {
  if (!productToDeactivate.value) {
    return;
  }

  try {
    confirmLoading.value = true;

    await apiClient.delete(`/products/${productToDeactivate.value.id}`);
    feedbackStore.success("Producto desactivado");
    productToDeactivate.value = null;

    const nextPage =
      products.value.length === 1 && pagination.value.page > 1
        ? pagination.value.page - 1
        : pagination.value.page;

    await getProducts(nextPage);
  } catch (error) {
    feedbackStore.error(error.message);
  } finally {
    confirmLoading.value = false;
  }
};

const changePage = (page) => {
  getProducts(page);
};

const applyFilters = () => {
  getProducts(1);
};

const clearFilters = () => {
  filters.search = "";
  filters.status = "ALL";
  filters.sort = "newest";
  getProducts(1);
};

const markImageFailed = (productId) => {
  const nextIds = new Set(imageFailedIds.value);
  nextIds.add(productId);
  imageFailedIds.value = nextIds;
};

onMounted(() => {
  getProducts();
});
</script>

<template>
  <section class="admin-view">
    <AdminPageHeader
      title="Productos"
      description="Gestiona el catalogo visible y los productos historicos del ecommerce."
    >
      <template #actions>
        <BaseButton @click="openCreateForm">
          <AppIcon name="plus" size="18" />
          Agregar producto
        </BaseButton>
      </template>
    </AdminPageHeader>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <section class="admin-filter-panel">
      <BaseInput v-model="filters.search" label="Buscar producto" />
      <BaseSelect v-model="filters.status" label="Estado" :options="statusOptions" />
      <BaseSelect v-model="filters.sort" label="Orden" :options="sortOptions" />
      <BaseButton @click="applyFilters">Filtrar</BaseButton>
      <BaseButton variant="secondary" @click="clearFilters">Limpiar</BaseButton>
    </section>

    <section v-if="loading" class="admin-card-list" aria-label="Cargando productos">
      <BaseSkeleton
        v-for="index in 4"
        :key="`product-row-${index}`"
        height="92px"
        rounded="lg"
      />
    </section>

    <section v-else-if="products.length === 0" class="empty-state">
      <AppIcon name="package" size="42" />
      <h2>Sin productos para mostrar</h2>
      <p>Ajusta los filtros o crea un producto nuevo.</p>
      <div class="cluster">
        <BaseButton @click="openCreateForm">Crear producto</BaseButton>
        <BaseButton variant="outline" @click="clearFilters">Limpiar filtros</BaseButton>
      </div>
    </section>

    <section v-else class="admin-resource-table" aria-label="Productos">
      <div class="admin-resource-row admin-resource-row--header">
        <span>Producto</span>
        <span>Precio</span>
        <span>Stock</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>

      <article
        v-for="product in products"
        :key="product.id"
        class="admin-resource-row"
      >
        <div class="resource-product">
          <img
            v-if="product.imageUrl && !imageFailedIds.has(product.id)"
            :src="product.imageUrl"
            :alt="product.name"
            loading="lazy"
            @error="markImageFailed(product.id)"
          />
          <span v-else class="resource-product__placeholder">
            <AppIcon name="package" size="22" />
          </span>

          <div>
            <strong>{{ product.name }}</strong>
            <span>#{{ product.id }}</span>
          </div>
        </div>

        <span>{{ formatCurrency(product.price) }}</span>
        <span>{{ product.stock }} u.</span>
        <span
          class="resource-status"
          :class="product.isActive ? 'resource-status--active' : 'resource-status--inactive'"
        >
          {{ product.isActive ? "Activo" : "Inactivo" }}
        </span>

        <div class="admin-row-actions">
          <BaseButton variant="outline" size="sm" @click="startEdit(product)">
            <AppIcon name="edit" size="16" />
            Editar
          </BaseButton>

          <BaseButton
            v-if="product.isActive"
            variant="danger"
            size="sm"
            @click="askDeactivate(product)"
          >
            Desactivar
          </BaseButton>
        </div>
      </article>
    </section>

    <PaginationControls
      v-if="pagination.total > 0"
      :pagination="pagination"
      @change-page="changePage"
    />

    <BaseModal
      v-model="isProductModalOpen"
      :title="modalTitle"
      description="Completa los datos reales del producto. La imagen se guarda como URL."
      @close="resetForm"
    >
      <form class="admin-form-sections" @submit.prevent="saveProduct">
        <section>
          <h3>Informacion general</h3>
          <BaseInput
            v-model="productForm.name"
            label="Nombre"
            :error="formErrors.name"
          />
          <BaseTextarea
            v-model="productForm.description"
            label="Descripcion"
            :error="formErrors.description"
          />
        </section>

        <section>
          <h3>Precio</h3>
          <BaseInput
            v-model="productForm.price"
            label="Precio"
            type="number"
            min="0"
            :error="formErrors.price"
          />
        </section>

        <section>
          <h3>Inventario</h3>
          <BaseInput
            v-model="productForm.stock"
            label="Stock"
            type="number"
            min="0"
            :error="formErrors.stock"
          />
        </section>

        <section>
          <h3>Imagen</h3>
          <BaseInput
            v-model="productForm.imageUrl"
            label="URL de imagen"
            placeholder="https://..."
            :error="formErrors.imageUrl"
          />
          <img
            v-if="productForm.imageUrl"
            :src="productForm.imageUrl"
            alt="Vista previa"
            class="admin-form-image-preview"
          />
        </section>
      </form>

      <template #footer>
        <BaseButton variant="secondary" :disabled="saving" @click="isProductModalOpen = false">
          Cancelar
        </BaseButton>
        <BaseButton :loading="saving" @click="saveProduct">
          {{ editingProductId ? "Guardar cambios" : "Crear producto" }}
        </BaseButton>
      </template>
    </BaseModal>

    <ConfirmModal
      :model-value="Boolean(productToDeactivate)"
      title="Desactivar producto"
      :message="`El producto ${productToDeactivate?.name || ''} dejara de aparecer en el catalogo publico, pero seguira en admin e historial.`"
      confirm-label="Desactivar"
      :loading="confirmLoading"
      @update:model-value="productToDeactivate = $event ? productToDeactivate : null"
      @confirm="deactivateProduct"
      @cancel="productToDeactivate = null"
    />
  </section>
</template>
