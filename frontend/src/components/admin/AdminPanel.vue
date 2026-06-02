<script setup>
import { ref } from "vue";

import DashboardView from "./DashboardView.vue";
import ProductsView from "./ProductsView.vue";
import UsersView from "./UsersView.vue";
import OrdersView from "./OrdersView.vue";

const currentTab = ref("dashboard");
</script>

<template>
  <section class="admin-section">
    <h2>Panel de administracion</h2>

    <nav class="admin-nav">
      <button
        :class="{ active: currentTab === 'dashboard' }"
        @click="currentTab = 'dashboard'"
      >
        Dashboard
      </button>

      <button
        :class="{ active: currentTab === 'products' }"
        @click="currentTab = 'products'"
      >
        Productos
      </button>

      <button
        :class="{ active: currentTab === 'users' }"
        @click="currentTab = 'users'"
      >
        Usuarios
      </button>

      <button
        :class="{ active: currentTab === 'orders' }"
        @click="currentTab = 'orders'"
      >
        Ordenes
      </button>
    </nav>

    <DashboardView v-if="currentTab === 'dashboard'" />

    <ProductsView v-if="currentTab === 'products'" />

    <UsersView v-if="currentTab === 'users'" />

    <OrdersView v-if="currentTab === 'orders'" />
  </section>
</template>
