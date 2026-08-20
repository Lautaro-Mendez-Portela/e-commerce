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
  options: {
    type: Array,
    required: true,
  },
  error: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const fieldId = computed(() => {
  return props.id || `field-${props.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
});
</script>

<template>
  <label class="form-field" :for="fieldId">
    <span>{{ label }}</span>
    <select
      :id="fieldId"
      class="field-control"
      :class="{ 'is-invalid': error }"
      :value="modelValue"
      :disabled="disabled"
      :aria-invalid="Boolean(error)"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <small v-if="error" class="field-message">
      {{ error }}
    </small>
  </label>
</template>
