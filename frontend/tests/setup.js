import { afterEach, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "http://api.test");

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
