# Deployment

Esta guia prepara el proyecto para produccion sin asumir proveedor ni ejecutar deploy.

## Alcance

- Frontend Vue compilado como SPA.
- Backend Express/Prisma preparado para un puerto asignado por plataforma.
- PostgreSQL remoto mediante `DATABASE_URL`.
- Swagger/OpenAPI configurable.
- Stripe Checkout y webhook configurables por variables.

No se deben subir secretos al repositorio ni activar Stripe Live sin decision explicita.

## Variables de entorno

### Backend

Variables requeridas en produccion:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
JWT_SECRET="replace-with-a-long-random-production-secret"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-production-secret"
CLIENT_URL="https://frontend.example.com"
API_URL="https://api.example.com"
STRIPE_SECRET_KEY="sk_test_or_live_replace_me"
STRIPE_WEBHOOK_SECRET="whsec_replace_me"
API_DOCS_ENABLED="false"
JSON_BODY_LIMIT="1mb"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

`CLIENT_URL` tambien acepta varios origenes separados por coma si existe mas de un frontend legitimo:

```env
CLIENT_URL="https://frontend.example.com,https://www.frontend.example.com"
```

En `NODE_ENV=production`, `CLIENT_URL` y `API_URL` deben ser URLs HTTPS y no pueden apuntar a `localhost`, `127.0.0.1` ni `0.0.0.0`.

### Frontend

```env
VITE_API_URL="https://api.example.com"
```

`VITE_API_URL` se resuelve en build time. Si cambia el dominio del backend, hay que recompilar el frontend.

## Build y start

Backend:

```bash
cd backend
npm ci
npm run build
npm start
```

Migraciones Prisma:

```bash
cd backend
npx prisma migrate deploy
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

Output frontend: `frontend/dist`.

## Prisma y PostgreSQL

- Produccion debe usar `prisma generate` durante build.
- Produccion debe usar `prisma migrate deploy` como paso controlado de release o job manual.
- No usar `prisma migrate dev` ni `prisma db push` en produccion.
- Si hay multiples replicas del backend, evitar que todas ejecuten migraciones al mismo tiempo.
- `DATABASE_URL` puede apuntar a una instancia gestionada. Si el proveedor lo requiere, usar `sslmode=require` o el parametro SSL equivalente.
- El hostname `postgres` queda reservado al Compose local, no a produccion.

## Stripe

- Mantener `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` por variables.
- No cambiar a Stripe Live automaticamente.
- Para portfolio se puede usar Test Mode con claves `sk_test_...`.
- Para Live Mode, reemplazar claves solo cuando Stripe y el dominio publico esten definidos.
- Checkout usa `CLIENT_URL` para redirects:
  - `https://FRONTEND_DOMAIN/checkout/success?orderId=...&session_id=...`
  - `https://FRONTEND_DOMAIN/checkout/cancel?orderId=...`
- El pago final se confirma por webhook, no por el frontend.

Webhook real:

```text
POST https://BACKEND_DOMAIN/payments/webhook
```

Despues del deploy hay que configurar ese endpoint en Stripe Dashboard, copiar el nuevo signing secret y actualizar `STRIPE_WEBHOOK_SECRET`.

## Swagger/OpenAPI

- JSON: `/api/docs.json`
- UI: `/api/docs`
- Portfolio: `API_DOCS_ENABLED=true`.
- Produccion mas cerrada: `API_DOCS_ENABLED=false`.
- Si Swagger queda activo, `API_URL` debe apuntar al backend publico.
- El webhook Stripe no se expone como operacion interactiva de Swagger porque requiere raw body y `Stripe-Signature`.

## SPA routing

Vue Router usa rutas directas como:

```text
/products/1
/orders/3
/checkout/success
```

El hosting frontend debe redirigir rutas desconocidas a `index.html`.

Requisito neutral:

```text
/* -> /index.html
```

Si se usa el Dockerfile productivo del frontend, `frontend/nginx.prod.conf` ya incluye `try_files $uri $uri/ /index.html`.

## Docker production

Backend:

```bash
docker build -f backend/Dockerfile.prod -t ecommerce-api-backend:prod backend
```

Frontend:

```bash
docker build --build-arg VITE_API_URL=https://api.example.com -f frontend/Dockerfile.prod -t ecommerce-api-frontend:prod frontend
```

Los Dockerfiles normales siguen orientados a desarrollo local con Compose.

## Healthcheck

Endpoint:

```text
GET /health
```

Debe usarse para checks del servicio backend. No devuelve secretos ni informacion sensible.

## Security checklist

- `.env` y `.env.*` reales ignorados por Git.
- Usar secretos largos y distintos para `JWT_SECRET` y `JWT_REFRESH_SECRET`.
- Configurar `CLIENT_URL` con el dominio final del frontend.
- No usar CORS wildcard.
- Mantener Helmet, rate limits y limite JSON.
- Mantener `STRIPE_WEBHOOK_SECRET` actualizado con el endpoint publico real.
- No ejecutar seed automaticamente en produccion.
- No publicar source maps salvo decision explicita.
- Recordar deuda pendiente: JWT sigue en `localStorage`; migrar a cookies HttpOnly queda fuera de esta etapa.

## Checklist de deploy

Backend:

- Crear servicio backend.
- Configurar variables backend.
- Conectar PostgreSQL gestionado.
- Ejecutar `npx prisma migrate deploy` una vez por release.
- Verificar `GET /health`.
- Verificar `/api/docs` si `API_DOCS_ENABLED=true`.

Frontend:

- Configurar `VITE_API_URL` con el backend publico.
- Ejecutar build.
- Configurar fallback SPA a `index.html`.
- Verificar rutas directas como `/products/1` y `/checkout/success`.

Stripe:

- Configurar webhook publico `https://BACKEND_DOMAIN/payments/webhook`.
- Copiar nuevo signing secret a `STRIPE_WEBHOOK_SECRET`.
- Probar Checkout en Test Mode.
- Cambiar a Live Mode solo si se decide explicitamente.

CORS:

- Configurar `CLIENT_URL` con el dominio final del frontend.
- Agregar dominios adicionales solo si son necesarios y legitimos.

## Proveedores compatibles

Opciones posibles sin cambiar arquitectura:

- Backend: Render, Railway, Fly.io, VPS con Docker, servicio containerizado compatible.
- PostgreSQL: Neon, Supabase, Railway, Render PostgreSQL, RDS compatible.
- Frontend: Vercel, Netlify, Cloudflare Pages, hosting estatico con Nginx.
- Full Docker: VPS, Fly.io, Railway o cualquier plataforma con contenedores.

## Pasos que requieren decision del owner

- Elegir proveedores.
- Definir dominios finales.
- Configurar secretos reales.
- Configurar Stripe Dashboard.
- Decidir `API_DOCS_ENABLED=true` o `false`.
- Decidir si Stripe queda en Test Mode para portfolio o pasa a Live Mode.

## Riesgos y deuda pendiente

- Tokens JWT en `localStorage`.
- No hay logging externo centralizado.
- No hay estrategia de backups documentada para PostgreSQL.
- No hay job/worker para ordenes abandonadas fuera de eventos Stripe.
- Revisar vulnerabilidades reportadas por `npm audit` antes de un lanzamiento real.
