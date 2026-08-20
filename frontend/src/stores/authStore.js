import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { apiClient, refreshAccessToken } from "../services/apiClient";
import { tokenStorage } from "../services/tokenStorage";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const accessToken = ref(tokenStorage.getAccessToken());
  const initialized = ref(false);
  const initializing = ref(false);
  const error = ref("");

  let initializationPromise = null;

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));
  const isAdmin = computed(() => user.value?.role === "ADMIN");

  const syncAccessToken = () => {
    accessToken.value = tokenStorage.getAccessToken();
  };

  const clearSession = () => {
    tokenStorage.clearTokens();
    accessToken.value = null;
    user.value = null;
    error.value = "";
  };

  const fetchCurrentUser = async () => {
    const currentUser = await apiClient.get("/users/me", {
      query: {
        page: 1,
        limit: 1,
      },
    });

    syncAccessToken();
    user.value = currentUser;
    initialized.value = true;

    return currentUser;
  };

  const login = async ({ email, password }) => {
    error.value = "";

    const tokens = await apiClient.post(
      "/auth/login",
      { email, password },
      {
        auth: false,
        skipAuthRefresh: true,
      }
    );

    tokenStorage.setTokens(tokens);
    syncAccessToken();

    return fetchCurrentUser();
  };

  const register = async ({ firstName, lastName, email, password }) => {
    error.value = "";

    await apiClient.post(
      "/auth/register",
      {
        firstName,
        lastName,
        email,
        password,
      },
      {
        auth: false,
        skipAuthRefresh: true,
      }
    );

    return login({ email, password });
  };

  const refreshSession = async () => {
    const newAccessToken = await refreshAccessToken();

    accessToken.value = newAccessToken;

    return fetchCurrentUser();
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    error.value = "";

    return apiClient.patch("/users/me/password", {
      currentPassword,
      newPassword,
    });
  };

  const initializeSession = async () => {
    if (initialized.value) {
      return user.value;
    }

    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      initializing.value = true;

      const storedAccessToken = tokenStorage.getAccessToken();
      const storedRefreshToken = tokenStorage.getRefreshToken();

      if (!storedAccessToken && !storedRefreshToken) {
        clearSession();
        initialized.value = true;
        return null;
      }

      accessToken.value = storedAccessToken;

      try {
        return await fetchCurrentUser();
      } catch {
        clearSession();
        return null;
      } finally {
        initialized.value = true;
        initializing.value = false;
        initializationPromise = null;
      }
    })();

    return initializationPromise;
  };

  const logout = () => {
    clearSession();
    initialized.value = true;
  };

  return {
    user,
    accessToken,
    initialized,
    initializing,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    changePassword,
    logout,
    clearSession,
    refreshSession,
    fetchCurrentUser,
    initializeSession,
    syncAccessToken,
  };
});
