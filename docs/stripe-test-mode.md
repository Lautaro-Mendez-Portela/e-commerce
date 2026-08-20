# Prueba manual Stripe en modo test

Esta prueba no forma parte de la suite automatizada normal. Sirve para validar localmente la integracion real de Stripe sin guardar secretos en el repositorio.

## Requisitos

- Usar claves `sk_test_...`, nunca claves live.
- Configurar una base PostgreSQL de prueba o desarrollo controlada.
- Definir variables locales:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `CLIENT_URL`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`

## Pasos

1. Iniciar backend y frontend localmente.
2. Iniciar el forwarder de Stripe CLI hacia:
   `http://localhost:3000/payments/webhook`
3. Copiar el `whsec_...` que entrega Stripe CLI en `STRIPE_WEBHOOK_SECRET`.
4. Crear usuario y producto con stock suficiente.
5. Agregar producto al carrito y crear checkout.
6. Completar pago con tarjeta test de Stripe.
7. Verificar que la orden queda `PAID`, el stock baja una sola vez y el carrito conserva solo cantidades agregadas despues de crear la orden.
8. Reenviar el mismo evento desde Stripe CLI y verificar que no hay doble decremento.
9. Probar un caso de stock insuficiente antes de confirmar el webhook y verificar refund en modo test.

## Criterios

- Webhook firmado con body raw valido.
- Sin stock negativo.
- Sin doble procesamiento por eventos repetidos.
- Sin refund duplicado.
- No exponer ni commitear secretos.
