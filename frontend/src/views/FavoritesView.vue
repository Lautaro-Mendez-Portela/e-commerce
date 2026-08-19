<script setup>
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";

import { useCartStore } from "../stores/cartStore";
import { useFavoritesStore } from "../stores/favoritesStore";

const cartStore = useCartStore();
const favoritesStore = useFavoritesStore();
const { items: favorites, loading, error } = storeToRefs(favoritesStore);

const actionMessage = ref("");

const toggleFavorite = async (productId) => {
  try {
    actionMessage.value = "";
    await favoritesStore.toggleFavorite(productId);
  } catch (err) {
    actionMessage.value = err.message;
  }
};

const addToCart = async (productId) => {
  try {
    actionMessage.value = "";
    await cartStore.addItem(productId);
  } catch (err) {
    actionMessage.value = err.message;
  }
};

onMounted(async () => {
  if (favorites.value.length === 0) {
    await favoritesStore.loadFavorites().catch(() => {});
  }
});
</script>

<template>
  <main class="favorites-section">
    <h2 class="section-title">Favoritos</h2>

    <p v-if="loading">Cargando favoritos...</p>

    <p v-if="error || actionMessage" class="error">
      {{ error || actionMessage }}
    </p>

    <p v-if="!loading && favorites.length === 0" class="empty-cart">
      Todavia no agregaste productos a favoritos
    </p>

    <div v-if="!loading && favorites.length > 0" class="products-grid">
      <div
        v-for="favorite in favorites"
        :key="favorite.id"
        class="product-card"
      >
        <img
          v-if="favorite.product.imageUrl"
          :src="favorite.product.imageUrl"
          :alt="favorite.product.name"
          class="product-image"
        />

        <div v-else class="product-image">
          Caja
        </div>

        <button
          class="favorite-btn active"
          aria-label="Quitar de favoritos"
          @click="toggleFavorite(favorite.productId)"
        >
          ♥
        </button>

        <h3>{{ favorite.product.name }}</h3>

        <p class="price">$ {{ favorite.product.price }}</p>

        <p class="stock">Stock: {{ favorite.product.stock }}</p>

        <button
          class="primary-btn"
          @click="addToCart(favorite.productId)"
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  </main>
</template>
