<script setup>
import { onMounted, ref } from "vue";
import PaginationControls from "./PaginationControls.vue";

const API_URL = "http://localhost:3000";

const products = ref([]);
const editingProductId = ref(null);
const showForm = ref(false);
const filters = ref({
  name: "",
  minPrice: "",
  maxPrice: "",
});
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
  price: 0,
  stock: 0,
});

const getToken = () => `Bearer ${localStorage.getItem("token")}`;

const getProducts = async (page = pagination.value.page) => {
  try {
    const params = new URLSearchParams({
      page,
      limit: pagination.value.limit,
    });

    if (filters.value.name) {
      params.append("name", filters.value.name);
    }

    if (filters.value.minPrice) {
      params.append("minPrice", filters.value.minPrice);
    }

    if (filters.value.maxPrice) {
      params.append("maxPrice", filters.value.maxPrice);
    }

    const response = await fetch(`${API_URL}/products?${params.toString()}`);
    const data = await response.json();

    products.value = data.data;
    pagination.value = data.pagination;
  } catch (error) {
    console.error("ERROR PRODUCTS:", error);
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
    const isEditing = editingProductId.value !== null;

    const url = isEditing
      ? `${API_URL}/products/${editingProductId.value}`
      : `${API_URL}/products`;

    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: getToken(),
      },
      body: JSON.stringify(productForm.value),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }

    resetForm();
    showForm.value = false;

    await getProducts(isEditing ? pagination.value.page : 1);

    alert(isEditing ? "Producto actualizado" : "Producto creado");
  } catch (error) {
    console.error(error);
  }
};

const startEdit = (product) => {
  showForm.value = true;
  editingProductId.value = product.id;

  productForm.value = {
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
  };
};

const cancelEdit = () => {
  resetForm();
  showForm.value = false;
};

const deleteProduct = async (id) => {
  const confirmed = confirm("¿Eliminar este producto?");

  if (!confirmed) return;

  try {
    await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: getToken(),
      },
    });

    const nextPage =
      products.value.length === 1 && pagination.value.page > 1
        ? pagination.value.page - 1
        : pagination.value.page;

    await getProducts(nextPage);
  } catch (error) {
    console.error(error);
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

      <button class="add-product-btn" @click="openCreateForm">
        + Agregar Producto
      </button>
    </div>

    <div class="filters-bar">
      <input v-model="filters.name" placeholder="Buscar por nombre" />

      <input
        v-model="filters.minPrice"
        type="number"
        min="0"
        placeholder="Precio minimo"
      />

      <input
        v-model="filters.maxPrice"
        type="number"
        min="0"
        placeholder="Precio maximo"
      />

      <button class="filter-btn" @click="applyFilters">
        Filtrar
      </button>

      <button class="clear-btn" @click="clearFilters">
        Limpiar
      </button>
    </div>

    <div v-if="showForm" class="admin-panel">
      <h3>
        {{ editingProductId ? "Editar Producto" : "Crear Producto" }}
      </h3>

      <input v-model="productForm.name" placeholder="Nombre" />

      <input v-model="productForm.description" placeholder="Descripción" />

      <input
        v-model.number="productForm.price"
        type="number"
        placeholder="Precio"
      />

      <input
        v-model.number="productForm.stock"
        type="number"
        placeholder="Stock"
      />

      <div class="form-actions">
        <button class="save-btn" @click="saveProduct">
          {{ editingProductId ? "Guardar cambios" : "Crear Producto" }}
        </button>

        <button class="cancel-btn" @click="cancelEdit">
          Cancelar
        </button>
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
          <button class="edit-btn" @click="startEdit(product)">
            Editar
          </button>

          <button class="delete-btn" @click="deleteProduct(product.id)">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <PaginationControls
      :pagination="pagination"
      @change-page="changePage"
    />
  </section>
</template>
