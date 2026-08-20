<script setup>
import { computed, ref, watch } from "vue";

import AppIcon from "../ui/AppIcon.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["decrease", "increase", "remove"]);

const imageFailed = ref(false);

const product = computed(() => props.item.product || null);
const productName = computed(() => product.value?.name || "Producto no disponible");
const productUrl = computed(() => ({
  name: "product-detail",
  params: {
    id: props.item.productId,
  },
}));
const quantity = computed(() => Number(props.item.quantity || 0));
const stock = computed(() => Number(product.value?.stock || 0));
const unitPrice = computed(() => Number(product.value?.price || props.item.price || 0));
const subtotal = computed(() => unitPrice.value * quantity.value);
const hasImage = computed(() => Boolean(product.value?.imageUrl) && !imageFailed.value);
const canDecrease = computed(() => quantity.value > 1 && !props.loading);
const canIncrease = computed(() => {
  return stock.value > 0 && quantity.value < stock.value && !props.loading;
});

const stockMessage = computed(() => {
  if (!product.value || product.value.isActive === false || stock.value < 1) {
    return "Producto no disponible";
  }

  if (quantity.value > stock.value) {
    return `Stock disponible: ${stock.value}`;
  }

  if (stock.value <= 5) {
    return `Poco stock: ${stock.value}`;
  }

  return "";
});

const stockTone = computed(() => {
  if (!product.value || product.value.isActive === false || stock.value < 1) {
    return "danger";
  }

  if (quantity.value > stock.value) {
    return "warning";
  }

  return "warning";
});

const formatPrice = (value) => Number(value || 0).toFixed(2);

watch(
  () => product.value?.imageUrl,
  () => {
    imageFailed.value = false;
  }
);
</script>

<template>
  <article
    class="cart-line"
    :class="{ 'cart-line--compact': compact, 'is-loading': loading }"
    :aria-busy="loading"
  >
    <RouterLink
      v-if="product"
      class="cart-line__media"
      :to="productUrl"
      :aria-label="`Ver ${productName}`"
    >
      <img
        v-if="hasImage"
        :src="product.imageUrl"
        :alt="productName"
        loading="lazy"
        @error="imageFailed = true"
      />

      <span v-else class="cart-line__placeholder">
        <AppIcon name="package" size="28" />
      </span>
    </RouterLink>

    <span v-else class="cart-line__media cart-line__placeholder">
      <AppIcon name="package" size="28" />
    </span>

    <div class="cart-line__main">
      <RouterLink
        v-if="product"
        class="cart-line__name"
        :to="productUrl"
      >
        {{ productName }}
      </RouterLink>

      <h3 v-else class="cart-line__name">
        {{ productName }}
      </h3>

      <p class="cart-line__price">
        $ {{ formatPrice(unitPrice) }} unitario
      </p>

      <p
        v-if="stockMessage"
        class="stock"
        :class="`stock--${stockTone}`"
      >
        {{ stockMessage }}
      </p>
    </div>

    <div class="quantity-controls cart-line__quantity">
      <button
        type="button"
        :aria-label="`Reducir cantidad de ${productName}`"
        :disabled="!canDecrease"
        @click="emit('decrease', item)"
      >
        <AppIcon name="minus" size="16" />
      </button>

      <span aria-live="polite">
        {{ quantity }}
      </span>

      <button
        type="button"
        :aria-label="`Aumentar cantidad de ${productName}`"
        :disabled="!canIncrease"
        @click="emit('increase', item)"
      >
        <AppIcon name="plus" size="16" />
      </button>
    </div>

    <p class="cart-line__subtotal">
      <span>Subtotal</span>
      <strong>$ {{ formatPrice(subtotal) }}</strong>
    </p>

    <button
      type="button"
      class="icon-action icon-action--danger"
      :aria-label="`Eliminar ${productName}`"
      :disabled="loading"
      @click="emit('remove', item)"
    >
      <AppIcon name="trash" size="18" />
    </button>

    <span v-if="loading" class="sr-only">
      Actualizando item del carrito
    </span>
  </article>
</template>
