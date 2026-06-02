<script setup>
import { onMounted, ref } from "vue";

const API_URL = "http://localhost:3000";

const products = ref([]);
const editingProductId = ref(null);
const showForm = ref(false);

const productForm = ref({
  name: "",
  description: "",
  price: 0,
  stock: 0,
});

const getToken = () => `Bearer ${localStorage.getItem("token")}`;

const getProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();

    products.value = data;
  } catch (error) {
    console.error("ERROR PRODUCTS:", error);
  }
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

    await getProducts();

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

    await getProducts();
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

    <p>Total productos: {{ products.length }}</p>

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
  </section>
</template>