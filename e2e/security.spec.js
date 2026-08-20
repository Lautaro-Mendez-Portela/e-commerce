import { expect, test } from "@playwright/test";

import {
  login,
  mockApi,
} from "./helpers/mock-api";

test("USER intenta /admin y queda bloqueado", async ({ page }) => {
  await mockApi(page, { role: "USER" });
  await login(page);

  await page.goto("/admin");

  await expect(page).toHaveURL(/\/products/);
  await expect(page.getByRole("heading", { name: "Explora productos" })).toBeVisible();
});
