import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { apiClient } from "../services/apiClient";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";

export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const loading = ref(false);
  const checkoutLoading = ref(false);
  const loaded = ref(false);
  const isMiniCartOpen = ref(false);
  const itemActionIds = ref(new Set());
  const pendingCheckoutOrder = ref(null);
  const error = ref("");
  const successMessage = ref("");

  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + Number(item.quantity || 0), 0);
  });

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => {
      return total + Number(item.product?.price || 0) * item.quantity;
    }, 0);
  });

  const hasItems = computed(() => items.value.length > 0);

  const setItemBusy = (cartItemId, busy) => {
    const nextIds = new Set(itemActionIds.value);

    if (busy) {
      nextIds.add(cartItemId);
    } else {
      nextIds.delete(cartItemId);
    }

    itemActionIds.value = nextIds;
  };

  const isItemBusy = (cartItemId) => {
    return itemActionIds.value.has(cartItemId);
  };

  const invalidatePendingCheckout = () => {
    pendingCheckoutOrder.value = null;
  };

  const shouldRefreshCartAfterError = (err) => {
    return [
      "CART_ITEM_NOT_FOUND",
      "EMPTY_CART",
      "INSUFFICIENT_STOCK",
      "INVALID_CART_QUANTITY",
      "PRODUCT_NOT_FOUND",
    ].includes(err?.code);
  };

  const resetMessages = () => {
    error.value = "";
    successMessage.value = "";
  };

  const reset = () => {
    items.value = [];
    loading.value = false;
    checkoutLoading.value = false;
    loaded.value = false;
    isMiniCartOpen.value = false;
    itemActionIds.value = new Set();
    pendingCheckoutOrder.value = null;
    resetMessages();
  };

  const openMiniCart = () => {
    isMiniCartOpen.value = true;

    if (!loaded.value && !loading.value) {
      loadCart().catch(() => {});
    }
  };

  const closeMiniCart = () => {
    isMiniCartOpen.value = false;
  };

  const toggleMiniCart = () => {
    if (isMiniCartOpen.value) {
      closeMiniCart();
      return;
    }

    openMiniCart();
  };

  const loadCart = async () => {
    try {
      loading.value = true;
      error.value = "";

      const data = await apiClient.get("/cart");

      items.value = Array.isArray(data) ? data : [];
      loaded.value = true;

      return items.value;
    } catch (err) {
      items.value = [];
      error.value = err.message;
      loaded.value = false;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const addItem = async (productId, quantity = 1) => {
    resetMessages();

    try {
      await apiClient.post("/cart", {
        productId,
        quantity,
      });

      invalidatePendingCheckout();
      successMessage.value = "Producto agregado al carrito";

      return await loadCart();
    } catch (err) {
      if (shouldRefreshCartAfterError(err)) {
        await loadCart().catch(() => {});
      }

      throw err;
    }
  };

  const removeItem = async (cartItemId) => {
    if (isItemBusy(cartItemId)) {
      return null;
    }

    resetMessages();
    setItemBusy(cartItemId, true);

    try {
      await apiClient.delete(`/cart/${cartItemId}`);
      invalidatePendingCheckout();

      return await loadCart();
    } catch (err) {
      if (shouldRefreshCartAfterError(err)) {
        await loadCart().catch(() => {});
      }

      throw err;
    } finally {
      setItemBusy(cartItemId, false);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    const nextQuantity = Number(quantity);

    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      return null;
    }

    if (isItemBusy(cartItemId)) {
      return null;
    }

    resetMessages();
    setItemBusy(cartItemId, true);

    try {
      await apiClient.put(`/cart/${cartItemId}`, {
        quantity: nextQuantity,
      });
      invalidatePendingCheckout();

      return await loadCart();
    } catch (err) {
      if (shouldRefreshCartAfterError(err)) {
        await loadCart().catch(() => {});
      }

      throw err;
    } finally {
      setItemBusy(cartItemId, false);
    }
  };

  const startCheckout = async () => {
    if (checkoutLoading.value) {
      return null;
    }

    try {
      checkoutLoading.value = true;
      resetMessages();

      if (items.value.length === 0) {
        throw new Error("Tu carrito esta vacio");
      }

      const order = pendingCheckoutOrder.value?.status === "PENDING"
        ? pendingCheckoutOrder.value
        : await orderService.createOrder();

      pendingCheckoutOrder.value = order;

      const session = await paymentService.createCheckoutSession(order.id);

      return {
        order,
        session,
      };
    } catch (err) {
      error.value = err.message;

      if (shouldRefreshCartAfterError(err)) {
        pendingCheckoutOrder.value = null;
        await loadCart().catch(() => {});
      }

      throw err;
    } finally {
      checkoutLoading.value = false;
    }
  };

  return {
    items,
    loading,
    checkoutLoading,
    loaded,
    isMiniCartOpen,
    itemActionIds,
    pendingCheckoutOrder,
    error,
    successMessage,
    itemCount,
    totalPrice,
    hasItems,
    isItemBusy,
    loadCart,
    addItem,
    removeItem,
    updateQuantity,
    startCheckout,
    createCheckoutSession: startCheckout,
    openMiniCart,
    closeMiniCart,
    toggleMiniCart,
    reset,
    resetMessages,
  };
});
