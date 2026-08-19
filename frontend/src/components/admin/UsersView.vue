<script setup>
import { onMounted, ref } from "vue";
import PaginationControls from "./PaginationControls.vue";
import { apiClient } from "../../services/apiClient";

const users = ref([]);
const selectedUser = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const selectedUserOrdersPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
const pagination = ref({
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

const getUsers = async (page = pagination.value.page) => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await apiClient.get("/users", {
      query: {
        page,
        limit: pagination.value.limit,
      },
    });

    users.value = data.data;
    pagination.value = data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const changePage = async (page) => {
  await getUsers(page);
};

const viewProfile = async (
  id,
  page = selectedUserOrdersPagination.value.page
) => {
  try {
    errorMessage.value = "";

    const data = await apiClient.get(`/users/${id}`, {
      query: {
        page,
        limit: selectedUserOrdersPagination.value.limit,
      },
    });

    selectedUser.value = data;
    selectedUserOrdersPagination.value = data.ordersPagination;
  } catch (error) {
    errorMessage.value = error.message;
  }
};

const changeSelectedUserOrdersPage = async (page) => {
  if (!selectedUser.value) return;

  await viewProfile(selectedUser.value.id, page);
};

const deleteUser = async (id) => {
  const confirmed = confirm("Eliminar este usuario?");

  if (!confirmed) return;

  try {
    errorMessage.value = "";
    successMessage.value = "";

    await apiClient.delete(`/users/${id}`);

    if (selectedUser.value?.id === id) {
      selectedUser.value = null;
    }

    const nextPage =
      users.value.length === 1 && pagination.value.page > 1
        ? pagination.value.page - 1
        : pagination.value.page;

    await getUsers(nextPage);
    successMessage.value = "Usuario eliminado";
  } catch (error) {
    errorMessage.value = error.message;
  }
};

onMounted(() => {
  getUsers();
});
</script>

<template>
  <section>
    <h3>Usuarios</h3>

    <p v-if="loading">Cargando usuarios...</p>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <p v-if="successMessage" class="success">
      {{ successMessage }}
    </p>

    <p>Total usuarios: {{ pagination.total }}</p>

    <div class="admin-list">
      <div class="admin-header">
        <span>ID</span>
        <span>Nombre</span>
        <span>Email</span>
        <span>Rol</span>
        <span>Acciones</span>
      </div>

      <div
        v-for="user in users"
        :key="user.id"
        class="admin-row"
      >
        <span>{{ user.id }}</span>
        <span>{{ user.firstName }} {{ user.lastName }}</span>
        <span>{{ user.email }}</span>
        <span>{{ user.role }}</span>

        <div class="actions">
          <button class="edit-btn" @click="viewProfile(user.id, 1)">
            Ver perfil
          </button>

          <button class="delete-btn" @click="deleteUser(user.id)">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <PaginationControls
      :pagination="pagination"
      @change-page="changePage"
    />

    <div v-if="selectedUser" class="profile-card admin-user-profile">
      <div class="products-header">
        <h3>Perfil de usuario</h3>

        <button class="clear-btn" @click="selectedUser = null">
          Cerrar
        </button>
      </div>

      <p><strong>Nombre:</strong> {{ selectedUser.firstName }}</p>
      <p><strong>Apellido:</strong> {{ selectedUser.lastName }}</p>
      <p><strong>Email:</strong> {{ selectedUser.email }}</p>
      <p><strong>Rol:</strong> {{ selectedUser.role }}</p>

      <h4>Historial de compras</h4>

      <p v-if="selectedUser.orders.length === 0" class="empty-cart">
        Sin compras registradas
      </p>

      <div v-else class="admin-list">
        <div class="admin-row admin-header">
          <span>ID</span>
          <span>Estado</span>
          <span>Total</span>
          <span>Fecha</span>
        </div>

        <div
          v-for="order in selectedUser.orders"
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
        v-if="selectedUserOrdersPagination.total > 0"
        :pagination="selectedUserOrdersPagination"
        @change-page="changeSelectedUserOrdersPage"
      />
    </div>
  </section>
</template>
