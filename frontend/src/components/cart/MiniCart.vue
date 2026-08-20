<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import CartLineItem from "./CartLineItem.vue";
import AppIcon from "../ui/AppIcon.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseSkeleton from "../ui/BaseSkeleton.vue";
import { useCartStore } from "../../stores/cartStore";
import { useFeedbackStore } from "../../stores/feedbackStore";

const cartStore = useCartStore();
const feedbackStore = useFeedbackStore();
const {
  items,
  itemCount,
  totalPrice,
  loading,
  isMiniCartOpen,
} = storeToRefs(cartStore);

const closeButton = ref(null);
const titleId = "mini-cart-title";

const cartItemsWithProducts = computed(() => {
  return items.value.filter((item) => item.product);
});

const hasItems = computed(() => cartItemsWithProducts.value.length > 0);
const formattedTotal = computed(() => Number(totalPrice.value || 0).toFixed(2));

const close = () => {
  cartStore.closeMiniCart();
};

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
    await cartStore.updateQuantity(item.id, nextQuantity);
  } catch (error) {
    feedbackStore.error(error.message);
  }
};

const removeItem = async (item) => {
  if (cartStore.isItemBusy(item.id)) {
    return;
  }

  try {
    await cartStore.removeItem(item.id);
    feedbackStore.info("Producto eliminado del carrito");
  } catch (error) {
    feedbackStore.error(error.message);
  }
};

const handleKeydown = (event) => {
  if (event.key === "Escape") {
    close();
  }
};

watch(
  isMiniCartOpen,
  async (open) => {
    if (open) {
      window.addEventListener("keydown", handleKeydown);
      document.body.classList.add("has-open-drawer");

      await nextTick();
      closeButton.value?.focus();
      return;
    }

    window.removeEventListener("keydown", handleKeydown);
    document.body.classList.remove("has-open-drawer");
  }
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.classList.remove("has-open-drawer");
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isMiniCartOpen"
      class="mini-cart-layer"
    >
      <button
        type="button"
        class="mini-cart-backdrop"
        aria-label="Cerrar carrito"
        @click="close"
      />

      <aside
        id="mini-cart-panel"
        class="mini-cart"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <header class="mini-cart__header">
          <div>
            <p class="eyebrow">Carrito</p>
            <h2 :id="titleId">
              {{ itemCount }} {{ itemCount === 1 ? "producto" : "productos" }}
            </h2>
          </div>

          <button
            ref="closeButton"
            type="button"
            class="icon-action"
            aria-label="Cerrar carrito"
            @click="close"
          >
            <AppIcon name="close" size="20" />
          </button>
        </header>

        <div class="mini-cart__body">
          <template v-if="loading">
            <div
              v-for="index in 3"
              :key="`mini-cart-skeleton-${index}`"
              class="mini-cart__skeleton"
            >
              <BaseSkeleton height="72px" rounded="lg" />
              <BaseSkeleton height="18px" />
            </div>
          </template>

          <section v-else-if="!hasItems" class="mini-cart__empty">
            <AppIcon name="cart" size="36" />
            <h3>Tu carrito esta vacio</h3>
            <p>Explora el catalogo para sumar productos.</p>
            <RouterLink
              class="summary-link-button"
              :to="{ name: 'products' }"
              @click="close"
            >
              Explorar productos
            </RouterLink>
          </section>

          <template v-else>
            <CartLineItem
              v-for="item in cartItemsWithProducts"
              :key="item.id"
              :item="item"
              compact
              :loading="cartStore.isItemBusy(item.id)"
              @decrease="updateQuantity(item, item.quantity - 1)"
              @increase="updateQuantity(item, item.quantity + 1)"
              @remove="removeItem(item)"
            />
          </template>
        </div>

        <footer v-if="hasItems" class="mini-cart__footer">
          <div class="mini-cart__total">
            <span>Subtotal</span>
            <strong>$ {{ formattedTotal }}</strong>
          </div>

          <div class="mini-cart__actions">
            <RouterLink
              class="summary-link-button"
              :to="{ name: 'cart' }"
              @click="close"
            >
              Ver carrito
            </RouterLink>

            <RouterLink
              :to="{ name: 'checkout' }"
              @click="close"
            >
              <BaseButton block>
                Finalizar compra
                <AppIcon name="arrow-right" size="18" />
              </BaseButton>
            </RouterLink>
          </div>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>
