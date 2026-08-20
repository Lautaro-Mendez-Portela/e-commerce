<script setup>
import BaseButton from "../ui/BaseButton.vue";

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
  <div class="pagination-controls">
    <BaseButton
      variant="secondary"
      size="sm"
      :disabled="!pagination.hasPreviousPage"
      @click="changePage(pagination.page - 1)"
    >
      Anterior
    </BaseButton>

    <span>
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
  </div>
</template>
