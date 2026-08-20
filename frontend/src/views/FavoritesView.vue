<script setup>
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";

import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseCard from "../components/ui/BaseCard.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import { useCartStore } from "../stores/cartStore";
import { useFeedbackStore } from "../stores/feedbackStore";
import { useFavoritesStore } from "../stores/favoritesStore";

const cartStore = useCartStore();
const feedbackStore = useFeedbackStore();
const favoritesStore = useFavoritesStore();
const { items: favorites, loading, error } = storeToRefs(favoritesStore);

const actionMessage = ref("");

const toggleFavorite = async (productId) => {
  try {
    actionMessage.value = "";
    await favoritesStore.toggleFavorite(productId);
  } catch (err) {
    actionMessage.value = err.message;
    feedbackStore.error(err.message);
  }
};

const addToCart = async (productId) => {
  try {
    actionMessage.value = "";
    await cartStore.addItem(productId);
    cartStore.openMiniCart();
    feedbackStore.success("Producto agregado al carrito");
  } catch (err) {
    actionMessage.value = err.message;
    feedbackStore.error(err.message);
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
    <header class="page-header">
      <h1>Favoritos</h1>
      <p>Productos guardados para volver a comprar mas rapido.</p>
    </header>

    <p v-if="loading" class="info-message cluster">
      <BaseSpinner size="sm" />
      Cargando favoritos...
    </p>

    <p v-if="error || actionMessage" class="error">
      {{ error || actionMessage }}
    </p>

    <p v-if="!loading && favorites.length === 0" class="empty-cart">
      Todavia no agregaste productos a favoritos
    </p>

    <div v-if="!loading && favorites.length > 0" class="products-grid">
      <BaseCard
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
          <AppIcon name="package" size="42" />
        </div>

        <button
          class="favorite-btn active"
          aria-label="Quitar de favoritos"
          @click="toggleFavorite(favorite.productId)"
        >
          <AppIcon name="heart" size="20" />
        </button>

        <h3>{{ favorite.product.name }}</h3>

        <p class="price">$ {{ favorite.product.price }}</p>

        <p class="stock">Stock: {{ favorite.product.stock }}</p>

        <BaseButton block @click="addToCart(favorite.productId)">
          Agregar al carrito
        </BaseButton>
      </BaseCard>
    </div>
  </main>
</template>
