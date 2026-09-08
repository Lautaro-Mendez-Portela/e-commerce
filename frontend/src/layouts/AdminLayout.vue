<script setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";

import AppIcon from "../components/ui/AppIcon.vue";
import BackButton from "../components/ui/BackButton.vue";
import { useAuthStore } from "../stores/authStore";

const route = useRoute();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const isSidebarOpen = ref(false);

const links = [
  {
    name: "admin",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    name: "admin-products",
    label: "Productos",
    icon: "package",
  },
  {
    name: "admin-inventory",
    label: "Inventario",
    icon: "chart",
  },
  {
    name: "admin-orders",
    label: "Pedidos",
    icon: "receipt",
  },
  {
    name: "admin-users",
    label: "Usuarios",
    icon: "users",
  },
];

const adminName = computed(() => {
  const firstName = user.value?.firstName || "";
  const lastName = user.value?.lastName || "";

  return `${firstName} ${lastName}`.trim() || user.value?.email || "Admin";
});

watch(
  () => route.fullPath,
  () => {
    isSidebarOpen.value = false;
  }
);
</script>

<template>
  <section class="admin-shell">
    <button
      v-if="isSidebarOpen"
      type="button"
      class="admin-sidebar-backdrop"
      aria-label="Cerrar navegacion admin"
      @click="isSidebarOpen = false"
    />

    <aside class="admin-sidebar" :class="{ 'is-open': isSidebarOpen }">
      <div class="admin-sidebar__brand">
        <span class="brand-mark">EC</span>
        <div>
          <strong>Ecommerce Admin</strong>
          <span>Gestion del comercio</span>
        </div>
      </div>

      <nav class="admin-sidebar__nav" aria-label="Navegacion admin">
        <RouterLink
          v-for="link in links"
          :key="link.name"
          :to="{ name: link.name }"
        >
          <AppIcon :name="link.icon" size="18" />
          {{ link.label }}
        </RouterLink>
      </nav>

      <RouterLink class="admin-store-link" :to="{ name: 'products' }">
        <AppIcon name="arrow-right" size="18" />
        Volver a tienda
      </RouterLink>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <div class="admin-topbar__start">
          <button
            type="button"
            class="menu-toggle"
            :aria-expanded="isSidebarOpen"
            aria-label="Abrir navegacion admin"
            @click="isSidebarOpen = true"
          >
            <AppIcon name="menu" />
          </button>

          <BackButton :fallback-to="{ name: 'admin' }" />
        </div>

        <div class="admin-topbar__user">
          <span>Usuario admin</span>
          <strong>{{ adminName }}</strong>
        </div>
      </header>

      <RouterView />
    </div>
  </section>
</template>
