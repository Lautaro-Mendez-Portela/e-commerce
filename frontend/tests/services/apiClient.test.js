const jsonResponse = (status, body) => Promise.resolve({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers({ "content-type": "application/json" }),
  json: () => Promise.resolve(body),
});

describe("apiClient refresh flow", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it("ante 401 refresca token y reintenta la request original", async () => {
    const { apiClient } = await import("../../src/services/apiClient");

    localStorage.setItem("token", "old-access");
    localStorage.setItem("refreshToken", "refresh-token");

    fetch
      .mockResolvedValueOnce(await jsonResponse(401, {
        error: { code: "TOKEN_EXPIRED", message: "expirado" },
      }))
      .mockResolvedValueOnce(await jsonResponse(200, {
        accessToken: "new-access",
      }))
      .mockResolvedValueOnce(await jsonResponse(200, {
        ok: true,
      }));

    await expect(apiClient.get("/secure")).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[1][0]).toContain("/auth/refresh");
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe("Bearer new-access");
    expect(localStorage.getItem("token")).toBe("new-access");
  });

  it("comparte un solo refresh para 401 simultaneos", async () => {
    const { apiClient } = await import("../../src/services/apiClient");

    localStorage.setItem("token", "old-access");
    localStorage.setItem("refreshToken", "refresh-token");

    fetch
      .mockResolvedValueOnce(await jsonResponse(401, {
        error: { code: "TOKEN_EXPIRED", message: "expirado" },
      }))
      .mockResolvedValueOnce(await jsonResponse(401, {
        error: { code: "TOKEN_EXPIRED", message: "expirado" },
      }))
      .mockResolvedValueOnce(await jsonResponse(200, {
        accessToken: "shared-access",
      }))
      .mockResolvedValueOnce(await jsonResponse(200, {
        request: "a",
      }))
      .mockResolvedValueOnce(await jsonResponse(200, {
        request: "b",
      }));

    const [first, second] = await Promise.all([
      apiClient.get("/a"),
      apiClient.get("/b"),
    ]);

    expect(first).toEqual({ request: "a" });
    expect(second).toEqual({ request: "b" });

    const refreshCalls = fetch.mock.calls.filter(([url]) => {
      return String(url).includes("/auth/refresh");
    });

    expect(refreshCalls).toHaveLength(1);
  });

  it("si falla refresh limpia sesion y no entra en loop", async () => {
    const { apiClient, setSessionExpiredHandler } = await import("../../src/services/apiClient");
    const onExpired = vi.fn();

    setSessionExpiredHandler(onExpired);
    localStorage.setItem("token", "old-access");
    localStorage.setItem("refreshToken", "bad-refresh");

    fetch
      .mockResolvedValueOnce(await jsonResponse(401, {
        error: { code: "TOKEN_EXPIRED", message: "expirado" },
      }))
      .mockResolvedValueOnce(await jsonResponse(401, {
        error: { code: "INVALID_REFRESH_TOKEN", message: "refresh invalido" },
      }));

    await expect(apiClient.get("/secure")).rejects.toMatchObject({
      status: 401,
      code: "INVALID_REFRESH_TOKEN",
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});
