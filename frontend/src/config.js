const requiredVariables = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
};

const missingVariables = Object.entries(requiredVariables)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVariables.join(", ")}`
  );
}

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_URL = trimTrailingSlash(requiredVariables.VITE_API_URL);
