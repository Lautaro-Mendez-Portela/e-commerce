<script setup>
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
    <button
      :disabled="!pagination.hasPreviousPage"
      @click="changePage(pagination.page - 1)"
    >
      Anterior
    </button>

    <span>
      Pagina {{ pagination.page }} de {{ pagination.totalPages }}
    </span>

    <button
      :disabled="!pagination.hasNextPage"
      @click="changePage(pagination.page + 1)"
    >
      Siguiente
    </button>
  </div>
</template>
