const request = require("../helpers/http");

describe("API docs", () => {
  it("sirve Swagger UI en /api/docs", async () => {
    const response = await request.get("/api/docs").expect(200);

    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("swagger-ui");
    expect(response.text).not.toContain("undefined");
  });

  it("expone un documento OpenAPI valido en /api/docs.json", async () => {
    const response = await request.get("/api/docs.json").expect(200);

    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.info.title).toBe("E-Commerce API");
    expect(response.body.paths["/auth/login"]).toBeDefined();
    expect(response.body.paths["/products"]).toBeDefined();
    expect(response.body.paths["/payments/webhook"]).toBeUndefined();
    expect(response.body.components.securitySchemes.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });
});
