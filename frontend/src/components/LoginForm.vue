<script setup>
import { ref } from "vue";

const emit = defineEmits(["login-success"]);

const API_URL = "http://localhost:3000";

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const isRegistering = ref(false);

const resetMessage = () => {
  error.value = "";
};

const login = async () => {
  resetMessage();
  loading.value = true;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Credenciales invalidas");
    }

    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    emit("login-success");
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
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al registrar usuario");
    }

    await login();
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
  isRegistering.value = !isRegistering.value;
  resetMessage();
};
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

      <input v-model="password" type="password" placeholder="Contrasena" />

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
