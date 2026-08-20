import { apiClient } from "./apiClient";

export const paymentService = {
  createCheckoutSession(orderId) {
    return apiClient.post("/payments/checkout-session", {
      orderId,
    });
  },
};
