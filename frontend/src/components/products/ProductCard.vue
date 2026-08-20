<script setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import AppIcon from "../ui/AppIcon.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseCard from "../ui/BaseCard.vue";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";
import { useFavoritesStore } from "../../stores/favoritesStore";
import { useFeedbackStore } from "../../stores/feedbackStore";
import { formatCurrency } from "../../utils/formatters";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const favoritesStore = useFavoritesStore();
const feedbackStore = useFeedbackStore();
const { isAuthenticated } = storeToRefs(authStore);

const imageFailed = ref(false);
const cartLoading = ref(false);
const favoriteLoading = ref(false);

const productUrl = computed(() => ({
  name: "product-detail",
  params: {
    id: props.product.id,
  },
}));

const hasImage = computed(() => Boolean(props.product.imageUrl) && !imageFailed.value);
const stock = computed(() => Number(props.product.stock || 0));
const available = computed(() => stock.value > 0);
const isLowStock = computed(() => stock.value > 0 && stock.value <= 5);
const isFavorite = computed(() => favoritesStore.isFavorite(props.product.id));

const availabilityLabel = computed(() => {
  if (!available.value) {
    return "Sin stock";
  }

  if (isLowStock.value) {
    return `Poco stock: ${stock.value}`;
  }

  return "Disponible";
});

const availabilityTone = computed(() => {
  if (!available.value) {
    return "danger";
  }

  if (isLowStock.value) {
    return "warning";
  }

  return "success";
});

const requireLogin = () => {
  feedbackStore.info("Inicia sesion para continuar");
  router.push({
    name: "login",
    query: {
      redirect: route.fullPath,
    },
  });
};

const addToCart = async () => {
  if (!isAuthenticated.value) {
    requireLogin();
    return;
  }

  if (!available.value || cartLoading.value) {
    return;
  }

  try {
    cartLoading.value = true;

    await cartStore.addItem(props.product.id);
    cartStore.openMiniCart();
    feedbackStore.success("Producto agregado al carrito");
  } catch (error) {
    feedbackStore.error(error.message);
  } finally {
    cartLoading.value = false;
  }
};

const toggleFavorite = async () => {
  if (!isAuthenticated.value) {
    requireLogin();
    return;
  }

  if (favoriteLoading.value) {
    return;
  }

  try {
    favoriteLoading.value = true;

    await favoritesStore.toggleFavorite(props.product.id);
  } catch (error) {
    feedbackStore.error(error.message);
  } finally {
    favoriteLoading.value = false;
  }
};
</script>

<template>
  <BaseCard class="product-card">
    <RouterLink class="product-card__media" :to="productUrl">
      <img
        v-if="hasImage"
        :src="product.imageUrl"
        :alt="product.name"
        class="product-image"
        loading="lazy"
        @error="imageFailed = true"
      />

      <div v-else class="product-image product-image--placeholder">
        <AppIcon name="package" size="42" />
      </div>
    </RouterLink>

    <button
      class="favorite-btn"
      :class="{ active: isFavorite }"
      type="button"
      :aria-label="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
      :disabled="favoriteLoading"
      @click="toggleFavorite"
    >
      <AppIcon name="heart" size="20" />
    </button>

    <div class="product-card__body">
      <p v-if="product.category" class="product-card__eyebrow">
        {{ product.category.name || product.category }}
      </p>

      <RouterLink class="product-card__title" :to="productUrl">
        <h3>{{ product.name }}</h3>
      </RouterLink>

      <p class="price">{{ formatCurrency(product.price) }}</p>

      <p class="stock" :class="`stock--${availabilityTone}`">
        {{ availabilityLabel }}
      </p>
    </div>

    <BaseButton
      block
      :loading="cartLoading"
      :disabled="!available"
      @click="addToCart"
    >
      {{ available ? "Agregar al carrito" : "Sin stock" }}
    </BaseButton>
  </BaseCard>
</template>
