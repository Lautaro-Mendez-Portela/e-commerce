describe("router guards", () => {
  const loadRouterWithStore = async () => {
    vi.resetModules();

    const { createPinia, setActivePinia } = await import("pinia");

    setActivePinia(createPinia());

    const { router } = await import("../../src/router");
    const { useAuthStore } = await import("../../src/stores/authStore");
    const authStore = useAuthStore();

    return {
      router,
      authStore,
    };
  };

  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("usuario anonimo: /profile -> /login", async () => {
    const { router } = await loadRouterWithStore();

    await router.push("/profile");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/profile");
  });

  it("USER: /admin bloqueado hacia productos", async () => {
    const { router, authStore } = await loadRouterWithStore();

    authStore.initialized = true;
    authStore.accessToken = "access-token";
    authStore.user = {
      id: 1,
      role: "USER",
    };

    await router.push("/admin");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("products");
  });

  it("ADMIN: /admin permitido", async () => {
    const { router, authStore } = await loadRouterWithStore();

    authStore.initialized = true;
    authStore.accessToken = "access-token";
    authStore.user = {
      id: 1,
      role: "ADMIN",
    };

    await router.push("/admin");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("admin");
  });

  it("usuario autenticado en /login redirige segun rol", async () => {
    const { router, authStore } = await loadRouterWithStore();

    authStore.initialized = true;
    authStore.accessToken = "access-token";
    authStore.user = {
      id: 1,
      role: "ADMIN",
    };

    await router.push("/login");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("admin");
  });
});
