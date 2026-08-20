<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

import AppIcon from "./AppIcon.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "close"]);

const closeButton = ref(null);
const titleId = `modal-title-${Math.random().toString(16).slice(2)}`;
const descriptionId = `modal-description-${Math.random().toString(16).slice(2)}`;

const close = () => {
  emit("update:modelValue", false);
  emit("close");
};

const handleKeydown = (event) => {
  if (event.key === "Escape") {
    close();
  }
};

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      window.addEventListener("keydown", handleKeydown);
      document.body.classList.add("has-open-drawer");

      await nextTick();
      closeButton.value?.focus();
      return;
    }

    window.removeEventListener("keydown", handleKeydown);
    document.body.classList.remove("has-open-drawer");
  }
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.classList.remove("has-open-drawer");
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-layer"
    >
      <button
        type="button"
        class="modal-backdrop"
        aria-label="Cerrar modal"
        @click="close"
      />

      <section
        class="base-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="description ? descriptionId : undefined"
      >
        <header class="base-modal__header">
          <div>
            <h2 :id="titleId">{{ title }}</h2>
            <p v-if="description" :id="descriptionId">
              {{ description }}
            </p>
          </div>

          <button
            ref="closeButton"
            type="button"
            class="icon-action"
            aria-label="Cerrar modal"
            @click="close"
          >
            <AppIcon name="close" size="18" />
          </button>
        </header>

        <div class="base-modal__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="base-modal__footer">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>
