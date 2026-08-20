<script setup>
import { computed, reactive, ref } from "vue";
import { storeToRefs } from "pinia";

import AccountLayout from "./account/AccountLayout.vue";
import BaseButton from "./ui/BaseButton.vue";
import BaseInput from "./ui/BaseInput.vue";
import BaseSkeleton from "./ui/BaseSkeleton.vue";
import { useAuthStore } from "../stores/authStore";
import { useFeedbackStore } from "../stores/feedbackStore";
import { formatDate } from "../utils/formatters";

const authStore = useAuthStore();
const feedbackStore = useFeedbackStore();
const { user, initializing } = storeToRefs(authStore);

const loading = ref(false);
const passwordLoading = ref(false);
const errorMessage = ref("");
const passwordMessage = ref("");
const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
});

const fullName = computed(() => {
  const firstName = user.value?.firstName || "";
  const lastName = user.value?.lastName || "";

  return `${firstName} ${lastName}`.trim() || "Usuario";
});

const showAdminRole = computed(() => user.value?.role === "ADMIN");

const loadProfile = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    await authStore.fetchCurrentUser();
  } catch (error) {
    errorMessage.value = "No pudimos cargar tu perfil.";
    feedbackStore.error(error.message);
  } finally {
    loading.value = false;
  }
};

const resetPasswordForm = () => {
  passwordForm.currentPassword = "";
  passwordForm.newPassword = "";
};

const submitPassword = async () => {
  if (passwordLoading.value) {
    return;
  }

  try {
    passwordLoading.value = true;
    passwordMessage.value = "";

    await authStore.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    resetPasswordForm();
    passwordMessage.value = "Contrasena actualizada correctamente.";
    feedbackStore.success(passwordMessage.value);
  } catch (error) {
    passwordMessage.value = error.message;
    feedbackStore.error(error.message);
  } finally {
    passwordLoading.value = false;
  }
};

if (!user.value) {
  loadProfile();
}
</script>

<template>
  <AccountLayout>
    <div class="account-stack">
      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
      </p>

      <section v-if="loading || initializing" class="profile-card account-card">
        <BaseSkeleton width="40%" height="28px" />
        <BaseSkeleton height="72px" rounded="lg" />
        <BaseSkeleton height="72px" rounded="lg" />
      </section>

      <template v-else-if="user">
        <section class="profile-card account-card profile-overview">
          <div class="profile-avatar" aria-hidden="true">
            {{ fullName.slice(0, 1).toUpperCase() }}
          </div>

          <div class="profile-overview__content">
            <p class="eyebrow">Datos personales</p>
            <h2>{{ fullName }}</h2>
            <p>{{ user.email }}</p>
          </div>
        </section>

        <section class="account-card">
          <h2>Informacion de cuenta</h2>

          <dl class="account-details">
            <div>
              <dt>Nombre</dt>
              <dd>{{ user.firstName || "No informado" }}</dd>
            </div>
            <div>
              <dt>Apellido</dt>
              <dd>{{ user.lastName || "No informado" }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ user.email }}</dd>
            </div>
            <div v-if="showAdminRole">
              <dt>Rol</dt>
              <dd>Administrador</dd>
            </div>
            <div>
              <dt>Fecha de registro</dt>
              <dd>{{ formatDate(user.createdAt) }}</dd>
            </div>
          </dl>
        </section>

        <section class="account-card">
          <div class="account-card__header">
            <div>
              <h2>Seguridad</h2>
              <p>Cambia tu contrasena usando tu contrasena actual.</p>
            </div>
          </div>

          <form class="security-form" @submit.prevent="submitPassword">
            <BaseInput
              v-model="passwordForm.currentPassword"
              label="Contrasena actual"
              type="password"
              autocomplete="current-password"
              :disabled="passwordLoading"
            />

            <BaseInput
              v-model="passwordForm.newPassword"
              label="Nueva contrasena"
              type="password"
              autocomplete="new-password"
              help="Minimo 8 caracteres."
              :disabled="passwordLoading"
            />

            <p v-if="passwordMessage" class="field-message">
              {{ passwordMessage }}
            </p>

            <BaseButton
              type="submit"
              :loading="passwordLoading"
              :disabled="passwordForm.currentPassword.length === 0 || passwordForm.newPassword.length < 8"
            >
              Actualizar contrasena
            </BaseButton>
          </form>
        </section>
      </template>

      <section v-else class="empty-state">
        <h2>No pudimos cargar tu perfil</h2>
        <p>Intenta nuevamente en unos segundos.</p>
        <BaseButton @click="loadProfile">
          Reintentar
        </BaseButton>
      </section>
    </div>
  </AccountLayout>
</template>
