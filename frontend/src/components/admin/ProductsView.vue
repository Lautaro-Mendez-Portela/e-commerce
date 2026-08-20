<script setup>
import { onMounted, ref } from "vue";
import PaginationControls from "./PaginationControls.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseInput from "../ui/BaseInput.vue";
import BaseSpinner from "../ui/BaseSpinner.vue";
import BaseTextarea from "../ui/BaseTextarea.vue";
import { apiClient } from "../../services/apiClient";
import { useFeedbackStore } from "../../stores/feedbackStore";

const feedbackStore = useFeedbackStore();

const products = ref([]);
const editingProductId = ref(null);
const showForm = ref(false);
const filters = ref({
  name: "",
  minPrice: "",
  maxPrice: "",
});
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

const productForm = ref({
  name: "",
  description: "",
  imageUrl: "",
  price: 0,
  stock: 0,
});

const handleImageUpload = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    errorMessage.value = "Selecciona un archivo de imagen";
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    productForm.value.imageUrl = reader.result;
  };

  reader.readAsDataURL(file);
};

const removeImage = () => {
  productForm.value.imageUrl = "";
};

const getProducts = async (page = pagination.value.page) => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await apiClient.get("/products", {
      auth: false,
      query: {
        page,
        limit: pagination.value.limit,
        name: filters.value.name,
        minPrice: filters.value.minPrice,
        maxPrice: filters.value.maxPrice,
      },
    });

    products.value = data.data;
    pagination.value = data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const changePage = async (page) => {
  await getProducts(page);
};

const applyFilters = async () => {
  await getProducts(1);
};

const clearFilters = async () => {
  filters.value = {
    name: "",
    minPrice: "",
    maxPrice: "",
  };

  await getProducts(1);
};

const resetForm = () => {
  productForm.value = {
    name: "",
    description: "",
    imageUrl: "",
    price: 0,
    stock: 0,
  };

  editingProductId.value = null;
};

const openCreateForm = () => {
  resetForm();
  showForm.value = true;
};

const saveProduct = async () => {
  try {
    errorMessage.value = "";
    successMessage.value = "";

    const isEditing = editingProductId.value !== null;

    if (isEditing) {
      await apiClient.put(
        `/products/${editingProductId.value}`,
        productForm.value
      );
    } else {
      await apiClient.post("/products", productForm.value);
    }

    resetForm();
    showForm.value = false;

    await getProducts(isEditing ? pagination.value.page : 1);

    successMessage.value = isEditing
      ? "Producto actualizado"
      : "Producto creado";
    feedbackStore.success(successMessage.value);
  } catch (error) {
    errorMessage.value = error.message;
    feedbackStore.error(error.message);
  }
};

const startEdit = (product) => {
  showForm.value = true;
  editingProductId.value = product.id;

  productForm.value = {
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl || "",
    price: product.price,
    stock: product.stock,
  };
};

const cancelEdit = () => {
  resetForm();
  showForm.value = false;
};

const deleteProduct = async (id) => {
  const confirmed = confirm("Eliminar este producto?");

  if (!confirmed) return;

  try {
    errorMessage.value = "";
    successMessage.value = "";

    await apiClient.delete(`/products/${id}`);

    const nextPage =
      products.value.length === 1 && pagination.value.page > 1
        ? pagination.value.page - 1
        : pagination.value.page;

    await getProducts(nextPage);
    successMessage.value = "Producto eliminado";
    feedbackStore.success(successMessage.value);
  } catch (error) {
    errorMessage.value = error.message;
    feedbackStore.error(error.message);
  }
};

onMounted(() => {
  getProducts();
});
</script>

<template>
  <section>
    <div class="products-header">
      <h3>Productos</h3>

      <BaseButton @click="openCreateForm">
        + Agregar Producto
      </BaseButton>
    </div>

    <p v-if="loading" class="info-message cluster">
      <BaseSpinner size="sm" />
      Cargando productos...
    </p>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <p v-if="successMessage" class="success">
      {{ successMessage }}
    </p>

    <div class="filters-bar">
      <BaseInput
        v-model="filters.name"
        label="Buscar por nombre"
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

      <BaseButton @click="applyFilters">
        Filtrar
      </BaseButton>

      <BaseButton variant="secondary" @click="clearFilters">
        Limpiar
      </BaseButton>
    </div>

    <div v-if="showForm" class="admin-panel">
      <h3>
        {{ editingProductId ? "Editar Producto" : "Crear Producto" }}
      </h3>

      <BaseInput
        v-model="productForm.name"
        label="Nombre"
        placeholder="Nombre del producto"
      />

      <BaseTextarea
        v-model="productForm.description"
        label="Descripcion"
        placeholder="Descripcion del producto"
      />

      <label class="form-field">
        <span>Foto</span>
        <input
          type="file"
          accept="image/*"
          @change="handleImageUpload"
        />
      </label>

      <div v-if="productForm.imageUrl" class="image-preview-row">
        <img
          :src="productForm.imageUrl"
          class="product-form-preview"
          alt="Vista previa del producto"
        />

        <BaseButton variant="secondary" @click="removeImage">
          Quitar foto
        </BaseButton>
      </div>

      <BaseInput
        v-model="productForm.price"
        label="Precio"
        type="number"
        numeric
      />

      <BaseInput
        v-model="productForm.stock"
        label="Stock"
        type="number"
        numeric
      />

      <div class="form-actions">
        <BaseButton @click="saveProduct">
          {{ editingProductId ? "Guardar cambios" : "Crear Producto" }}
        </BaseButton>

        <BaseButton variant="secondary" @click="cancelEdit">
          Cancelar
        </BaseButton>
      </div>
    </div>

    <p>Total productos: {{ pagination.total }}</p>

    <div class="admin-list">
      <div class="admin-header">
        <span>ID</span>
        <span>Nombre</span>
        <span>Precio</span>
        <span>Stock</span>
        <span>Acciones</span>
      </div>

      <div
        v-for="product in products"
        :key="product.id"
        class="admin-row"
      >
        <span>{{ product.id }}</span>
        <span>{{ product.name }}</span>
        <span>$ {{ product.price }}</span>
        <span>Stock: {{ product.stock }}</span>

        <div class="actions">
          <BaseButton
            variant="outline"
            size="sm"
            @click="startEdit(product)"
          >
            Editar
          </BaseButton>

          <BaseButton
            variant="danger"
            size="sm"
            @click="deleteProduct(product.id)"
          >
            Eliminar
          </BaseButton>
        </div>
      </div>
    </div>

    <PaginationControls
      :pagination="pagination"
      @change-page="changePage"
    />
  </section>
</template>
