<script setup>
import { onMounted, reactive, ref } from "vue";

import AdminPageHeader from "./AdminPageHeader.vue";
import AppIcon from "../ui/AppIcon.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseInput from "../ui/BaseInput.vue";
import BaseSelect from "../ui/BaseSelect.vue";
import BaseSkeleton from "../ui/BaseSkeleton.vue";
import ConfirmModal from "../ui/ConfirmModal.vue";
import PaginationControls from "../ui/PaginationControls.vue";
import { apiClient } from "../../services/apiClient";
import { useFeedbackStore } from "../../stores/feedbackStore";
import { formatDateTime } from "../../utils/formatters";

const feedbackStore = useFeedbackStore();

const users = ref([]);
const loading = ref(false);
const savingIds = ref(new Set());
const errorMessage = ref("");
const userToToggle = ref(null);
const filters = reactive({
  search: "",
  role: "ALL",
  isActive: "ALL",
});
const roleInputs = reactive({});
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

const roleOptions = [
  { value: "ALL", label: "Todos" },
  { value: "USER", label: "Clientes" },
  { value: "ADMIN", label: "Administradores" },
];

const editableRoleOptions = [
  { value: "USER", label: "Cliente" },
  { value: "ADMIN", label: "Admin" },
];

const activeOptions = [
  { value: "ALL", label: "Todos" },
  { value: "true", label: "Activos" },
  { value: "false", label: "Inactivos" },
];

const setSaving = (id, saving) => {
  const nextIds = new Set(savingIds.value);

  if (saving) {
    nextIds.add(id);
  } else {
    nextIds.delete(id);
  }

  savingIds.value = nextIds;
};

const isSaving = (id) => savingIds.value.has(id);

const syncRoleInputs = () => {
  users.value.forEach((user) => {
    roleInputs[user.id] = user.role;
  });
};

const getUsers = async (page = pagination.value.page) => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const data = await apiClient.get("/users", {
      query: {
        page,
        limit: pagination.value.limit,
        search: filters.search.trim(),
        role: filters.role,
        isActive: filters.isActive === "ALL" ? undefined : filters.isActive,
      },
    });

    users.value = data.data || [];
    pagination.value = data.pagination || pagination.value;
    syncRoleInputs();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const updateRole = async (user) => {
  const nextRole = roleInputs[user.id];

  if (!nextRole || nextRole === user.role) {
    return;
  }

  try {
    setSaving(user.id, true);
    await apiClient.patch(`/users/${user.id}/role`, {
      role: nextRole,
    });
    feedbackStore.success("Rol actualizado");
    await getUsers(pagination.value.page);
  } catch (error) {
    roleInputs[user.id] = user.role;
    feedbackStore.error(error.message);
  } finally {
    setSaving(user.id, false);
  }
};

const askToggleStatus = (user) => {
  userToToggle.value = user;
};

const toggleStatus = async () => {
  if (!userToToggle.value) {
    return;
  }

  const targetUser = userToToggle.value;

  try {
    setSaving(targetUser.id, true);
    await apiClient.patch(`/users/${targetUser.id}/status`, {
      isActive: !targetUser.isActive,
    });
    feedbackStore.success(targetUser.isActive ? "Usuario desactivado" : "Usuario reactivado");
    userToToggle.value = null;
    await getUsers(pagination.value.page);
  } catch (error) {
    feedbackStore.error(error.message);
  } finally {
    setSaving(targetUser.id, false);
  }
};

const changePage = (page) => {
  getUsers(page);
};

const applyFilters = () => {
  getUsers(1);
};

const clearFilters = () => {
  filters.search = "";
  filters.role = "ALL";
  filters.isActive = "ALL";
  getUsers(1);
};

const userName = (user) => {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return name || "Sin nombre";
};

onMounted(() => {
  getUsers();
});
</script>

<template>
  <section class="admin-view">
    <AdminPageHeader
      title="Usuarios"
      description="Administra roles y estado de acceso sin exponer datos sensibles."
    />

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <section class="admin-filter-panel">
      <BaseInput
        v-model="filters.search"
        label="Buscar"
        placeholder="Nombre o email"
      />
      <BaseSelect v-model="filters.role" label="Rol" :options="roleOptions" />
      <BaseSelect v-model="filters.isActive" label="Estado" :options="activeOptions" />
      <BaseButton @click="applyFilters">Filtrar</BaseButton>
      <BaseButton variant="secondary" @click="clearFilters">Limpiar</BaseButton>
    </section>

    <section v-if="loading" class="admin-card-list" aria-label="Cargando usuarios">
      <BaseSkeleton
        v-for="index in 4"
        :key="`user-row-${index}`"
        height="88px"
        rounded="lg"
      />
    </section>

    <section v-else-if="users.length === 0" class="empty-state">
      <AppIcon name="users" size="42" />
      <h2>No hay usuarios para este filtro</h2>
      <p>Modifica la busqueda, el rol o el estado de cuenta.</p>
      <BaseButton variant="outline" @click="clearFilters">
        Limpiar filtros
      </BaseButton>
    </section>

    <section v-else class="admin-resource-table" aria-label="Usuarios">
      <div class="admin-resource-row admin-resource-row--header">
        <span>Usuario</span>
        <span>Email</span>
        <span>Rol</span>
        <span>Estado</span>
        <span>Alta</span>
        <span>Acciones</span>
      </div>

      <article
        v-for="user in users"
        :key="user.id"
        class="admin-resource-row"
      >
        <div class="resource-product">
          <span class="resource-product__placeholder">
            <AppIcon name="user" size="22" />
          </span>
          <div>
            <strong>{{ userName(user) }}</strong>
            <span>#{{ user.id }}</span>
          </div>
        </div>

        <span>{{ user.email }}</span>

        <form class="admin-inline-form" @submit.prevent="updateRole(user)">
          <BaseSelect
            v-model="roleInputs[user.id]"
            label="Rol"
            :options="editableRoleOptions"
            :disabled="isSaving(user.id) || !user.isActive"
          />
          <BaseButton
            type="submit"
            size="sm"
            variant="outline"
            :loading="isSaving(user.id)"
            :disabled="roleInputs[user.id] === user.role || !user.isActive"
          >
            Guardar
          </BaseButton>
        </form>

        <span
          class="resource-status"
          :class="user.isActive ? 'resource-status--active' : 'resource-status--inactive'"
        >
          {{ user.isActive ? "Activo" : "Inactivo" }}
        </span>

        <span>{{ formatDateTime(user.createdAt) }}</span>

        <div class="admin-row-actions">
          <BaseButton
            :variant="user.isActive ? 'danger' : 'outline'"
            size="sm"
            :loading="isSaving(user.id)"
            @click="askToggleStatus(user)"
          >
            {{ user.isActive ? "Desactivar" : "Reactivar" }}
          </BaseButton>
        </div>
      </article>
    </section>

    <PaginationControls
      v-if="pagination.total > 0"
      :pagination="pagination"
      @change-page="changePage"
    />

    <ConfirmModal
      :model-value="Boolean(userToToggle)"
      :title="userToToggle?.isActive ? 'Desactivar usuario' : 'Reactivar usuario'"
      :message="userToToggle?.isActive
        ? `El usuario ${userToToggle?.email || ''} no podra operar hasta ser reactivado.`
        : `El usuario ${userToToggle?.email || ''} recuperara acceso.`
      "
      :confirm-label="userToToggle?.isActive ? 'Desactivar' : 'Reactivar'"
      :danger="Boolean(userToToggle?.isActive)"
      :loading="Boolean(userToToggle && isSaving(userToToggle.id))"
      @update:model-value="userToToggle = $event ? userToToggle : null"
      @confirm="toggleStatus"
      @cancel="userToToggle = null"
    />
  </section>
</template>
