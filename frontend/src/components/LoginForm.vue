<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import BaseButton from "./ui/BaseButton.vue";
import BaseInput from "./ui/BaseInput.vue";
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
      <header class="login-card__header">
        <h1>E-Commerce</h1>

        <p class="subtitle">
          {{ isRegistering ? "Crea tu cuenta" : "Inicia sesion para continuar" }}
        </p>
      </header>

      <form class="login-form" @submit.prevent="submit">
        <BaseInput
          v-if="isRegistering"
          v-model="firstName"
          label="Nombre"
          autocomplete="given-name"
        />

        <BaseInput
          v-if="isRegistering"
          v-model="lastName"
          label="Apellido"
          autocomplete="family-name"
        />

        <BaseInput
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
        />

        <BaseInput
          v-model="password"
          label="Contrasena"
          type="password"
          :autocomplete="isRegistering ? 'new-password' : 'current-password'"
        />

        <BaseButton type="submit" :loading="loading" block>
          {{
            isRegistering
              ? "Registrarme"
              : "Iniciar sesion"
          }}
        </BaseButton>
      </form>

      <BaseButton
        variant="ghost"
        :disabled="loading"
        block
        @click="toggleMode"
      >
        {{
          isRegistering
            ? "Ya tengo cuenta"
            : "Crear cuenta"
        }}
      </BaseButton>

      <p v-if="error" class="error">
        {{ error }}
      </p>
    </div>
  </div>
</template>
