import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { apiClient } from "../services/apiClient";

export const useFavoritesStore = defineStore("favorites", () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref("");

  const count = computed(() => items.value.length);

  const reset = () => {
    items.value = [];
    loading.value = false;
    error.value = "";
  };

  const loadFavorites = async () => {
    try {
      loading.value = true;
      error.value = "";

      const data = await apiClient.get("/favorites");

      items.value = Array.isArray(data) ? data : [];

      return items.value;
    } catch (err) {
      items.value = [];
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const isFavorite = (productId) => {
    return items.value.some((favorite) => favorite.productId === productId);
  };

  const toggleFavorite = async (productId) => {
    error.value = "";

    if (isFavorite(productId)) {
      await apiClient.delete(`/favorites/${productId}`);
    } else {
      await apiClient.post("/favorites", {
        productId,
      });
    }

    return loadFavorites();
  };

  return {
    items,
    loading,
    error,
    count,
    loadFavorites,
    isFavorite,
    toggleFavorite,
    reset,
  };
});
