<script setup>
import { onMounted, ref } from "vue";

const API_URL = "http://localhost:3000";

const users = ref([]);

const getToken = () => `Bearer ${localStorage.getItem("token")}`;

const getUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: getToken(),
      },
    });

    const data = await response.json();

    users.value = data;
  } catch (error) {
    console.error("ERROR USERS:", error);
  }
};

onMounted(() => {
  getUsers();
});
</script>

<template>
  <section>
    <h3>Usuarios</h3>

    <p>Total usuarios: {{ users.length }}</p>

    <div class="admin-list">
      <div class="admin-header">
        <span>ID</span>
        <span>Email</span>
        <span>Rol</span>
        <span>Fecha de registro</span>
      </div>

      <div
        v-for="user in users"
        :key="user.id"
        class="admin-row"
      >
        <span>{{ user.id }}</span>

        <span>{{ user.email }}</span>

        <span>
          {{ user.role }}
        </span>

        <span>
          {{ new Date(user.createdAt).toLocaleDateString() }}
        </span>
      </div>
    </div>
  </section>
</template>