<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 20,
  },
});
</script>

<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-if="name === 'menu'"
      d="M4 7h16M4 12h16M4 17h16"
    />
    <path
      v-else-if="name === 'close'"
      d="M6 6l12 12M18 6 6 18"
    />
    <path
      v-else-if="name === 'search'"
      d="m21 21-5.2-5.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
    />
    <path
      v-else-if="name === 'filter'"
      d="M4 6h16M7 12h10M10 18h4"
    />
    <path
      v-else-if="name === 'cart'"
      d="M6.5 6h14l-1.8 8.2a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.7L5.8 3.8H3"
    />
    <path
      v-else-if="name === 'plus'"
      d="M12 5v14M5 12h14"
    />
    <path
      v-else-if="name === 'minus'"
      d="M5 12h14"
    />
    <path
      v-else-if="name === 'trash'"
      d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
    />
    <path
      v-else-if="name === 'arrow-right'"
      d="M5 12h14M13 6l6 6-6 6"
    />
    <path
      v-else-if="name === 'lock'"
      d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6V11Z"
    />
    <path
      v-else-if="name === 'receipt'"
      d="M7 3h10v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V3Zm3 6h4M10 13h4"
    />
    <path
      v-else-if="name === 'refresh'"
      d="M20 12a8 8 0 0 1-13.7 5.7M4 12A8 8 0 0 1 17.7 6.3M18 3v4h-4M6 21v-4h4"
    />
    <path
      v-else-if="name === 'user'"
      d="M20 20a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
    />
    <path
      v-else-if="name === 'heart'"
      d="M20.4 5.6a5 5 0 0 0-7.1 0L12 6.9l-1.3-1.3a5 5 0 1 0-7.1 7.1L12 21l8.4-8.3a5 5 0 0 0 0-7.1Z"
    />
    <path
      v-else-if="name === 'shield'"
      d="M12 3 5 6v5.4c0 4.2 2.8 8.1 7 9.6 4.2-1.5 7-5.4 7-9.6V6l-7-3Z"
    />
    <path
      v-else-if="name === 'package'"
      d="m4 8 8-4 8 4-8 4-8-4Zm0 0v8l8 4m0-8v8m0-8 8-4v8l-8 4"
    />
    <path
      v-else-if="name === 'check'"
      d="m5 12 4 4L19 6"
    />
    <path
      v-else-if="name === 'info'"
      d="M12 17v-6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
    <path
      v-else-if="name === 'warning'"
      d="M12 9v4M12 17h.01M10.3 4.3 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.7 4.3a2 2 0 0 0-3.4 0Z"
    />
  </svg>
</template>
