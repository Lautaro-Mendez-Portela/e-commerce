<script setup>
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import PaginationControls from "../components/admin/PaginationControls.vue";
import { apiClient } from "../services/apiClient";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useFavoritesStore } from "../stores/favoritesStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const favoritesStore = useFavoritesStore();

const { isAuthenticated } = storeToRefs(authStore);
const { items: cart, totalPrice, checkoutLoading } = storeToRefs(cartStore);

const products = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const actionMessage = ref("");
const productPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

const cartItemsWithProducts = computed(() => {
  return cart.value.filter((item) => item.product);
});

const redirectToLogin = () => {
  router.push({
    name: "login",
    query: {
      redirect: route.fullPath,
    },
  });
};

const getProducts = async (page = productPagination.value.page) => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await apiClient.get("/products", {
      auth: false,
      query: {
        page,
        limit: productPagination.value.limit,
      },
    });

    products.value = data.data;
    productPagination.value = data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const changeProductsPage = async (page) => {
  await getProducts(page);
};

const isFavorite = (productId) => {
  return favoritesStore.isFavorite(productId);
};

const toggleFavorite = async (productId) => {
  if (!isAuthenticated.value) {
    redirectToLogin();
    return;
  }

  try {
    actionMessage.value = "";
    await favoritesStore.toggleFavorite(productId);
  } catch (error) {
    actionMessage.value = error.message;
  }
};

const addToCart = async (productId) => {
  if (!isAuthenticated.value) {
    redirectToLogin();
    return;
  }

  try {
    actionMessage.value = "";
    await cartStore.addItem(productId);
  } catch (error) {
    actionMessage.value = error.message;
  }
};

const removeFromCart = async (cartItemId) => {
  try {
    actionMessage.value = "";
    await cartStore.removeItem(cartItemId);
  } catch (error) {
    actionMessage.value = error.message;
  }
};

const updateQuantity = async (cartItemId, quantity) => {
  if (quantity < 1) {
    return;
  }

  try {
    actionMessage.value = "";
    await cartStore.updateQuantity(cartItemId, quantity);
  } catch (error) {
    actionMessage.value = error.message;
  }
};

const createOrder = async () => {
  try {
    actionMessage.value = "";

    const session = await cartStore.createCheckoutSession();

    if (session?.url) {
      window.location.href = session.url;
    }
  } catch (error) {
    actionMessage.value = error.message;
  }
};

onMounted(async () => {
  await getProducts();
});
</script>

<template>
  <main class="layout">
    <section>
      <h2 class="section-title">Productos</h2>

      <p v-if="loading">Cargando productos...</p>

      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
      </p>

      <p v-if="actionMessage" class="error">
        {{ actionMessage }}
      </p>

      <p>Total productos: {{ productPagination.total }}</p>

      <div class="products-grid">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-card"
        >
          <img
            v-if="product.imageUrl"
            :src="product.imageUrl"
            :alt="product.name"
            class="product-image"
          />

          <div v-else class="product-image">
            Caja
          </div>

          <button
            :class="{ active: isFavorite(product.id) }"
            class="favorite-btn"
            :aria-label="isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
            @click="toggleFavorite(product.id)"
          >
            {{ isFavorite(product.id) ? "♥" : "♡" }}
          </button>

          <h3>
            {{ product.name }}
          </h3>

          <p class="price">$ {{ product.price }}</p>

          <p class="stock">
            Stock:
            {{ product.stock }}
          </p>

          <button class="primary-btn" @click="addToCart(product.id)">
            Agregar al carrito
          </button>
        </div>
      </div>

      <PaginationControls
        :pagination="productPagination"
        @change-page="changeProductsPage"
      />
    </section>

    <aside class="cart-section">
      <h2 class="section-title">Carrito</h2>

      <p v-if="!isAuthenticated" class="empty-cart">
        Inicia sesion para usar el carrito
      </p>

      <p v-else-if="cartStore.loading">Cargando carrito...</p>

      <p v-else-if="cartStore.error" class="error">
        {{ cartStore.error }}
      </p>

      <div v-else-if="cart.length === 0" class="empty-cart">
        El carrito esta vacio
      </div>

      <div
        v-for="item in cartItemsWithProducts"
        :key="item.id"
        class="cart-item"
      >
        <div>
          <h4>
            {{ item.product.name }}
          </h4>

          <p>$ {{ item.product.price }}</p>
        </div>

        <div class="quantity-controls">
          <button @click="updateQuantity(item.id, item.quantity - 1)">
            -
          </button>

          <span>
            {{ item.quantity }}
          </span>

          <button @click="updateQuantity(item.id, item.quantity + 1)">
            +
          </button>
        </div>

        <button class="remove-btn" @click="removeFromCart(item.id)">
          Eliminar
        </button>
      </div>

      <div v-if="isAuthenticated && cart.length > 0" class="cart-footer">
        <h3>Total: $ {{ totalPrice.toFixed(2) }}</h3>

        <button
          class="checkout-btn"
          :disabled="checkoutLoading"
          @click="createOrder"
        >
          {{ checkoutLoading ? "Preparando pago..." : "Crear orden" }}
        </button>
      </div>
    </aside>
  </main>
</template>
