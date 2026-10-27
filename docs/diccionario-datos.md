# Diccionario de datos

Los importes se expresan en soles peruanos (PEN). Los identificadores internos son `ObjectId`.

## Colección `productos`

| Campo | Tipo | Obligatorio | Regla / descripción |
|---|---|---:|---|
| `_id` | ObjectId | Sí | Identificador generado por MongoDB |
| `sku` | String | Sí | Código de producto único |
| `nombre` | String | Sí | Nombre comercial |
| `categoria` | String | Sí | Tipo de equipo o componente |
| `marca` | String | No | Fabricante |
| `modelo` | String | No | Modelo o especificaciones |
| `descripcion` | String | No | Descripción del producto |
| `costo` | Number | Sí | Costo unitario, no negativo |
| `precioVenta` | Number | Sí | Precio unitario de venta, positivo en la API |
| `stock` | Integer | Sí | Unidades disponibles, no negativo |
| `stockMinimo` | Integer | Sí | Umbral de alerta, no negativo |
| `activo` | Boolean | Sí | Indica si se puede vender |
| `createdAt`, `updatedAt` | Date | Sí | Fechas de auditoría |

## Colección `clientes`

| Campo | Tipo | Obligatorio | Regla / descripción |
|---|---|---:|---|
| `_id` | ObjectId | Sí | Identificador |
| `tipoDocumento` | String | Sí | DNI, CE, RUC u OTRO |
| `documento` | String | Sí | Número de documento; único junto con tipo |
| `nombres` | String | Sí | Nombres o razón de identificación |
| `apellidos` | String | Sí | Apellidos o complemento |
| `correo` | String | No | Correo electrónico |
| `telefono` | String | No | Teléfono de contacto |
| `direccion` | String | No | Dirección |

## Colección `proveedores`

| Campo | Tipo | Obligatorio | Regla / descripción |
|---|---|---:|---|
| `_id` | ObjectId | Sí | Identificador |
| `razonSocial` | String | Sí | Nombre legal/comercial |
| `documentoFiscal` | String | Sí | RUC u otro identificador; único |
| `contacto` | String | No | Persona de contacto |
| `correo`, `telefono`, `direccion` | String | No | Datos de contacto |
| `activo` | Boolean | Sí | Estado del proveedor |

## Colección `ventas`

| Campo | Tipo | Obligatorio | Regla / descripción |
|---|---|---:|---|
| `_id` | ObjectId | Sí | Identificador |
| `numero` | String | Sí | Número único de venta |
| `clienteId` | ObjectId | Sí | Referencia a `clientes` |
| `cliente` | Object | Sí | Instantánea de datos del cliente |
| `items` | Array | Sí | Al menos un producto vendido |
| `items[].productoId` | ObjectId | Sí | Referencia a `productos` |
| `items[].cantidad` | Integer | Sí | Unidades positivas |
| `items[].precioUnitario` | Number | Sí | Precio aplicado en esa venta |
| `items[].costoUnitario` | Number | Sí | Costo de referencia al vender |
| `items[].subtotal` | Number | Sí | Cantidad por precio unitario |
| `subtotal`, `descuento`, `total` | Number | Sí | Importes de la venta |
| `moneda` | String | Sí | `PEN` |
| `metodoPago` | String | Sí | EFECTIVO, YAPE_PLIN, TARJETA o TRANSFERENCIA |
| `estado` | String | Sí | PAGADA, PENDIENTE o ANULADA |
| `fecha`, `createdAt` | Date | Sí | Fecha de la operación |

## Colección `compras`

| Campo | Tipo | Obligatorio | Regla / descripción |
|---|---|---:|---|
| `_id` | ObjectId | Sí | Identificador |
| `numero` | String | Sí | Número único de compra |
| `proveedorId` | ObjectId | Sí | Referencia a `proveedores` |
| `proveedor` | Object | Sí | Instantánea de datos del proveedor |
| `items` | Array | Sí | Líneas de productos recibidos |
| `items[].productoId` | ObjectId | Sí | Referencia a `productos` |
| `items[].cantidad` | Integer | Sí | Unidades recibidas positivas |
| `items[].costoUnitario` | Number | Sí | Costo unitario de compra |
| `items[].subtotal` | Number | Sí | Cantidad por costo unitario |
| `total` | Number | Sí | Total de la compra |
| `estado` | String | Sí | RECIBIDA o ANULADA |
| `fecha`, `createdAt` | Date | Sí | Fecha de la operación |

## Colección `usuarios`

| Campo | Tipo | Obligatorio | Regla / descripción |
|---|---|---:|---|
| `_id` | ObjectId | Sí | Identificador |
| `nombre` | String | Sí | Nombre del usuario |
| `correo` | String | Sí | Correo interno |
| `rol` | String | Sí | ADMINISTRADOR, VENDEDOR o ALMACEN |
| `activo` | Boolean | Sí | Estado del usuario |

## Colección `movimientos_inventario`

| Campo | Tipo | Obligatorio | Regla / descripción |
|---|---|---:|---|
| `_id` | ObjectId | Sí | Identificador |
| `productoId` | ObjectId | Sí | Producto afectado |
| `tipo` | String | Sí | ENTRADA_COMPRA, SALIDA_VENTA o AJUSTE |
| `cantidad` | Integer | Sí | Positiva para entrada, negativa para salida |
| `referenciaTipo` | String | Sí | COMPRA, VENTA o AJUSTE |
| `observacion` | String | No | Motivo del movimiento |
| `createdAt` | Date | Sí | Fecha del movimiento |

## Decisiones de diseño

Los detalles de compra y venta se guardan embebidos en arreglos `items`, no como colecciones separadas. Esto permite consultar una operación completa en un solo documento y mantener el precio histórico. Se conserva `productoId` para rastrear el catálogo y `sku`/`nombre` como instantánea histórica.
