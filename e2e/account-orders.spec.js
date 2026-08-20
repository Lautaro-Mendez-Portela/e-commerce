import { expect, test } from "@playwright/test";

import {
  login,
  mockApi,
} from "./helpers/mock-api";

test("cuenta: mis pedidos y detalle con estado visible", async ({ page }) => {
  await mockApi(page, { role: "USER" });
  await login(page);

  await page.goto("/orders");
  await expect(page.getByText("Pedido #1")).toBeVisible();
  await expect(page.getByText("Pago confirmado").first()).toBeVisible();

  await page.getByRole("link", { name: "Ver pedido" }).click();

  await expect(page).toHaveURL(/\/orders\/1/);
  await expect(page.getByText("Pedido #1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
  await expect(page.getByText("Pago confirmado").first()).toBeVisible();
});
