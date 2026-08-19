<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "../stores/authStore";

const props = defineProps({
  initialMode: {
    type: String,
    default: "login",
  },
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const isRegistering = ref(props.initialMode === "register");

const resetMessage = () => {
  error.value = "";
};

const redirectAfterAuth = () => {
  const redirectTo =
    typeof route.query.redirect === "string"
      ? route.query.redirect
      : authStore.isAdmin
        ? "/admin"
        : "/products";

  router.replace(redirectTo);
};

const login = async () => {
  resetMessage();
  loading.value = true;

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });

    redirectAfterAuth();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const register = async () => {
  resetMessage();
  loading.value = true;

  try {
    await authStore.register({
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
    });

    redirectAfterAuth();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const submit = () => {
  if (isRegistering.value) {
    register();
    return;
  }

  login();
};

const toggleMode = () => {
  resetMessage();

  router.push({
    name: isRegistering.value ? "login" : "register",
    query: route.query,
  });
};

watch(
  () => props.initialMode,
  (mode) => {
    isRegistering.value = mode === "register";
    resetMessage();
  }
);
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>E-Commerce</h1>

      <p class="subtitle">
        {{ isRegistering ? "Crea tu cuenta" : "Inicia sesion para continuar" }}
      </p>

      <input
        v-if="isRegistering"
        v-model="firstName"
        placeholder="Nombre"
      />

      <input
        v-if="isRegistering"
        v-model="lastName"
        placeholder="Apellido"
      />

      <input v-model="email" type="email" placeholder="Email" />

      <input v-model="password" type="password" placeholder="Contraseña" />

      <button @click="submit" :disabled="loading">
        {{
          loading
            ? "Procesando..."
            : isRegistering
              ? "Registrarme"
              : "Iniciar sesion"
        }}
      </button>

      <button class="link-btn" @click="toggleMode" :disabled="loading">
        {{
          isRegistering
            ? "Ya tengo cuenta"
            : "Crear cuenta"
        }}
      </button>

      <p v-if="error" class="error">
        {{ error }}
      </p>
    </div>
  </div>
</template>
