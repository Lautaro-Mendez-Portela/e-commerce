```vue id="fixvue22"
<script setup>
import {
  onMounted,
  ref,
  computed
} from "vue";

import LoginForm from "./components/LoginForm.vue";

const products = ref([]);
const cart = ref([]);

const isLoggedIn = ref(
  !!localStorage.getItem("token")
);

const getToken = () =>
  `Bearer ${localStorage.getItem("token")}`;

const API_URL =
  "http://localhost:3000";

const getProducts = async () => {

  try {

    const response = await fetch(
      `${API_URL}/products`
    );

    const data =
      await response.json();

    products.value = data;

  } catch (error) {

    console.error(
      "ERROR PRODUCTS:",
      error
    );

  }

};

const getCart = async () => {

  try {

    const response = await fetch(
      `${API_URL}/cart`,
      {
        headers: {
          Authorization: getToken()
        }
      }
    );

    if (!response.ok) {

      cart.value = [];

      return;
    }

    const data =
      await response.json();

    cart.value =
      Array.isArray(data)
        ? data
        : [];

  } catch (error) {

    console.error(error);

    cart.value = [];
  }

};

const addToCart = async (
  productId
) => {

  await fetch(
    `${API_URL}/cart`,
    {

      method: "POST",

      headers: {

        "Content-Type":
          "application/json",

        Authorization:
          getToken()
      },

      body: JSON.stringify({

        productId,
        quantity: 1
      })
    }
  );

  await getCart();
};

const removeFromCart = async (
  cartItemId
) => {

  await fetch(
    `${API_URL}/cart/${cartItemId}`,
    {

      method: "DELETE",

      headers: {
        Authorization:
          getToken()
      }
    }
  );

  await getCart();
};

const updateQuantity = async (
  cartItemId,
  quantity
) => {

  if (quantity < 1) return;

  await fetch(
    `${API_URL}/cart/${cartItemId}`,
    {

      method: "PUT",

      headers: {

        "Content-Type":
          "application/json",

        Authorization:
          getToken()
      },

      body: JSON.stringify({
        quantity
      })
    }
  );

  await getCart();
};

const createOrder = async () => {

  try {

    const orderResponse =
      await fetch(
        `${API_URL}/orders`,
        {

          method: "POST",

          headers: {
            Authorization:
              getToken()
          }
        }
      );

    const order =
      await orderResponse.json();

    const sessionResponse =
      await fetch(
        `${API_URL}/payments/checkout-session`,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              getToken()
          },

          body: JSON.stringify({

            orderId: order.id
          })
        }
      );

    const session =
      await sessionResponse.json();

    window.location.href =
      session.url;

  } catch (error) {

    console.error(error);

    alert(
      "Error al iniciar el pago"
    );

  }

};

const handleLogin = async () => {

  isLoggedIn.value = true;

  await getProducts();
  await getCart();
};

const logout = () => {

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "refreshToken"
  );

  location.reload();
};

const totalPrice = computed(() => {

  return cart.value.reduce(
    (acc, item) => {

      return (
        acc +
        item.product.price *
          item.quantity
      );

    },
    0
  );
});

onMounted(async () => {

  if (isLoggedIn.value) {

    await getProducts();
    await getCart();

  }

});
</script>

<template>

  <LoginForm
    v-if="!isLoggedIn"
    @login-success="handleLogin"
  />

  <div class="app">

    <header class="navbar">

  <h1>
    E-Commerce
  </h1>

  <div class="navbar-actions">

    <div class="cart-badge">
      🛒 {{ cart.length }}
    </div>

    <button
      class="logout-btn"
      @click="logout"
    >
      Cerrar sesión
    </button>

  </div>

</header>

    <main class="layout">

      <section>

        <h2 class="section-title">
          Productos
        </h2>

        <p>Total productos: {{ products.length }}</p>


        <div class="products-grid">

          <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
          >

            <div class="product-image">
              📦
            </div>

            <h3>
              {{ product.name }}
            </h3>

            <p class="price">
              $ {{ product.price }}
            </p>

            <p class="stock">
              Stock:
              {{ product.stock }}
            </p>

            <button
              class="primary-btn"
              @click="
                addToCart(product.id)
              "
            >
              Agregar al carrito
            </button>

          </div>

        </div>

      </section>

      <aside class="cart-section">

        <h2 class="section-title">
          Carrito
        </h2>

        <div
          v-if="cart.length === 0"
          class="empty-cart"
        >

          El carrito está vacío

        </div>

        <div
  v-for="item in cart.filter(i => i.product)"
  :key="item.id"
  class="cart-item"
>

          <div>

            <h4>
              {{ item.product.name }}
            </h4>

            <p>
              $ {{ item.product.price }}
            </p>

          </div>

          <div class="quantity-controls">

            <button
              @click="
                updateQuantity(
                  item.id,
                  item.quantity - 1
                )
              "
            >
              -
            </button>

            <span>
              {{ item.quantity }}
            </span>

            <button
              @click="
                updateQuantity(
                  item.id,
                  item.quantity + 1
                )
              "
            >
              +
            </button>

          </div>

          <button
            class="remove-btn"
            @click="
              removeFromCart(item.id)
            "
          >
            Eliminar
          </button>

        </div>

        <div
          v-if="cart.length > 0"
          class="cart-footer"
        >

          <h3>
            Total:
            $ {{ totalPrice }}
          </h3>

          <button
            class="checkout-btn"
            @click="createOrder"
          >
            Crear orden
          </button>

        </div>

      </aside>

    </main>

  </div>

</template>
```
