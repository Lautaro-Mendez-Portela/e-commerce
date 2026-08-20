import { apiClient } from "./apiClient";

export const orderService = {
  createOrder() {
    return apiClient.post("/orders");
  },

  getOrderById(orderId) {
    return apiClient.get(`/orders/${orderId}`);
  },
};
