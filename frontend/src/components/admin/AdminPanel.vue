<script setup>
import { ref } from "vue";

import ProductsView from "./ProductsView.vue";
import UsersView from "./UsersView.vue";

const currentTab = ref("products");
</script>

<template>
  <section class="admin-section">
    <h2>Panel de Administración</h2>

    <nav class="admin-nav">
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
    </nav>

    <ProductsView v-if="currentTab === 'products'" />

    <UsersView v-if="currentTab === 'users'" />
  </section>
</template>