import { createPinia, setActivePinia } from "pinia";

import { apiClient } from "../../src/services/apiClient";
import { useFavoritesStore } from "../../src/stores/favoritesStore";

vi.mock("../../src/services/apiClient", () => ({
  apiClient: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("favoritesStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("carga favoritos y calcula count", async () => {
    apiClient.get.mockResolvedValue([
      { productId: 1 },
      { productId: 2 },
    ]);

    const store = useFavoritesStore();

    await store.loadFavorites();

    expect(store.count).toBe(2);
    expect(store.isFavorite(1)).toBe(true);
  });

  it("agrega y quita favoritos segun estado actual", async () => {
    apiClient.get
      .mockResolvedValueOnce([{ productId: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ productId: 2 }]);
    apiClient.delete.mockResolvedValue({});
    apiClient.post.mockResolvedValue({});

    const store = useFavoritesStore();

    await store.loadFavorites();
    await store.toggleFavorite(1);
    await store.toggleFavorite(2);

    expect(apiClient.delete).toHaveBeenCalledWith("/favorites/1");
    expect(apiClient.post).toHaveBeenCalledWith("/favorites", { productId: 2 });
  });
});
