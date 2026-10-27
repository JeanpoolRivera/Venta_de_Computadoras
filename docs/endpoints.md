# Documentación de rutas / endpoints

Base URL local: `http://localhost:3000/api`

Todas las respuestas siguen este formato general:

```json
{ "success": true, "data": {} }
```

Los errores siguen:

```json
{ "success": false, "error": { "message": "Descripción del error" } }
```

## Salud de la API

### `GET /health`

Verifica que la API responde y que MongoDB acepta un comando `ping`.

## Productos

### `GET /productos`

Lista productos con paginación.

Parámetros opcionales: `q`, `categoria`, `activo`, `page`, `limit`.

Ejemplo: `GET /productos?q=Lenovo&page=1&limit=10`

### `GET /productos/:id`

Obtiene un producto por ObjectId. Devuelve `404` si no existe y `400` si el identificador es inválido.

### `POST /productos`

Crea un producto.

```json
{
  "sku": "TECL-MEC-001",
  "nombre": "Teclado mecánico",
  "categoria": "Periférico",
  "marca": "Redragon",
  "modelo": "K552",
  "costo": 120,
  "precioVenta": 169.9,
  "stock": 10,
  "stockMinimo": 2
}
```

Respuesta esperada: `201 Created`. `sku` debe ser único.

### `PATCH /productos/:id`

Actualiza campos permitidos: `nombre`, `categoria`, `marca`, `modelo`, `descripcion`, `precioVenta`, `costo`, `stockMinimo`, `activo`. El stock no se cambia desde esta ruta; se modifica mediante compras/ventas para conservar el historial.

## Clientes

### `GET /clientes`

Lista clientes. Parámetro opcional `q` para buscar por nombres, apellidos o documento.

### `POST /clientes`

```json
{
  "tipoDocumento": "DNI",
  "documento": "73456789",
  "nombres": "Lucía",
  "apellidos": "Pérez Ramos",
  "correo": "lucia.perez@example.com",
  "telefono": "987123456",
  "direccion": "Huancayo, Junín"
}
```

`tipoDocumento` puede ser `DNI`, `CE`, `RUC` u `OTRO`. La combinación tipo/documento debe ser única.

## Proveedores

### `GET /proveedores`

Lista proveedores. Admite `activo=true` o `activo=false`.

### `POST /proveedores`

```json
{
  "razonSocial": "Mayorista Informático del Centro S.A.C.",
  "documentoFiscal": "20601234567",
  "contacto": "Carlos Medina",
  "correo": "ventas@mayorista.example",
  "telefono": "064555555",
  "direccion": "Huancayo, Junín"
}
```

## Compras

### `GET /compras`

Devuelve las 100 compras más recientes.

### `POST /compras`

Registra una compra recibida e incrementa el stock. El proveedor y los productos deben existir y estar activos. La compra, los cambios de stock y los movimientos se guardan en una transacción.

```json
{
  "proveedorId": "REEMPLAZAR_POR_OBJECTID_REAL",
  "items": [
    {
      "productoId": "REEMPLAZAR_POR_OBJECTID_REAL",
      "cantidad": 5,
      "costoUnitario": 215
    }
  ]
}
```

Respuesta: `201 Created`. Si falla una línea, se revierte toda la operación.

## Ventas

### `GET /ventas`

Lista las 100 ventas más recientes. Admite el filtro opcional `estado`.

### `GET /ventas/:id`

Devuelve el documento completo de una venta, incluidos los ítems embebidos.

### `POST /ventas`

Registra una venta, valida stock y descuenta las unidades. La venta, el descuento de stock y los movimientos se confirman en una única transacción.

```json
{
  "clienteId": "REEMPLAZAR_POR_OBJECTID_REAL",
  "metodoPago": "YAPE_PLIN",
  "items": [
    {
      "productoId": "REEMPLAZAR_POR_OBJECTID_REAL",
      "cantidad": 2
    }
  ]
}
```

Métodos permitidos: `EFECTIVO`, `YAPE_PLIN`, `TARJETA`, `TRANSFERENCIA`.

El precio se toma del catálogo para impedir que el cliente de la API envíe un precio arbitrario. La API devuelve `409 Conflict` si el stock es insuficiente. No se reciben datos de tarjetas.

## Dashboard

### `GET /dashboard/resumen`

Devuelve el número de productos activos, clientes, proveedores activos, ventas registradas, productos con stock bajo y total/cantidad de ventas del día.

## Códigos HTTP principales

| Código | Significado |
|---|---|
| 200 | Consulta o actualización correcta |
| 201 | Recurso creado |
| 400 | Solicitud inválida o validación fallida |
| 404 | Recurso no encontrado |
| 409 | Conflicto: duplicado o stock insuficiente |
| 500 | Error interno no expuesto en detalle |

## Pruebas manuales

1. Ejecutar `npm run db:init` y `npm run db:seed`.
2. Ejecutar `npm run dev`.
3. Consultar `GET /api/productos`.
4. Copiar un `_id` real de un cliente y un producto de la respuesta.
5. Enviar `POST /api/ventas` con esos identificadores.
6. Consultar de nuevo el producto y verificar que `stock` disminuyó.
7. Enviar una venta con cantidad superior al stock y verificar `409` sin cambios parciales.
