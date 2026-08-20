import { ref } from "vue";
import { defineStore } from "pinia";

export const useFeedbackStore = defineStore("feedback", () => {
  const toasts = ref([]);

  const notify = ({ type = "info", message, timeout = 4000 }) => {
    if (!message) return null;

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    toasts.value.push({
      id,
      type,
      message,
    });

    if (timeout > 0) {
      window.setTimeout(() => dismiss(id), timeout);
    }

    return id;
  };

  const dismiss = (id) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  };

  const success = (message, options = {}) => notify({
    ...options,
    message,
    type: "success",
  });

  const error = (message, options = {}) => notify({
    ...options,
    message,
    type: "error",
  });

  const info = (message, options = {}) => notify({
    ...options,
    message,
    type: "info",
  });

  return {
    toasts,
    notify,
    success,
    error,
    info,
    dismiss,
  };
});
