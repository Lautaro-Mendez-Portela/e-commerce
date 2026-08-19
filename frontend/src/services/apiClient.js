import { API_URL } from "../config";
import { tokenStorage } from "./tokenStorage";

let refreshPromise = null;
let sessionExpiredHandler = null;

export class ApiError extends Error {
  constructor({ status, code, message, payload }) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export const setSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = handler;
};

const normalizePath = (path) => {
  return path.startsWith("/") ? path : `/${path}`;
};

const buildUrl = (path, query) => {
  const url = new URL(`${API_URL}${normalizePath(path)}`);

  if (!query) {
    return url.toString();
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, item));
      return;
    }

    url.searchParams.set(key, value);
  });

  return url.toString();
};

const parseResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text ? { message: text } : null;
};

const createApiError = (response, payload) => {
  const backendError = payload?.error;

  if (backendError && typeof backendError === "object") {
    return new ApiError({
      status: response.status,
      code: backendError.code || `HTTP_${response.status}`,
      message: backendError.message || "Ocurrio un error inesperado",
      payload,
    });
  }

  return new ApiError({
    status: response.status,
    code: payload?.code || `HTTP_${response.status}`,
    message:
      (typeof backendError === "string" && backendError) ||
      payload?.message ||
      "Ocurrio un error inesperado",
    payload,
  });
};

export const refreshAccessToken = async () => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    const error = new ApiError({
      status: 401,
      code: "REFRESH_TOKEN_MISSING",
      message: "Sesion expirada",
    });

    tokenStorage.clearTokens();
    sessionExpiredHandler?.(error);

    throw error;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const payload = await parseResponse(response);

      if (!response.ok || !payload?.accessToken) {
        throw createApiError(response, payload);
      }

      tokenStorage.setAccessToken(payload.accessToken);

      return payload.accessToken;
    })()
      .catch((error) => {
        tokenStorage.clearTokens();
        sessionExpiredHandler?.(error);

        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const apiRequest = async (path, options = {}) => {
  const {
    method = "GET",
    body,
    headers = {},
    auth = true,
    skipAuthRefresh = false,
    retry = false,
    query,
    signal,
  } = options;

  const requestHeaders = { ...headers };
  let requestBody = body;

  if (
    body !== undefined &&
    !(body instanceof FormData) &&
    typeof body !== "string"
  ) {
    requestHeaders["Content-Type"] =
      requestHeaders["Content-Type"] || "application/json";
    requestBody = JSON.stringify(body);
  }

  if (auth) {
    const token = tokenStorage.getAccessToken();

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal,
  });

  const payload = await parseResponse(response);

  if (response.ok) {
    return payload;
  }

  const error = createApiError(response, payload);

  if (
    response.status === 401 &&
    auth &&
    !skipAuthRefresh &&
    !retry
  ) {
    if (tokenStorage.getRefreshToken()) {
      await refreshAccessToken();

      return apiRequest(path, {
        ...options,
        retry: true,
      });
    }

    tokenStorage.clearTokens();
    sessionExpiredHandler?.(error);
  }

  throw error;
};

export const apiClient = {
  request: apiRequest,

  get(path, options = {}) {
    return apiRequest(path, {
      ...options,
      method: "GET",
    });
  },

  post(path, body, options = {}) {
    return apiRequest(path, {
      ...options,
      method: "POST",
      body,
    });
  },

  put(path, body, options = {}) {
    return apiRequest(path, {
      ...options,
      method: "PUT",
      body,
    });
  },

  patch(path, body, options = {}) {
    return apiRequest(path, {
      ...options,
      method: "PATCH",
      body,
    });
  },

  delete(path, options = {}) {
    return apiRequest(path, {
      ...options,
      method: "DELETE",
    });
  },
};
