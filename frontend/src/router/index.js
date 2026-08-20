import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "../layouts/AdminLayout.vue";
import AuthLayout from "../layouts/AuthLayout.vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import LoginForm from "../components/LoginForm.vue";
import ProfileView from "../components/ProfileView.vue";
import DashboardView from "../components/admin/DashboardView.vue";
import InventoryView from "../components/admin/InventoryView.vue";
import OrderAdminDetailView from "../components/admin/OrderAdminDetailView.vue";
import OrdersAdminView from "../components/admin/OrdersView.vue";
import ProductsAdminView from "../components/admin/ProductsView.vue";
import UsersAdminView from "../components/admin/UsersView.vue";
import { useAuthStore } from "../stores/authStore";
import CartView from "../views/CartView.vue";
import CatalogView from "../views/CatalogView.vue";
import CheckoutCancelView from "../views/CheckoutCancelView.vue";
import CheckoutSuccessView from "../views/CheckoutSuccessView.vue";
import CheckoutView from "../views/CheckoutView.vue";
import FavoritesView from "../views/FavoritesView.vue";
import HomeView from "../views/HomeView.vue";
import OrderDetailView from "../views/OrderDetailView.vue";
import ProductDetailView from "../views/ProductDetailView.vue";
import UserOrdersView from "../views/UserOrdersView.vue";

const routes = [
  {
    path: "/",
    component: DefaultLayout,
    children: [
      {
        path: "",
        name: "home",
        component: HomeView,
        meta: {
          title: "Inicio | E-Commerce",
        },
      },
      {
        path: "products",
        name: "products",
        component: CatalogView,
        meta: {
          title: "Productos | E-Commerce",
        },
      },
      {
        path: "products/:id",
        name: "product-detail",
        component: ProductDetailView,
        meta: {
          title: "Producto | E-Commerce",
        },
      },
      {
        path: "cart",
        name: "cart",
        component: CartView,
        meta: {
          requiresAuth: true,
          title: "Carrito | E-Commerce",
        },
      },
      {
        path: "checkout",
        name: "checkout",
        component: CheckoutView,
        meta: {
          requiresAuth: true,
          title: "Checkout | E-Commerce",
        },
      },
      {
        path: "checkout/success",
        name: "checkout-success",
        component: CheckoutSuccessView,
        meta: {
          requiresAuth: true,
          title: "Compra confirmada | E-Commerce",
        },
      },
      {
        path: "checkout/cancel",
        name: "checkout-cancel",
        component: CheckoutCancelView,
        meta: {
          requiresAuth: true,
          title: "Pago cancelado | E-Commerce",
        },
      },
      {
        path: "favorites",
        name: "favorites",
        component: FavoritesView,
        meta: {
          requiresAuth: true,
          title: "Favoritos | E-Commerce",
        },
      },
      {
        path: "profile",
        name: "profile",
        component: ProfileView,
        meta: {
          requiresAuth: true,
          title: "Mi perfil | E-Commerce",
        },
      },
      {
        path: "orders",
        name: "orders",
        component: UserOrdersView,
        meta: {
          requiresAuth: true,
          title: "Mis ordenes | E-Commerce",
        },
      },
      {
        path: "orders/:id",
        name: "order-detail",
        component: OrderDetailView,
        meta: {
          requiresAuth: true,
          title: "Orden | E-Commerce",
        },
      },
      {
        path: "admin",
        component: AdminLayout,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
        children: [
          {
            path: "",
            name: "admin",
            component: DashboardView,
            meta: {
              title: "Admin | E-Commerce",
            },
          },
          {
            path: "products",
            name: "admin-products",
            component: ProductsAdminView,
            meta: {
              title: "Admin productos | E-Commerce",
            },
          },
          {
            path: "inventory",
            name: "admin-inventory",
            component: InventoryView,
            meta: {
              title: "Admin inventario | E-Commerce",
            },
          },
          {
            path: "orders",
            name: "admin-orders",
            component: OrdersAdminView,
            meta: {
              title: "Admin ordenes | E-Commerce",
            },
          },
          {
            path: "orders/:id",
            name: "admin-order-detail",
            component: OrderAdminDetailView,
            meta: {
              title: "Admin orden | E-Commerce",
            },
          },
          {
            path: "users",
            name: "admin-users",
            component: UsersAdminView,
            meta: {
              title: "Admin usuarios | E-Commerce",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    component: AuthLayout,
    meta: {
      guestOnly: true,
      title: "Iniciar sesion | E-Commerce",
    },
    children: [
      {
        path: "",
        name: "login",
        component: LoginForm,
        props: {
          initialMode: "login",
        },
      },
    ],
  },
  {
    path: "/register",
    component: AuthLayout,
    meta: {
      guestOnly: true,
      title: "Crear cuenta | E-Commerce",
    },
    children: [
      {
        path: "",
        name: "register",
        component: LoginForm,
        props: {
          initialMode: "register",
        },
      },
    ],
  },
  {
    path: "/success",
    redirect: (to) => ({
      name: "checkout-success",
      query: to.query,
    }),
  },
  {
    path: "/cancel",
    redirect: (to) => ({
      name: "checkout-cancel",
      query: to.query,
    }),
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "products" },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.initialized) {
    await authStore.initializeSession();
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (requiresAdmin && !authStore.isAdmin) {
    return {
      name: "products",
    };
  }

  if (guestOnly && authStore.isAuthenticated) {
    return {
      name: authStore.isAdmin ? "admin" : "products",
    };
  }

  return true;
});

router.afterEach((to) => {
  const nearestTitle = [...to.matched]
    .reverse()
    .find((record) => record.meta.title)?.meta.title;

  document.title = nearestTitle || "E-Commerce";
});
