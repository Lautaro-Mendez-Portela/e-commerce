<script setup>
import { watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useFavoritesStore } from "../stores/favoritesStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const favoritesStore = useFavoritesStore();

const { isAuthenticated, isAdmin } = storeToRefs(authStore);
const { itemCount } = storeToRefs(cartStore);
const { count: favoritesCount } = storeToRefs(favoritesStore);

watch(
  isAuthenticated,
  async (loggedIn) => {
    if (!loggedIn) {
      cartStore.reset();
      favoritesStore.reset();
      return;
    }

    await Promise.allSettled([
      cartStore.loadCart(),
      favoritesStore.loadFavorites(),
    ]);
  },
  {
    immediate: true,
  }
);

const logout = () => {
  authStore.logout();
  cartStore.reset();
  favoritesStore.reset();
  router.push({ name: "login" });
};
</script>

<template>
  <div class="app">
    <header class="navbar">
      <RouterLink class="brand-btn" :to="{ name: 'products' }">
        E-Commerce
      </RouterLink>

      <div class="navbar-actions">
        <RouterLink
          :class="{ active: route.name === 'products' || route.name === 'cart' }"
          class="nav-btn"
          :to="{ name: 'products' }"
        >
          Inicio
        </RouterLink>

        <RouterLink
          v-if="isAdmin"
          :class="{ active: route.path.startsWith('/admin') }"
          class="nav-btn"
          :to="{ name: 'admin' }"
        >
          Panel de administracion
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          :class="{ active: route.name === 'profile' }"
          class="nav-btn"
          :to="{ name: 'profile' }"
        >
          Ver perfil
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          :class="{ active: route.name === 'orders' || route.name === 'order-detail' }"
          class="nav-btn"
          :to="{ name: 'orders' }"
        >
          Ordenes
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          :class="{ active: route.name === 'favorites' }"
          class="nav-btn"
          :to="{ name: 'favorites' }"
        >
          Favoritos {{ favoritesCount }}
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          class="cart-badge"
          :to="{ name: 'cart' }"
        >
          Carrito {{ itemCount }}
        </RouterLink>

        <RouterLink
          v-if="!isAuthenticated"
          class="nav-btn"
          :to="{ name: 'login' }"
        >
          Iniciar sesion
        </RouterLink>

        <RouterLink
          v-if="!isAuthenticated"
          class="nav-btn"
          :to="{ name: 'register' }"
        >
          Crear cuenta
        </RouterLink>

        <button
          v-if="isAuthenticated"
          class="logout-btn"
          @click="logout"
        >
          Cerrar sesion
        </button>
      </div>
    </header>

    <RouterView />
  </div>
</template>
