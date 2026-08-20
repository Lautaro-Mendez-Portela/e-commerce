<script setup>
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";

import OrderSummary from "../components/cart/OrderSummary.vue";
import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSkeleton from "../components/ui/BaseSkeleton.vue";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useFeedbackStore } from "../stores/feedbackStore";
import { formatCurrency } from "../utils/formatters";

const authStore = useAuthStore();
const cartStore = useCartStore();
const feedbackStore = useFeedbackStore();
const {
  items: cart,
  itemCount,
  totalPrice,
  loading,
  checkoutLoading,
  error,
} = storeToRefs(cartStore);

const actionMessage = ref("");

const cartItemsWithProducts = computed(() => {
  return cart.value.filter((item) => item.product);
});

const hasItems = computed(() => cartItemsWithProducts.value.length > 0);
const userFullName = computed(() => {
  const firstName = authStore.user?.firstName || "";
  const lastName = authStore.user?.lastName || "";

  return `${firstName} ${lastName}`.trim();
});

const startPayment = async () => {
  if (checkoutLoading.value) {
    return;
  }

  if (!hasItems.value) {
    feedbackStore.info("Agrega productos antes de continuar");
    return;
  }

  try {
    actionMessage.value = "";

    const result = await cartStore.startCheckout();

    if (result?.session?.url) {
      window.location.assign(result.session.url);
      return;
    }

    throw new Error("No se pudo iniciar Stripe Checkout");
  } catch (err) {
    actionMessage.value = err.message;
    feedbackStore.error(err.message);
  }
};

onMounted(() => {
  cartStore.loadCart().catch(() => {});
});
</script>

<template>
  <main class="checkout-page page-shell">
    <header class="checkout-header">
      <RouterLink class="brand-btn" :to="{ name: 'products' }">
        <span class="brand-mark">EC</span>
        <span class="brand-name">E-Commerce</span>
      </RouterLink>

      <p class="checkout-secure">
        <AppIcon name="lock" size="17" />
        Checkout seguro
      </p>
    </header>

    <div class="checkout-progress" aria-label="Progreso de compra">
      <span>Carrito</span>
      <AppIcon name="arrow-right" size="15" />
      <strong>Pago</strong>
      <AppIcon name="arrow-right" size="15" />
      <span>Confirmacion</span>
    </div>

    <section class="page-header">
      <p class="eyebrow">Checkout</p>
      <h1>Confirma tu compra</h1>
      <p>Revisa los productos antes de ir al pago seguro con Stripe.</p>
    </section>

    <p v-if="error || actionMessage" class="error">
      {{ error || actionMessage }}
    </p>

    <section v-if="loading" class="checkout-layout" aria-label="Cargando checkout">
      <div class="checkout-panel stack">
        <BaseSkeleton height="28px" width="40%" />
        <BaseSkeleton height="76px" rounded="lg" />
        <BaseSkeleton height="76px" rounded="lg" />
        <BaseSkeleton height="76px" rounded="lg" />
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
      <p>Agrega productos al carrito para poder iniciar el checkout.</p>
      <RouterLink :to="{ name: 'products' }">
        <BaseButton>
          Explorar productos
        </BaseButton>
      </RouterLink>
    </section>

    <section v-else class="checkout-layout">
      <div class="checkout-panel">
        <section class="checkout-block">
          <h2>Datos de la cuenta</h2>
          <div class="checkout-user">
            <AppIcon name="user" size="22" />
            <div>
              <strong>{{ userFullName || "Usuario" }}</strong>
              <span>{{ authStore.user?.email }}</span>
            </div>
          </div>
        </section>

        <section class="checkout-block">
          <h2>Productos</h2>

          <div class="checkout-items">
            <article
              v-for="item in cartItemsWithProducts"
              :key="item.id"
              class="checkout-item"
            >
              <img
                v-if="item.product.imageUrl"
                :src="item.product.imageUrl"
                :alt="item.product.name"
                loading="lazy"
              />
              <span v-else class="checkout-item__placeholder">
                <AppIcon name="package" size="24" />
              </span>

              <div>
                <h3>{{ item.product.name }}</h3>
                <p>{{ item.quantity }} x {{ formatCurrency(item.product.price) }}</p>
              </div>

              <strong>{{ formatCurrency(Number(item.product.price) * item.quantity) }}</strong>
            </article>
          </div>
        </section>
      </div>

      <OrderSummary
        :subtotal="totalPrice"
        :item-count="itemCount"
        primary-label="Ir al pago seguro"
        primary-loading-label="Preparando pago..."
        :primary-loading="checkoutLoading"
        :primary-disabled="!hasItems"
        secondary-label="Volver al carrito"
        :secondary-to="{ name: 'cart' }"
        trust-text="Pago procesado de forma segura con Stripe"
        @primary="startPayment"
      />
    </section>
  </main>
</template>
