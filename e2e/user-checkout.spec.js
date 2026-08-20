import { expect, test } from "@playwright/test";

import {
  login,
  mockApi,
} from "./helpers/mock-api";

test("usuario: login, catalogo, producto, carrito y checkout", async ({ page }) => {
  await mockApi(page, { role: "USER" });
  await login(page);

  await expect(page).toHaveURL(/\/products/);
  await expect(page.getByRole("heading", { name: "Explora productos" })).toBeVisible();

  await page.getByRole("link", { name: "Auriculares Pro" }).click();
  await expect(page.getByRole("heading", { name: "Auriculares Pro" })).toBeVisible();

  await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
  await page.goto("/cart");

  await expect(page.getByRole("heading", { name: "Tu carrito" })).toBeVisible();
  await expect(page.getByText("Auriculares Pro")).toBeVisible();

  await page.getByRole("button", { name: "Continuar al checkout" }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole("heading", { name: "Confirma tu compra" })).toBeVisible();
});
