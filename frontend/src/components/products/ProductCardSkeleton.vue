<script setup>
import BaseCard from "../ui/BaseCard.vue";
import BaseSkeleton from "../ui/BaseSkeleton.vue";
</script>

<template>
  <BaseCard class="product-card">
    <BaseSkeleton height="180px" rounded="lg" />
    <div class="product-card__body">
      <BaseSkeleton width="44%" />
      <BaseSkeleton height="1.35rem" />
      <BaseSkeleton width="58%" />
      <BaseSkeleton width="40%" />
    </div>
    <BaseSkeleton height="44px" rounded="lg" />
  </BaseCard>
</template>
