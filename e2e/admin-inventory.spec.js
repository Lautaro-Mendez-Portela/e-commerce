import { expect, test } from "@playwright/test";

import {
  login,
  mockApi,
} from "./helpers/mock-api";

test("ADMIN: dashboard, inventario y edicion de stock", async ({ page }) => {
  await mockApi(page, { role: "ADMIN" });
  await login(page, "admin@test.local");

  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("link", { name: /Inventario/ }).click();
  await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();

  const stockInput = page.getByLabel("Nuevo stock").first();

  await stockInput.fill("7");
  await page.getByRole("button", { name: "Guardar" }).first().click();

  await expect(page.getByText("7 u.")).toBeVisible();
});
