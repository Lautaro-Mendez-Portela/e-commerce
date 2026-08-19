const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";

// Riesgo pendiente: localStorage sigue siendo sensible a XSS. Centralizarlo aca
// facilita migrar luego a cookies HttpOnly sin tocar componentes.
export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) {
      this.setAccessToken(accessToken);
    }

    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
