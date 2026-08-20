<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  label: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  placeholder: {
    type: String,
    default: "",
  },
  autocomplete: {
    type: String,
    default: "",
  },
  help: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  min: {
    type: [String, Number],
    default: undefined,
  },
  numeric: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const fieldId = computed(() => {
  return props.id || `field-${props.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
});

const messageId = computed(() => `${fieldId.value}-message`);

const updateValue = (event) => {
  const value = event.target.value;

  emit("update:modelValue", props.numeric && value !== "" ? Number(value) : value);
};
</script>

<template>
  <label class="form-field" :for="fieldId">
    <span>{{ label }}</span>
    <input
      :id="fieldId"
      class="field-control"
      :class="{ 'is-invalid': error }"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete || undefined"
      :disabled="disabled"
      :min="min"
      :aria-invalid="Boolean(error)"
      :aria-describedby="help || error ? messageId : undefined"
      @input="updateValue"
    />
    <small v-if="error || help" :id="messageId" class="field-message">
      {{ error || help }}
    </small>
  </label>
</template>
