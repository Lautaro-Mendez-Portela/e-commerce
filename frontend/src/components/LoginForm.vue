<script setup>
import { ref } from "vue";

const emit = defineEmits([
  "login-success"
]);

const API_URL =
  "http://localhost:3000";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const login = async () => {

  error.value = "";
  loading.value = true;

  try {

    const response =
      await fetch(
        `${API_URL}/auth/login`,
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            email: email.value,
            password:
              password.value
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Credenciales inválidas"
      );

    }

    localStorage.setItem(
      "token",
      data.accessToken
    );

    localStorage.setItem(
      "refreshToken",
      data.refreshToken
    );

    emit(
      "login-success"
    );

  } catch (err) {

    error.value =
      err.message;

  } finally {

    loading.value = false;

  }

};
</script>

<template>

  <div class="login-page">

    <div class="login-card">

      <h1>
        🛒 E-Commerce
      </h1>

      <p class="subtitle">
        Iniciá sesión para continuar
      </p>

      <input
        v-model="email"
        type="email"
        placeholder="Email"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Contraseña"
      />

      <button
        @click="login"
        :disabled="loading"
      >
        {{
          loading
            ? "Ingresando..."
            : "Iniciar sesión"
        }}
      </button>

      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>

    </div>

  </div>

</template>