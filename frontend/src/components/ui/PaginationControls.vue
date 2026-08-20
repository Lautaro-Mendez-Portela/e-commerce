<script setup>
import BaseButton from "./BaseButton.vue";

const props = defineProps({
  pagination: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["change-page"]);

const changePage = (page) => {
  if (
    page < 1 ||
    page > props.pagination.totalPages ||
    page === props.pagination.page
  ) {
    return;
  }

  emit("change-page", page);
};
</script>

<template>
  <nav class="pagination-controls" aria-label="Paginacion">
    <BaseButton
      variant="secondary"
      size="sm"
      :disabled="!pagination.hasPreviousPage"
      @click="changePage(pagination.page - 1)"
    >
      Anterior
    </BaseButton>

    <span aria-live="polite">
      Pagina {{ pagination.page }} de {{ pagination.totalPages }}
    </span>

    <BaseButton
      variant="secondary"
      size="sm"
      :disabled="!pagination.hasNextPage"
      @click="changePage(pagination.page + 1)"
    >
      Siguiente
    </BaseButton>
  </nav>
</template>
