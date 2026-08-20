<script setup>
import BaseButton from "./BaseButton.vue";
import BaseModal from "./BaseModal.vue";

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  confirmLabel: {
    type: String,
    default: "Confirmar",
  },
  cancelLabel: {
    type: String,
    default: "Cancelar",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  danger: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const close = () => {
  emit("update:modelValue", false);
  emit("cancel");
};
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    :description="message"
    @update:model-value="emit('update:modelValue', $event)"
    @close="emit('cancel')"
  >
    <template #footer>
      <BaseButton
        variant="secondary"
        :disabled="loading"
        @click="close"
      >
        {{ cancelLabel }}
      </BaseButton>

      <BaseButton
        :variant="danger ? 'danger' : 'primary'"
        :loading="loading"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
