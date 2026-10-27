# Reglas de negocio y transacciones

## Reglas principales

1. Cada producto tiene un `sku` único.
2. No se permite vender productos inactivos.
3. La cantidad de venta y compra debe ser un entero positivo.
4. Una venta no puede dejar el stock por debajo de cero.
5. El precio de venta se obtiene del catálogo del servidor; no se confía en un precio enviado por el cliente.
6. El registro de una compra aumenta el stock y actualiza el costo de referencia del producto.
7. Cada entrada o salida genera un documento en `movimientos_inventario`.
8. Los detalles de las operaciones guardan el nombre, SKU y precio/costo usados en ese momento.
9. Los pagos admitidos son efectivo, Yape/Plin, tarjeta y transferencia. Solo se registra el método; no se procesa el pago.
10. Los importes de ejemplo están expresados en PEN.

## Atomicidad

`POST /api/ventas` realiza dentro de una transacción:

1. Verificar el cliente.
2. Verificar cada producto activo y con stock suficiente.
3. Calcular los subtotales y el total usando el precio de catálogo.
4. Descontar el stock de cada producto.
5. Insertar los movimientos de inventario.
6. Insertar el documento de venta.
7. Confirmar la transacción.

Si ocurre un error antes de confirmar, MongoDB revierte las modificaciones realizadas dentro de esa transacción.

`POST /api/compras` aplica el mismo principio para validar proveedor/productos, incrementar stock, insertar movimientos y guardar la compra.

## Requisito de MongoDB

Las transacciones multidocumento requieren un replica set o un clúster fragmentado compatible. Una instalación local standalone no basta.

En un entorno de desarrollo local, configura un replica set de un solo nodo y usa una URI como:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/?replicaSet=rs0
```

En MongoDB Atlas, utiliza la cadena de conexión del clúster.

## Limitaciones conocidas

- No hay autenticación/autorización en esta versión.
- No hay endpoint de anulación de ventas/compras. Una anulación real debe revertir el stock y registrar los movimientos compensatorios dentro de una transacción; no se debe borrar el historial.
- Los números de operación usan una marca de tiempo como identificador legible de ejemplo. En un sistema productivo, conviene implementar una secuencia atómica o identificadores de operación con garantía de unicidad.
- Para dinero en un sistema productivo, evalúa almacenar valores con `Decimal128` o unidades monetarias menores (céntimos) para evitar errores de punto flotante.
- El endpoint de alta de producto acepta stock inicial para facilitar la configuración inicial; después, el cambio de stock debe hacerse por compras/ventas o un módulo de ajustes auditado.
