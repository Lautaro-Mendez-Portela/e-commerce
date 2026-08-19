import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "../layouts/AdminLayout.vue";
import AuthLayout from "../layouts/AuthLayout.vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import LoginForm from "../components/LoginForm.vue";
import ProfileView from "../components/ProfileView.vue";
import DashboardView from "../components/admin/DashboardView.vue";
import OrdersAdminView from "../components/admin/OrdersView.vue";
import ProductsAdminView from "../components/admin/ProductsView.vue";
import UsersAdminView from "../components/admin/UsersView.vue";
import { useAuthStore } from "../stores/authStore";
import CatalogView from "../views/CatalogView.vue";
import FavoritesView from "../views/FavoritesView.vue";
import UserOrdersView from "../views/UserOrdersView.vue";

const routes = [
  {
    path: "/",
    component: DefaultLayout,
    children: [
      {
        path: "",
        redirect: { name: "products" },
      },
      {
        path: "products",
        name: "products",
        component: CatalogView,
      },
      {
        path: "products/:id",
        redirect: { name: "products" },
      },
      {
        path: "cart",
        name: "cart",
        component: CatalogView,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: "favorites",
        name: "favorites",
        component: FavoritesView,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: "profile",
        name: "profile",
        component: ProfileView,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: "orders",
        name: "orders",
        component: UserOrdersView,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: "orders/:id",
        name: "order-detail",
        component: UserOrdersView,
        meta: {
          requiresAuth: true,
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
          },
          {
            path: "products",
            name: "admin-products",
            component: ProductsAdminView,
          },
          {
            path: "orders",
            name: "admin-orders",
            component: OrdersAdminView,
          },
          {
            path: "users",
            name: "admin-users",
            component: UsersAdminView,
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
