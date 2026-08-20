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
JWT_SECRET="replace-with-a-long-random-secret"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-secret"
CLIENT_URL="http://localhost:5173"
API_URL="http://localhost:3000"
JSON_BODY_LIMIT="1mb"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxx"
PORT=3000
```

Crear tambien un archivo `.env` dentro de `frontend/`.

```env
VITE_API_URL="http://localhost:3000"
```

## Instalacion

## Desarrollo con Docker

El proyecto puede levantarse sin PostgreSQL instalado en el host:

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health backend: `http://localhost:3000/health`
- PostgreSQL dev: `localhost:5432`

Seed manual de desarrollo:

```bash
docker compose exec backend npm run db:seed
```

Credenciales demo:

- Admin: `admin@example.com` / `Admin123!`
- User: `user@example.com` / `User123!`

Tests de integracion con PostgreSQL separado:

```bash
npm run docker:test
```

Documentacion completa: [docs/docker.md](docs/docker.md).

## Continuous Integration

El workflow de CI esta en `.github/workflows/ci.yml` y corre en `pull_request` y `push` sobre `main` y `ecommerce-v2`.

Valida:

- Backend unit tests y syntax check
- Backend integration/webhook/admin tests con PostgreSQL `ecommerce_test`
- Prisma `generate` y `migrate deploy`
- Coverage backend como artifact
- Frontend tests y build
- E2E Playwright con API mockeada
- `docker compose config` y build de imagenes backend/frontend

El pipeline usa variables ficticias de test para JWT y Stripe. No requiere secretos reales ni archivos `.env`.

## API Documentation

La documentacion OpenAPI/Swagger queda disponible cuando el backend esta levantado:

```text
http://localhost:3000/api/docs
http://localhost:3000/api/docs.json
```

Si el backend se levanta con otro puerto local, por ejemplo `3001`, reemplazar el puerto en esas URLs.

Para probar endpoints autenticados desde Swagger UI:

1. Ejecutar `POST /auth/login` con un usuario valido, por ejemplo el seed local `user@example.com` / `User123!`.
2. Copiar el `accessToken`.
3. Presionar `Authorize`.
4. Pegar el token como Bearer JWT y confirmar.

Los endpoints marcados como admin requieren un usuario con `role = ADMIN`, por ejemplo el seed local `admin@example.com` / `Admin123!`.

El webhook de Stripe `POST /payments/webhook` no se expone como operacion interactiva porque consume raw body y requiere `Stripe-Signature`; la confirmacion real de pagos debe llegar desde Stripe.

La ruta puede deshabilitarse con `API_DOCS_ENABLED=false` si mas adelante se decide protegerla o apagarla en produccion.

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
