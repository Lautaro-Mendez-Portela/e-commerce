<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import ProductCard from "../components/products/ProductCard.vue";
import ProductCardSkeleton from "../components/products/ProductCardSkeleton.vue";
import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSkeleton from "../components/ui/BaseSkeleton.vue";
import { productService } from "../services/productService";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useFavoritesStore } from "../stores/favoritesStore";
import { useFeedbackStore } from "../stores/feedbackStore";
import { formatCurrency } from "../utils/formatters";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const favoritesStore = useFavoritesStore();
const feedbackStore = useFeedbackStore();
const { isAuthenticated } = storeToRefs(authStore);

const product = ref(null);
const relatedProducts = ref([]);
const quantity = ref(1);
const loading = ref(false);
const relatedLoading = ref(false);
const cartLoading = ref(false);
const favoriteLoading = ref(false);
const errorMessage = ref("");
const imageFailed = ref(false);

const stock = computed(() => Number(product.value?.stock || 0));
const available = computed(() => stock.value > 0);
const isLowStock = computed(() => stock.value > 0 && stock.value <= 5);
const isFavorite = computed(() => {
  return product.value ? favoritesStore.isFavorite(product.value.id) : false;
});

const availabilityLabel = computed(() => {
  if (!available.value) {
    return "Sin stock";
  }

  if (isLowStock.value) {
    return `Poco stock: ${stock.value}`;
  }

  return "Disponible";
});

const setQuantity = (nextQuantity) => {
  if (!available.value) {
    quantity.value = 1;
    return;
  }

  quantity.value = Math.min(
    Math.max(Number(nextQuantity) || 1, 1),
    stock.value
  );
};

const requireLogin = () => {
  feedbackStore.info("Inicia sesion para continuar");
  router.push({
    name: "login",
    query: {
      redirect: route.fullPath,
    },
  });
};

const loadRelatedProducts = async () => {
  try {
    relatedLoading.value = true;

    const response = await productService.getProducts({
      page: 1,
      limit: 5,
      sort: "newest",
      inStock: true,
    });

    relatedProducts.value = (response.data || [])
      .filter((item) => item.id !== product.value?.id)
      .slice(0, 4);
  } catch {
    relatedProducts.value = [];
  } finally {
    relatedLoading.value = false;
  }
};

const loadProduct = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    product.value = null;
    imageFailed.value = false;

    const data = await productService.getProductById(route.params.id);

    product.value = data;
    setQuantity(1);
    document.title = `${data.name} | E-Commerce`;

    await loadRelatedProducts();
  } catch (error) {
    errorMessage.value = error.status === 404
      ? "No encontramos el producto solicitado."
      : error.message;
    document.title = "Producto no encontrado | E-Commerce";
  } finally {
    loading.value = false;
  }
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

    await cartStore.addItem(product.value.id, quantity.value);
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

  if (favoriteLoading.value || !product.value) {
    return;
  }

  try {
    favoriteLoading.value = true;
    await favoritesStore.toggleFavorite(product.value.id);
  } catch (error) {
    feedbackStore.error(error.message);
  } finally {
    favoriteLoading.value = false;
  }
};

watch(
  () => route.params.id,
  () => {
    loadProduct();
  }
);

onMounted(() => {
  loadProduct();
});
</script>

<template>
  <main class="product-detail page-shell">
    <div v-if="loading" class="product-detail__grid">
      <BaseSkeleton height="520px" rounded="lg" />

      <section class="product-detail__info">
        <BaseSkeleton width="34%" />
        <BaseSkeleton height="2.2rem" />
        <BaseSkeleton width="42%" height="1.6rem" />
        <BaseSkeleton height="6rem" />
        <BaseSkeleton height="48px" rounded="lg" />
      </section>
    </div>

    <section v-else-if="errorMessage" class="empty-state">
      <AppIcon name="warning" size="36" />
      <h1>Producto no encontrado</h1>
      <p>{{ errorMessage }}</p>
      <RouterLink :to="{ name: 'products' }">
        <BaseButton>Volver al catalogo</BaseButton>
      </RouterLink>
    </section>

    <template v-else-if="product">
      <section class="product-detail__grid">
        <div class="product-detail__gallery">
          <img
            v-if="product.imageUrl && !imageFailed"
            :src="product.imageUrl"
            :alt="product.name"
            loading="lazy"
            @error="imageFailed = true"
          />

          <div v-else class="product-detail__placeholder">
            <AppIcon name="package" size="64" />
          </div>
        </div>

        <section class="product-detail__info">
          <RouterLink class="product-detail__back" :to="{ name: 'products' }">
            Volver al catalogo
          </RouterLink>

          <p class="eyebrow">Producto</p>
          <h1>{{ product.name }}</h1>
          <p class="product-detail__price">{{ formatCurrency(product.price) }}</p>
          <p
            class="stock"
            :class="{
              'stock--danger': !available,
              'stock--warning': isLowStock,
              'stock--success': available && !isLowStock
            }"
          >
            {{ availabilityLabel }}
          </p>

          <p class="product-detail__description">
            {{ product.description }}
          </p>

          <div class="quantity-field">
            <span>Cantidad</span>
            <div class="quantity-controls">
              <button
                type="button"
                aria-label="Reducir cantidad"
                :disabled="quantity <= 1"
                @click="setQuantity(quantity - 1)"
              >
                -
              </button>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                :max="stock"
                :disabled="!available"
                aria-label="Cantidad"
                @change="setQuantity(quantity)"
              />
              <button
                type="button"
                aria-label="Aumentar cantidad"
                :disabled="quantity >= stock || !available"
                @click="setQuantity(quantity + 1)"
              >
                +
              </button>
            </div>
          </div>

          <div class="product-detail__actions">
            <BaseButton
              size="lg"
              :loading="cartLoading"
              :disabled="!available"
              @click="addToCart"
            >
              {{ available ? "Agregar al carrito" : "Sin stock" }}
            </BaseButton>

            <BaseButton
              variant="outline"
              size="lg"
              :loading="favoriteLoading"
              @click="toggleFavorite"
            >
              <AppIcon name="heart" size="18" />
              {{ isFavorite ? "Quitar favorito" : "Guardar favorito" }}
            </BaseButton>
          </div>
        </section>
      </section>

      <section v-if="relatedLoading || relatedProducts.length > 0" class="related-products">
        <div class="page-header">
          <h2>Tambien podes explorar</h2>
          <p>Mas productos disponibles del catalogo.</p>
        </div>

        <div class="products-grid">
          <template v-if="relatedLoading">
            <ProductCardSkeleton
              v-for="index in 4"
              :key="`related-skeleton-${index}`"
            />
          </template>

          <template v-else>
            <ProductCard
              v-for="item in relatedProducts"
              :key="item.id"
              :product="item"
            />
          </template>
        </div>
      </section>
    </template>
  </main>
</template>
