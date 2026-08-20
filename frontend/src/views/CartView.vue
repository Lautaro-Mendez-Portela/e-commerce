<script setup>
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

import CartLineItem from "../components/cart/CartLineItem.vue";
import OrderSummary from "../components/cart/OrderSummary.vue";
import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSkeleton from "../components/ui/BaseSkeleton.vue";
import { useCartStore } from "../stores/cartStore";
import { useFeedbackStore } from "../stores/feedbackStore";

const router = useRouter();
const cartStore = useCartStore();
const feedbackStore = useFeedbackStore();
const {
  items: cart,
  itemCount,
  totalPrice,
  loading,
  error,
} = storeToRefs(cartStore);

const actionMessage = ref("");

const cartItemsWithProducts = computed(() => {
  return cart.value.filter((item) => item.product);
});

const hasItems = computed(() => cartItemsWithProducts.value.length > 0);
const canCheckout = computed(() => hasItems.value && !loading.value);

const updateQuantity = async (item, nextQuantity) => {
  if (nextQuantity < 1 || cartStore.isItemBusy(item.id)) {
    return;
  }

  const stock = Number(item.product?.stock || 0);

  if (stock > 0 && nextQuantity > stock) {
    feedbackStore.info(`Stock disponible: ${stock}`);
    return;
  }

  try {
    actionMessage.value = "";
    await cartStore.updateQuantity(item.id, nextQuantity);
  } catch (err) {
    actionMessage.value = err.message;
    feedbackStore.error(err.message);
  }
};

const removeFromCart = async (item) => {
  if (cartStore.isItemBusy(item.id)) {
    return;
  }

  try {
    actionMessage.value = "";
    await cartStore.removeItem(item.id);
    feedbackStore.info("Producto eliminado del carrito");
  } catch (err) {
    actionMessage.value = err.message;
    feedbackStore.error(err.message);
  }
};

const goToCheckout = () => {
  if (!canCheckout.value) {
    feedbackStore.info("Agrega productos antes de continuar");
    return;
  }

  router.push({ name: "checkout" });
};

onMounted(() => {
  cartStore.loadCart().catch(() => {});
});
</script>

<template>
  <main class="cart-page page-shell">
    <header class="page-header cart-page__header">
      <div>
        <p class="eyebrow">Carrito</p>
        <h1>Tu carrito</h1>
        <p>Revisa cantidades y disponibilidad antes de avanzar al pago.</p>
      </div>

      <RouterLink :to="{ name: 'products' }">
        <BaseButton variant="outline">
          Seguir comprando
        </BaseButton>
      </RouterLink>
    </header>

    <p v-if="error || actionMessage" class="error">
      {{ error || actionMessage }}
    </p>

    <section v-if="loading" class="cart-page__layout" aria-label="Cargando carrito">
      <div class="cart-list">
        <div
          v-for="index in 3"
          :key="`cart-skeleton-${index}`"
          class="cart-line cart-line--skeleton"
        >
          <BaseSkeleton height="96px" rounded="lg" />
          <BaseSkeleton height="22px" />
        </div>
      </div>

      <aside class="order-summary">
        <BaseSkeleton height="28px" width="46%" />
        <BaseSkeleton height="120px" />
        <BaseSkeleton height="48px" rounded="lg" />
      </aside>
    </section>

    <section v-else-if="!hasItems" class="empty-state">
      <AppIcon name="cart" size="42" />
      <h2>Tu carrito esta vacio</h2>
      <p>Explora el catalogo para agregar productos y volver cuando estes listo.</p>
      <RouterLink :to="{ name: 'products' }">
        <BaseButton>
          Explorar productos
        </BaseButton>
      </RouterLink>
    </section>

    <section v-else class="cart-page__layout">
      <div class="cart-list" aria-label="Productos en el carrito">
        <CartLineItem
          v-for="item in cartItemsWithProducts"
          :key="item.id"
          :item="item"
          :loading="cartStore.isItemBusy(item.id)"
          @decrease="updateQuantity(item, item.quantity - 1)"
          @increase="updateQuantity(item, item.quantity + 1)"
          @remove="removeFromCart(item)"
        />
      </div>

      <OrderSummary
        :subtotal="totalPrice"
        :item-count="itemCount"
        primary-label="Continuar al checkout"
        :primary-disabled="!canCheckout"
        secondary-label="Seguir comprando"
        :secondary-to="{ name: 'products' }"
        trust-text="Pago procesado de forma segura con Stripe"
        @primary="goToCheckout"
      />
    </section>
  </main>
</template>
