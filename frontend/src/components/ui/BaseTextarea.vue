<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
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
  placeholder: {
    type: String,
    default: "",
  },
  rows: {
    type: [Number, String],
    default: 4,
  },
  error: {
    type: String,
    default: "",
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
    <textarea
      :id="fieldId"
      class="field-control"
      :class="{ 'is-invalid': error }"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :aria-invalid="Boolean(error)"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <small v-if="error" class="field-message">
      {{ error }}
    </small>
  </label>
</template>
