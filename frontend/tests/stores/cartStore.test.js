import { createPinia, setActivePinia } from "pinia";

import { apiClient } from "../../src/services/apiClient";
import { useCartStore } from "../../src/stores/cartStore";

vi.mock("../../src/services/apiClient", () => ({
  apiClient: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../../src/services/orderService", () => ({
  orderService: {
    createOrder: vi.fn(),
  },
}));

vi.mock("../../src/services/paymentService", () => ({
  paymentService: {
    createCheckoutSession: vi.fn(),
  },
}));

describe("cartStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("carga carrito y calcula badge/total", async () => {
    apiClient.get.mockResolvedValue([
      {
        id: 1,
        quantity: 2,
        product: { price: 10 },
      },
      {
        id: 2,
        quantity: 1,
        product: { price: 5.5 },
      },
    ]);

    const store = useCartStore();

    await store.loadCart();

    expect(store.loaded).toBe(true);
    expect(store.itemCount).toBe(3);
    expect(store.totalPrice).toBe(25.5);
  });

  it("agregar item llama API y recarga carrito", async () => {
    apiClient.post.mockResolvedValue({});
    apiClient.get.mockResolvedValue([]);

    const store = useCartStore();

    await store.addItem(10, 2);

    expect(apiClient.post).toHaveBeenCalledWith("/cart", {
      productId: 10,
      quantity: 2,
    });
    expect(apiClient.get).toHaveBeenCalledWith("/cart");
  });

  it("actualizar quantity invalida no llama API", async () => {
    const store = useCartStore();

    await expect(store.updateQuantity(1, 0)).resolves.toBeNull();

    expect(apiClient.put).not.toHaveBeenCalled();
  });

  it("actualiza y elimina item validos", async () => {
    apiClient.put.mockResolvedValue({});
    apiClient.delete.mockResolvedValue({});
    apiClient.get.mockResolvedValue([]);

    const store = useCartStore();

    await store.updateQuantity(1, 3);
    await store.removeItem(1);

    expect(apiClient.put).toHaveBeenCalledWith("/cart/1", { quantity: 3 });
    expect(apiClient.delete).toHaveBeenCalledWith("/cart/1");
  });
});
