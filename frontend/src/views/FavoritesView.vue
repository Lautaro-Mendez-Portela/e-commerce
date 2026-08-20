<script setup>
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";

import AccountLayout from "../components/account/AccountLayout.vue";
import ProductCard from "../components/products/ProductCard.vue";
import ProductCardSkeleton from "../components/products/ProductCardSkeleton.vue";
import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import { useFeedbackStore } from "../stores/feedbackStore";
import { useFavoritesStore } from "../stores/favoritesStore";

const feedbackStore = useFeedbackStore();
const favoritesStore = useFavoritesStore();
const { items: favorites, loading, error } = storeToRefs(favoritesStore);

const favoriteProducts = computed(() => {
  return favorites.value
    .map((favorite) => favorite.product)
    .filter(Boolean);
});

const loadFavorites = async () => {
  try {
    await favoritesStore.loadFavorites();
  } catch (err) {
    feedbackStore.error(err.message);
  }
};

onMounted(() => {
  loadFavorites();
});
</script>

<template>
  <AccountLayout>
    <section class="account-stack">
      <p v-if="error" class="error">
        No pudimos cargar tus favoritos.
      </p>

      <div v-if="loading" class="products-grid" aria-label="Cargando favoritos">
        <ProductCardSkeleton
          v-for="index in 4"
          :key="`favorite-skeleton-${index}`"
        />
      </div>

      <section v-else-if="favoriteProducts.length === 0" class="empty-state">
        <AppIcon name="heart" size="42" />
        <h2>Todavia no guardaste favoritos</h2>
        <p>Guarda productos para encontrarlos mas rapido cuando vuelvas.</p>
        <RouterLink :to="{ name: 'products' }">
          <BaseButton>
            Ver productos
          </BaseButton>
        </RouterLink>
      </section>

      <div v-else class="products-grid">
        <ProductCard
          v-for="product in favoriteProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </section>
  </AccountLayout>
</template>
