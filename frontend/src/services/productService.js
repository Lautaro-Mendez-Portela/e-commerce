import { apiClient } from "./apiClient";

export const productService = {
  getProducts(params = {}) {
    return apiClient.get("/products", {
      auth: false,
      query: params,
    });
  },

  getProductById(id) {
    return apiClient.get(`/products/${id}`, {
      auth: false,
    });
  },
};
