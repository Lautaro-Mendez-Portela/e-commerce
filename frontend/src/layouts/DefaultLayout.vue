<script setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import MiniCart from "../components/cart/MiniCart.vue";
import AppIcon from "../components/ui/AppIcon.vue";
import BaseBadge from "../components/ui/BaseBadge.vue";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useFavoritesStore } from "../stores/favoritesStore";
import BackButton from "../components/ui/BackButton.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const favoritesStore = useFavoritesStore();

const { isAuthenticated, isAdmin } = storeToRefs(authStore);
const { itemCount } = storeToRefs(cartStore);
const { count: favoritesCount } = storeToRefs(favoritesStore);
const isMobileNavOpen = ref(false);
const headerSearch = ref("");
const currentYear = computed(() => new Date().getFullYear());

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

watch(
  () => route.fullPath,
  () => {
    isMobileNavOpen.value = false;
    cartStore.closeMiniCart();
  }
);

const logout = () => {
  authStore.logout();
  cartStore.reset();
  favoritesStore.reset();
  router.push({ name: "login" });
};

const submitHeaderSearch = () => {
  router.push({
    name: "products",
    query: headerSearch.value.trim()
      ? {
          search: headerSearch.value.trim(),
        }
      : {},
  });
};

const openCartFromHeader = () => {
  isMobileNavOpen.value = false;
  cartStore.toggleMiniCart();
};
</script>

<template>
  <div class="app">
    <header class="site-header">
      <div class="site-header__inner container">
        <RouterLink class="brand-btn" :to="{ name: 'home' }">
          <span class="brand-mark">EC</span>
          <span class="brand-name">E-Commerce</span>
        </RouterLink>

        <form class="navbar-search" role="search" @submit.prevent="submitHeaderSearch">
          <label class="sr-only" for="header-search">
            Buscar productos
          </label>
          <AppIcon name="search" size="18" />
          <input
            id="header-search"
            v-model="headerSearch"
            type="search"
            placeholder="Buscar productos"
          />
        </form>

        <button
          type="button"
          class="menu-toggle"
          :aria-expanded="isMobileNavOpen"
          aria-controls="main-navigation"
          :aria-label="isMobileNavOpen ? 'Cerrar navegacion' : 'Abrir navegacion'"
          @click="isMobileNavOpen = !isMobileNavOpen"
        >
          <AppIcon :name="isMobileNavOpen ? 'close' : 'menu'" />
        </button>

        <nav
          id="main-navigation"
          class="navbar-actions"
          :class="{ 'is-open': isMobileNavOpen }"
          aria-label="Navegacion principal"
        >
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
            class="admin-link"
            :to="{ name: 'admin' }"
          >
            <AppIcon name="shield" size="18" />
            Panel de administracion
          </RouterLink>

          <RouterLink
            v-if="isAuthenticated"
            :class="{ active: route.name === 'profile' }"
            class="nav-btn"
            :to="{ name: 'profile' }"
          >
            <AppIcon name="user" size="18" />
            Cuenta
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
            <AppIcon name="heart" size="18" />
            Favoritos
            <BaseBadge v-if="favoritesCount > 0" tone="neutral">
              {{ favoritesCount }}
            </BaseBadge>
          </RouterLink>

          <button
            v-if="isAuthenticated"
            class="cart-badge"
            :class="{ active: route.name === 'cart' || route.path.startsWith('/checkout') }"
            type="button"
            aria-controls="mini-cart-panel"
            :aria-expanded="cartStore.isMiniCartOpen"
            aria-label="Abrir carrito"
            @click="openCartFromHeader"
          >
            <AppIcon name="cart" size="18" />
            Carrito
            <BaseBadge tone="primary">
              {{ itemCount }}
            </BaseBadge>
          </button>

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
            type="button"
            @click="logout"
          >
            Cerrar sesion
          </button>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <div v-if="route.name !== 'home'" class="back-button-strip container">
        <BackButton />
      </div>
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="site-footer__inner container">
        <div class="site-footer__brand">
          <strong>E-Commerce</strong>
          <span>Compra simple, gestion clara y experiencia consistente.</span>
          <span>&copy; {{ currentYear }} E-Commerce. Todos los derechos reservados.</span>
        </div>

        <nav class="site-footer__links" aria-label="Navegacion secundaria">
          <RouterLink :to="{ name: 'products' }">
            Productos
          </RouterLink>
          <RouterLink v-if="isAuthenticated" :to="{ name: 'orders' }">
            Ordenes
          </RouterLink>
          <RouterLink v-if="isAuthenticated" :to="{ name: 'profile' }">
            Cuenta
          </RouterLink>
        </nav>
      </div>
    </footer>

    <MiniCart />
  </div>
</template>
