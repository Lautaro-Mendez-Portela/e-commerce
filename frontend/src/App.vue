<script setup>
import { computed, onMounted, ref } from "vue";

import LoginForm from "./components/LoginForm.vue";
import AdminPanel from "./components/admin/AdminPanel.vue";
import PaginationControls from "./components/admin/PaginationControls.vue";
import ProfileView from "./components/ProfileView.vue";

import { jwtDecode } from "jwt-decode";

const API_URL = "http://localhost:3000";

const products = ref([]);
const productPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
const cart = ref([]);
const currentView = ref("store");
const isLoggedIn = ref(!!localStorage.getItem("token"));
const isAdmin = ref(false);

const getToken = () => `Bearer ${localStorage.getItem("token")}`;

const loadUserRole = () => {
  const token = localStorage.getItem("token");

  if (!token) return;

  const decoded = jwtDecode(token);

  isAdmin.value = decoded.role === "ADMIN";
};

const getProducts = async (page = productPagination.value.page) => {
  try {
    const response = await fetch(
      `${API_URL}/products?page=${page}&limit=${productPagination.value.limit}`
    );

    const data = await response.json();

    products.value = data.data;
    productPagination.value = data.pagination;
  } catch (error) {
    console.error("ERROR PRODUCTS:", error);
  }
};

const changeProductsPage = async (page) => {
  await getProducts(page);
};

const getCart = async () => {
  try {
    const response = await fetch(`${API_URL}/cart`, {
      headers: {
        Authorization: getToken(),
      },
    });

    if (!response.ok) {
      cart.value = [];

      return;
    }

    const data = await response.json();

    cart.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(error);

    cart.value = [];
  }
};

const addToCart = async (productId) => {
  await fetch(`${API_URL}/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken(),
    },
    body: JSON.stringify({
      productId,
      quantity: 1,
    }),
  });

  await getCart();
};

const removeFromCart = async (cartItemId) => {
  await fetch(`${API_URL}/cart/${cartItemId}`, {
    method: "DELETE",
    headers: {
      Authorization: getToken(),
    },
  });

  await getCart();
};

const updateQuantity = async (cartItemId, quantity) => {
  if (quantity < 1) return;

  await fetch(`${API_URL}/cart/${cartItemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken(),
    },
    body: JSON.stringify({
      quantity,
    }),
  });

  await getCart();
};

const createOrder = async () => {
  try {
    const orderResponse = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        Authorization: getToken(),
      },
    });

    const order = await orderResponse.json();

    const sessionResponse = await fetch(
      `${API_URL}/payments/checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      }
    );

    const session = await sessionResponse.json();

    window.location.href = session.url;
  } catch (error) {
    console.error(error);

    alert("Error al iniciar el pago");
  }
};

const showStore = async () => {
  currentView.value = "store";
  await getProducts();
};

const showAdminPanel = () => {
  currentView.value = "admin";
};

const showProfile = () => {
  currentView.value = "profile";
};

const handleLogin = async () => {
  isLoggedIn.value = true;

  loadUserRole();
  currentView.value = "store";

  await getProducts();
  await getCart();
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");

  location.reload();
};

const totalPrice = computed(() => {
  return cart.value.reduce((acc, item) => {
    return acc + item.product.price * item.quantity;
  }, 0);
});

onMounted(async () => {
  if (isLoggedIn.value) {
    loadUserRole();
    await getProducts();
    await getCart();
  }
});
</script>

<template>
  <LoginForm v-if="!isLoggedIn" @login-success="handleLogin" />

  <div v-else class="app">
    <header class="navbar">
      <button class="brand-btn" @click="showStore">
        E-Commerce
      </button>

      <div class="navbar-actions">
        <button
          :class="{ active: currentView === 'store' }"
          class="nav-btn"
          @click="showStore"
        >
          Inicio
        </button>

        <button
          v-if="isAdmin"
          :class="{ active: currentView === 'admin' }"
          class="nav-btn"
          @click="showAdminPanel"
        >
          Panel de administracion
        </button>

        <button
          :class="{ active: currentView === 'profile' }"
          class="nav-btn"
          @click="showProfile"
        >
          Ver perfil
        </button>

        <div class="cart-badge">Carrito {{ cart.length }}</div>

        <button class="logout-btn" @click="logout">
          Cerrar sesion
        </button>
      </div>
    </header>

    <AdminPanel v-if="isAdmin && currentView === 'admin'" />

    <ProfileView v-if="currentView === 'profile'" />

    <main v-if="currentView === 'store'" class="layout">
      <section>
        <h2 class="section-title">Productos</h2>

        <p>Total productos: {{ productPagination.total }}</p>

        <div class="products-grid">
          <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
          >
            <div class="product-image">Caja</div>

            <h3>
              {{ product.name }}
            </h3>

            <p class="price">$ {{ product.price }}</p>

            <p class="stock">
              Stock:
              {{ product.stock }}
            </p>

            <button class="primary-btn" @click="addToCart(product.id)">
              Agregar al carrito
            </button>
          </div>
        </div>

        <PaginationControls
          :pagination="productPagination"
          @change-page="changeProductsPage"
        />
      </section>

      <aside class="cart-section">
        <h2 class="section-title">Carrito</h2>

        <div v-if="cart.length === 0" class="empty-cart">
          El carrito esta vacio
        </div>

        <div
          v-for="item in cart.filter((i) => i.product)"
          :key="item.id"
          class="cart-item"
        >
          <div>
            <h4>
              {{ item.product.name }}
            </h4>

            <p>$ {{ item.product.price }}</p>
          </div>

          <div class="quantity-controls">
            <button @click="updateQuantity(item.id, item.quantity - 1)">
              -
            </button>

            <span>
              {{ item.quantity }}
            </span>

            <button @click="updateQuantity(item.id, item.quantity + 1)">
              +
            </button>
          </div>

          <button class="remove-btn" @click="removeFromCart(item.id)">
            Eliminar
          </button>
        </div>

        <div v-if="cart.length > 0" class="cart-footer">
          <h3>Total: $ {{ totalPrice }}</h3>

          <button class="checkout-btn" @click="createOrder">
            Crear orden
          </button>
        </div>
      </aside>
    </main>
  </div>
</template>
