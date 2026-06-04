# E-Commerce API + Frontend

Aplicacion e-commerce full stack con API REST, autenticacion JWT, panel de administracion, carrito, favoritos, ordenes, pagos con Stripe y dashboard administrativo.

## Stack

- Backend: Node.js, Express, Prisma, PostgreSQL, JWT, bcrypt, Zod, Stripe
- Frontend: Vue 3, Vite, CSS
- Base de datos: PostgreSQL
- Pagos: Stripe Checkout y webhooks

## Funcionalidades

### Usuario

- Registro con nombre, apellido, email y contrasena
- Inicio de sesion con JWT
- Perfil de usuario
- Historial de compras paginado
- Carrito de compras
- Favoritos por usuario sin duplicados
- Checkout con Stripe

### Productos

- Listado paginado
- Imagen por producto
- Filtros por nombre y rango de precio
- Alta, edicion y baja logica desde administracion
- Control de stock

### Administracion

- Panel separado de la tienda
- Dashboard con:
  - Total de ventas
  - Cantidad de ordenes
  - Usuarios registrados
  - Productos con bajo stock
  - Ultima compra
  - Producto mas vendido
- Gestion de productos
- Gestion de usuarios
- Eliminacion logica de usuarios
- Perfil de usuario con historial de compras
- Gestion y filtro de ordenes por estado y fecha

## Estructura del proyecto

```text
ecommerce-api/
  backend/
    prisma/
      schema.prisma
      migrations/
    src/
      config/
      controllers/
      middlewares/
      routes/
      services/
      validators/
      app.js
      server.js
  frontend/
    src/
      components/
      App.vue
      main.js
      style.css
```

## Requisitos

- Node.js
- npm
- PostgreSQL
- Cuenta de Stripe para pagos y webhooks

## Variables de entorno

Crear un archivo `.env` dentro de `backend/`.

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ecommerce_db"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxx"
PORT=3000
```

## Instalacion

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

El backend queda disponible en:

```text
http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend queda disponible en:

```text
http://localhost:5173
```

## Stripe

El checkout redirige a:

```text
http://localhost:5173/success
http://localhost:5173/cancel
```

Para marcar ordenes como pagadas, configurar el webhook de Stripe apuntando a:

```text
POST http://localhost:3000/payments/webhook
```

Eventos usados:

- `checkout.session.completed`
- `payment_intent.succeeded`

## Endpoints principales

### Auth

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/auth/register` | Registrar usuario |
| POST | `/auth/login` | Iniciar sesion |
| POST | `/auth/refresh` | Renovar access token |

### Productos

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/products?page=1&limit=10` | Listar productos paginados |
| GET | `/products?name=iphone&minPrice=100&maxPrice=2000` | Filtrar productos |
| POST | `/products` | Crear producto, admin |
| PUT | `/products/:id` | Editar producto, admin |
| DELETE | `/products/:id` | Baja logica de producto, admin |

### Carrito

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/cart` | Obtener carrito |
| POST | `/cart` | Agregar producto |
| PUT | `/cart/:id` | Actualizar cantidad |
| DELETE | `/cart/:id` | Eliminar item |

### Favoritos

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/favorites` | Obtener favoritos del usuario |
| POST | `/favorites` | Agregar favorito |
| DELETE | `/favorites/:productId` | Quitar favorito |

### Ordenes

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/orders` | Crear orden desde el carrito |
| GET | `/orders?page=1&limit=10` | Listar ordenes, admin |
| GET | `/orders?status=PAID&dateFrom=2026-06-01&dateTo=2026-06-30` | Filtrar ordenes, admin |

### Usuarios

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/users/me?page=1&limit=10` | Perfil propio e historial paginado |
| GET | `/users` | Listar usuarios, admin |
| GET | `/users/:id?page=1&limit=10` | Perfil e historial de usuario, admin |
| DELETE | `/users/:id` | Baja logica de usuario, admin |

### Dashboard

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/dashboard/admin` | Estadisticas administrativas |

### Pagos

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/payments/checkout-session` | Crear sesion de Stripe Checkout |
| POST | `/payments/webhook` | Webhook de Stripe |

## Autenticacion y roles

Las rutas protegidas usan:

```http
Authorization: Bearer ACCESS_TOKEN
```

Roles:

- `USER`: compra, carrito, favoritos y perfil
- `ADMIN`: acceso al panel de administracion, dashboard, usuarios, productos y ordenes

## Imagenes de productos

Actualmente las imagenes se cargan desde el frontend como archivo y se guardan en la base de datos como Data URL dentro del campo `imageUrl`.

Esta solucion es practica para desarrollo y prototipos. Para produccion se recomienda guardar archivos en almacenamiento externo o en una carpeta de uploads y persistir solo la URL en la base de datos.

## Scripts

### Backend

```bash
npm run dev
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## Notas de desarrollo

- Las listas principales usan paginacion con `page` y `limit`.
- El limite por defecto es `10`.
- El backend limita internamente el `limit` maximo a `100`.
- La eliminacion de productos y usuarios es logica para preservar historial.
- Favoritos usa una restriccion unica para evitar duplicados.

## Estado del proyecto

Proyecto en desarrollo con funcionalidades principales de e-commerce y administracion implementadas.
