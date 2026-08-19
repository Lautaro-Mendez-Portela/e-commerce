import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { apiClient } from "../services/apiClient";

export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const loading = ref(false);
  const checkoutLoading = ref(false);
  const error = ref("");
  const successMessage = ref("");

  const itemCount = computed(() => items.value.length);

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => {
      return total + Number(item.product?.price || 0) * item.quantity;
    }, 0);
  });

  const resetMessages = () => {
    error.value = "";
    successMessage.value = "";
  };

  const reset = () => {
    items.value = [];
    loading.value = false;
    checkoutLoading.value = false;
    resetMessages();
  };

  const loadCart = async () => {
    try {
      loading.value = true;
      error.value = "";

      const data = await apiClient.get("/cart");

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

  const addItem = async (productId, quantity = 1) => {
    resetMessages();

    await apiClient.post("/cart", {
      productId,
      quantity,
    });

    successMessage.value = "Producto agregado al carrito";

    return loadCart();
  };

  const removeItem = async (cartItemId) => {
    resetMessages();

    await apiClient.delete(`/cart/${cartItemId}`);

    return loadCart();
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) {
      return null;
    }

    resetMessages();

    await apiClient.put(`/cart/${cartItemId}`, {
      quantity,
    });

    return loadCart();
  };

  const createCheckoutSession = async () => {
    try {
      checkoutLoading.value = true;
      resetMessages();

      const order = await apiClient.post("/orders");
      const session = await apiClient.post("/payments/checkout-session", {
        orderId: order.id,
      });

      return session;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      checkoutLoading.value = false;
    }
  };

  return {
    items,
    loading,
    checkoutLoading,
    error,
    successMessage,
    itemCount,
    totalPrice,
    loadCart,
    addItem,
    removeItem,
    updateQuantity,
    createCheckoutSession,
    reset,
    resetMessages,
  };
});
