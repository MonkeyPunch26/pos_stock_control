# pos_stock_control (Odoo 17 Community)

- Muestra el stock disponible en cada producto del POS (insignia verde/roja).
- Opcional: bloquea la venta si el pedido supera el stock disponible.

## Instalar
1. Copiar la carpeta `pos_stock_control` a tu carpeta de addons (en tu docker compose, el volumen de addons personalizados).
2. Reiniciar Odoo, activar modo desarrollador, Aplicaciones -> Actualizar lista de aplicaciones.
3. Instalar "POS: stock visible y bloqueo de venta sin stock".
4. Punto de Venta -> Configuración -> Ajustes: bloque "Control de stock en el POS" (mostrar / bloquear).
5. Cerrar y volver a abrir la sesión del POS (el navegador carga los assets al abrir).

## Supuestos
- Funciona con ambos modos de "Actualizar cantidades en stock" (Ajustes del POS > Inventario):
  "al cierre de sesión" (valor por defecto en Odoo 17) y "en tiempo real". En el modo al cierre,
  el módulo descuenta las ventas de sesiones abiertas que aún no generan movimiento de stock.
- Solo aplica a productos de tipo "Almacenable". Servicios y consumibles no se controlan.
- Las devoluciones (cantidades negativas) no se bloquean.

## Probado
Odoo 17.0 Community (rama 17.0, nov 2026), PostgreSQL 16, Chrome. Pruebas de punta a punta:
insignia de stock por almacén, bloqueo por clic y por teclado numérico, revisión en servidor con
dos cajas simultáneas, recarga del POS, cierre de sesión, modos "al cierre" y "tiempo real".
