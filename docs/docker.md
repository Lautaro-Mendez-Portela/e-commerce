# Docker y entorno reproducible

Esta etapa agrega un entorno local reproducible con Docker Compose para levantar PostgreSQL, backend y frontend sin instalar PostgreSQL en el host.

## Desarrollo tradicional en host

Backend:

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Variables:

- Backend host: `backend/.env`
- Frontend host: `frontend/.env`
- Ejemplos: `backend/.env.example`, `frontend/.env.example`

## Desarrollo con Docker

Copiar el ejemplo de variables de la raiz si se quieren personalizar puertos o credenciales locales:

```bash
copy .env.example .env
```

Levantar todo:

```bash
docker compose up --build
```

Servicios publicados:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health backend: `http://localhost:3000/health`
- PostgreSQL dev: `localhost:5432`

El backend dentro de Docker usa el hostname interno `postgres`, no `localhost`:

```text
postgresql://ecommerce:ecommerce_dev_password@postgres:5432/ecommerce
```

El frontend usa:

```text
VITE_API_URL=http://localhost:3000
```

Esa URL la consume el navegador del usuario desde el host, por eso no debe ser `http://backend:3000`.

Si el puerto `3000` esta ocupado en Windows, usar un puerto host alternativo para backend y mantener el frontend apuntando a ese puerto. Ejemplo PowerShell:

```powershell
$env:BACKEND_PORT="3001"
$env:API_URL="http://localhost:3001"
$env:VITE_API_URL="http://localhost:3001"
docker compose up --build
```

## Migraciones

El contenedor backend ejecuta:

```bash
prisma migrate deploy
```

antes de iniciar la API.

No se usa `prisma migrate dev` ni `prisma db push` en el flujo normal Docker.

## Seed de desarrollo

El seed no se ejecuta automaticamente. Para cargar datos demo:

```bash
docker compose exec backend npm run db:seed
```

Credenciales por defecto de desarrollo:

- Admin: `admin@example.com` / `Admin123!`
- User: `user@example.com` / `User123!`

Se pueden cambiar con:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`

El seed es idempotente: actualiza usuarios/productos demo existentes en vez de duplicarlos.

## Tests de integracion con PostgreSQL separado

La base de test corre en un servicio separado:

- Servicio: `postgres-test`
- DB: `ecommerce_test`
- Puerto host: `5433`
- Volumen: `postgres_test_data`

Ejecutar tests backend reales con DB Docker:

```bash
npm run docker:test
```

Ese comando:

1. Levanta `postgres-test`.
2. Espera su healthcheck.
3. Aplica migraciones con `prisma migrate deploy`.
4. Ejecuta los tests backend unitarios e integration/webhook/admin con coverage.
5. Detiene los contenedores de test al finalizar sin borrar volumenes.

Los tests mantienen la proteccion de `DATABASE_URL_TEST`: si falta o no apunta a una base cuyo nombre contiene `test`, fallan antes de limpiar datos.

## Detener servicios

Detener contenedores sin borrar datos:

```bash
docker compose down
```

## Reset de DB de desarrollo

Comando destructivo:

```bash
docker compose down -v
```

Esto elimina los datos locales de PostgreSQL de desarrollo y test porque borra los volumenes Docker del proyecto. No forma parte del flujo normal.

## Stripe

Docker usa valores mock/test por defecto para que la app arranque. Para una prueba manual real de Stripe test mode, configurar variables `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en `.env` local con claves test, nunca live.

Ver tambien: `docs/stripe-test-mode.md`.

## Hot reload

Compose monta el backend completo y, en frontend, solo los archivos necesarios para hot reload (`src`, `public`, `index.html`, `vite.config.js`). El `.env` real del frontend no se monta dentro del contenedor: `VITE_API_URL` queda controlado por Compose para evitar que el navegador use una URL incorrecta.

Los `node_modules` quedan dentro de volumenes Docker separados. Esto evita mezclar dependencias Windows del host con dependencias Linux del contenedor.
