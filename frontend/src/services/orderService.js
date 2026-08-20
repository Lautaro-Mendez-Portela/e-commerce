import { apiClient } from "./apiClient";

export const orderService = {
  createOrder() {
    return apiClient.post("/orders");
  },

  getMyOrders(params = {}) {
    return apiClient.get("/orders/my", {
      query: params,
    });
  },

  getOrderById(orderId) {
    return apiClient.get(`/orders/${orderId}`);
  },
};
