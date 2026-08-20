<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import AppIcon from "../ui/AppIcon.vue";

const route = useRoute();

const links = [
  {
    name: "profile",
    label: "Perfil",
    icon: "user",
  },
  {
    name: "orders",
    label: "Mis pedidos",
    icon: "receipt",
  },
  {
    name: "favorites",
    label: "Favoritos",
    icon: "heart",
  },
];

const activeLabel = computed(() => {
  const activeLink = links.find((link) => {
    if (link.name === "orders") {
      return route.name === "orders" || route.name === "order-detail";
    }

    return route.name === link.name;
  });

  return activeLink?.label || "Mi cuenta";
});
</script>

<template>
  <main class="account-page page-shell">
    <header class="page-header account-page__header">
      <div>
        <p class="eyebrow">Mi cuenta</p>
        <h1>{{ activeLabel }}</h1>
        <p>Gestiona tu informacion, favoritos y pedidos recientes.</p>
      </div>
    </header>

    <div class="account-layout">
      <nav class="account-nav" aria-label="Navegacion de cuenta">
        <RouterLink
          v-for="link in links"
          :key="link.name"
          :to="{ name: link.name }"
          :class="{
            active: link.name === 'orders'
              ? route.name === 'orders' || route.name === 'order-detail'
              : route.name === link.name
          }"
        >
          <AppIcon :name="link.icon" size="18" />
          {{ link.label }}
        </RouterLink>
      </nav>

      <section class="account-content">
        <slot />
      </section>
    </div>
  </main>
</template>
