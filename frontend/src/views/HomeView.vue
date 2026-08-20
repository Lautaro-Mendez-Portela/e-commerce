<script setup>
import { onMounted, ref } from "vue";

import heroImage from "../assets/hero.png";
import ProductCard from "../components/products/ProductCard.vue";
import ProductCardSkeleton from "../components/products/ProductCardSkeleton.vue";
import AppIcon from "../components/ui/AppIcon.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import { productService } from "../services/productService";

const featuredProducts = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const benefits = [
  {
    icon: "shield",
    title: "Pago seguro",
    text: "Flujo de pago protegido e integrado con Stripe.",
  },
  {
    icon: "cart",
    title: "Compra simple",
    text: "Agrega productos al carrito y continua al pago sin pasos innecesarios.",
  },
  {
    icon: "package",
    title: "Seguimiento de pedidos",
    text: "Consulta tus ordenes y su estado desde tu cuenta.",
  },
];

const loadFeaturedProducts = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    const response = await productService.getProducts({
      page: 1,
      limit: 4,
      sort: "newest",
      inStock: true,
    });

    featuredProducts.value = response.data || [];
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadFeaturedProducts();
});
</script>

<template>
  <main class="home-page">
    <section class="home-hero container">
      <div class="home-hero__content">
        <p class="eyebrow">E-commerce moderno</p>
        <h1>Descubri productos y compra con una experiencia clara.</h1>
        <p>
          Una tienda preparada para explorar, guardar favoritos, comprar y seguir pedidos
          con una interfaz consistente.
        </p>

        <div class="home-hero__actions">
          <RouterLink :to="{ name: 'products' }">
            <BaseButton size="lg">
              Explorar productos
            </BaseButton>
          </RouterLink>

          <RouterLink :to="{ name: 'favorites' }">
            <BaseButton variant="outline" size="lg">
              Ver favoritos
            </BaseButton>
          </RouterLink>
        </div>
      </div>

      <div class="home-hero__visual" aria-hidden="true">
        <img :src="heroImage" alt="" />
      </div>
    </section>

    <section class="home-section container">
      <div class="page-header">
        <h2>Productos destacados</h2>
        <p>Una seleccion inicial tomada de los productos disponibles del catalogo.</p>
      </div>

      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
      </p>

      <div class="products-grid">
        <template v-if="loading">
          <ProductCardSkeleton
            v-for="index in 4"
            :key="`featured-skeleton-${index}`"
          />
        </template>

        <template v-else>
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
          />
        </template>
      </div>
    </section>

    <section class="home-section home-benefits">
      <div class="container">
        <div class="page-header">
          <h2>Una base pensada para vender</h2>
          <p>Beneficios reales del flujo actual, sin promesas comerciales inventadas.</p>
        </div>

        <div class="benefits-grid">
          <article
            v-for="benefit in benefits"
            :key="benefit.title"
            class="benefit-card"
          >
            <span class="benefit-card__icon">
              <AppIcon :name="benefit.icon" />
            </span>
            <h3>{{ benefit.title }}</h3>
            <p>{{ benefit.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="home-final-cta container">
      <h2>Listo para encontrar tu proximo producto?</h2>
      <RouterLink :to="{ name: 'products' }">
        <BaseButton size="lg">
          Ir al catalogo
        </BaseButton>
      </RouterLink>
    </section>
  </main>
</template>
