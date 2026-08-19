<template>
  <section class="admin-section">
    <h2>Panel de administracion</h2>

    <nav class="admin-nav">
      <RouterLink :to="{ name: 'admin' }">
        Dashboard
      </RouterLink>

      <RouterLink :to="{ name: 'admin-products' }">
        Productos
      </RouterLink>

      <RouterLink :to="{ name: 'admin-users' }">
        Usuarios
      </RouterLink>

      <RouterLink :to="{ name: 'admin-orders' }">
        Ordenes
      </RouterLink>
    </nav>

    <RouterView />
  </section>
</template>
