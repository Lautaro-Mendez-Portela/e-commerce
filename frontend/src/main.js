import { createApp } from "vue";
import { createPinia } from "pinia";

import "./style.css";
import App from "./App.vue";
import { router } from "./router";
import { setSessionExpiredHandler } from "./services/apiClient";
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";
import { useFavoritesStore } from "./stores/favoritesStore";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

setSessionExpiredHandler(() => {
  const authStore = useAuthStore();
  const cartStore = useCartStore();
  const favoritesStore = useFavoritesStore();
  const currentRoute = router.currentRoute.value;

  authStore.clearSession();
  cartStore.reset();
  favoritesStore.reset();

  if (currentRoute.meta.requiresAuth && currentRoute.name !== "login") {
    router.push({
      name: "login",
      query: {
        redirect: currentRoute.fullPath,
      },
    });
  }
});

app.mount("#app");
