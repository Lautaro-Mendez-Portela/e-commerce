<script setup>
import { onMounted, ref } from "vue";
import PaginationControls from "./PaginationControls.vue";

const API_URL = "http://localhost:3000";

const users = ref([]);
const selectedUser = ref(null);
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

const getToken = () => `Bearer ${localStorage.getItem("token")}`;

const getOrderTotal = (order) => {
  if (!order.items) return 0;

  return order.items.reduce((total, item) => {
    return total + item.quantity * item.price;
  }, 0);
};

const getUsers = async (page = pagination.value.page) => {
  try {
    const response = await fetch(
      `${API_URL}/users?page=${page}&limit=${pagination.value.limit}`,
      {
        headers: {
          Authorization: getToken(),
        },
      }
    );

    const data = await response.json();

    users.value = data.data;
    pagination.value = data.pagination;
  } catch (error) {
    console.error("ERROR USERS:", error);
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
    const response = await fetch(
      `${API_URL}/users/${id}?page=${page}&limit=${selectedUserOrdersPagination.value.limit}`,
      {
        headers: {
          Authorization: getToken(),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Error al obtener perfil");
      return;
    }

    selectedUser.value = data;
    selectedUserOrdersPagination.value = data.ordersPagination;
  } catch (error) {
    console.error("ERROR USER PROFILE:", error);
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
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: getToken(),
      },
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "Error al eliminar usuario");
      return;
    }

    if (selectedUser.value?.id === id) {
      selectedUser.value = null;
    }

    const nextPage =
      users.value.length === 1 && pagination.value.page > 1
        ? pagination.value.page - 1
        : pagination.value.page;

    await getUsers(nextPage);
  } catch (error) {
    console.error("ERROR DELETE USER:", error);
  }
};

onMounted(() => {
  getUsers();
});
</script>

<template>
  <section>
    <h3>Usuarios</h3>

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
