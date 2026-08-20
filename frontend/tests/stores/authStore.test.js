import { createPinia, setActivePinia } from "pinia";

import { apiClient, refreshAccessToken } from "../../src/services/apiClient";
import { useAuthStore } from "../../src/stores/authStore";

vi.mock("../../src/services/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
  refreshAccessToken: vi.fn(),
}));

describe("authStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("login exitoso guarda tokens y carga usuario actual", async () => {
    apiClient.post.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    apiClient.get.mockResolvedValue({
      id: 1,
      email: "admin@test.local",
      role: "ADMIN",
    });

    const store = useAuthStore();
    const user = await store.login({
      email: "admin@test.local",
      password: "Password123!",
    });

    expect(user.role).toBe("ADMIN");
    expect(store.isAuthenticated).toBe(true);
    expect(store.isAdmin).toBe(true);
    expect(localStorage.getItem("token")).toBe("access-token");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-token");
  });

  it("logout limpia usuario y tokens", () => {
    const store = useAuthStore();

    localStorage.setItem("token", "access-token");
    localStorage.setItem("refreshToken", "refresh-token");
    store.user = { id: 1, role: "USER" };
    store.accessToken = "access-token";

    store.logout();

    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("sesion invalida durante inicializacion limpia estado", async () => {
    localStorage.setItem("token", "stale-access");
    localStorage.setItem("refreshToken", "stale-refresh");
    apiClient.get.mockRejectedValue(new Error("Sesion expirada"));

    const store = useAuthStore();
    const result = await store.initializeSession();

    expect(result).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("refreshSession actualiza access token y usuario", async () => {
    refreshAccessToken.mockImplementation(async () => {
      localStorage.setItem("token", "new-access");
      return "new-access";
    });
    apiClient.get.mockResolvedValue({
      id: 1,
      role: "USER",
    });

    const store = useAuthStore();
    const user = await store.refreshSession();

    expect(user.id).toBe(1);
    expect(store.accessToken).toBe("new-access");
  });
});
