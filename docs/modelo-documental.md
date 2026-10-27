# Modelo documental de MongoDB

## Estrategia de modelado

Se combinan documentos independientes y documentos embebidos:

- **Referencias (`ObjectId`)** para entidades reutilizables y de crecimiento independiente: productos, clientes y proveedores.
- **Subdocumentos embebidos** en `ventas.items` y `compras.items`, porque cada línea pertenece a una sola operación y debe conservar el precio/costo histórico.
- **Instantáneas** de los datos básicos del cliente/proveedor y del producto en la transacción para que los documentos históricos no cambien si se actualiza el catálogo.
- **Colección de movimientos** para auditar entradas y salidas de inventario.

## Colecciones

### `productos`

```javascript
{
  _id: ObjectId,
  sku: "LAP-LNV-I5-16",
  nombre: "Laptop Lenovo Core i5 16GB",
  categoria: "Laptop",
  marca: "Lenovo",
  modelo: "Core i5 / 16GB / 512GB SSD",
  descripcion: "Laptop para trabajo y universidad",
  costo: 2100.00,
  precioVenta: 2599.00,
  stock: 8,
  stockMinimo: 2,
  activo: true,
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

### `clientes`

```javascript
{
  _id: ObjectId,
  tipoDocumento: "DNI",
  documento: "70451236",
  nombres: "Andrea",
  apellidos: "Quispe Rojas",
  correo: "andrea.quispe@example.com",
  telefono: "987654321",
  direccion: "El Tambo, Huancayo",
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

### `proveedores`

```javascript
{
  _id: ObjectId,
  razonSocial: "Distribuciones TecnoAndes S.A.C.",
  documentoFiscal: "20607845121",
  contacto: "María Salazar",
  correo: "ventas@tecnoandes.example",
  telefono: "064555101",
  direccion: "Huancayo, Junín",
  activo: true,
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

### `ventas`

```javascript
{
  _id: ObjectId,
  numero: "V-...",
  clienteId: ObjectId,
  cliente: {
    _id: ObjectId,
    nombreCompleto: "Andrea Quispe Rojas",
    documento: "70451236"
  },
  items: [{
    productoId: ObjectId,
    sku: "RAM-DDR4-16",
    nombre: "Memoria RAM DDR4 16GB",
    cantidad: 2,
    precioUnitario: 139.00,
    costoUnitario: 95.00,
    subtotal: 278.00
  }],
  subtotal: 278.00,
  descuento: 0,
  total: 278.00,
  moneda: "PEN",
  metodoPago: "YAPE_PLIN",
  estado: "PAGADA",
  fecha: ISODate(),
  createdAt: ISODate()
}
```

### `compras`

```javascript
{
  _id: ObjectId,
  numero: "C-...",
  proveedorId: ObjectId,
  proveedor: { _id: ObjectId, razonSocial: "Distribuciones TecnoAndes S.A.C." },
  items: [{
    productoId: ObjectId,
    sku: "SSD-NVME-1TB",
    nombre: "SSD NVMe 1TB",
    cantidad: 10,
    costoUnitario: 220.00,
    subtotal: 2200.00
  }],
  total: 2200.00,
  estado: "RECIBIDA",
  fecha: ISODate(),
  createdAt: ISODate()
}
```

### `usuarios`

Registra los usuarios internos y sus roles. Esta entrega no implementa autenticación; no se guardan contraseñas.

### `movimientos_inventario`

Registra cada entrada o salida producida por compras o ventas. `cantidad` es positiva para entradas y negativa para salidas.

## Índices

- `productos.sku`: único.
- `clientes.tipoDocumento + clientes.documento`: combinación única.
- `proveedores.documentoFiscal`: único.
- `ventas.numero` y `compras.numero`: únicos.
- `ventas.fecha`: descendente para historial.
- `movimientos_inventario.productoId + createdAt`: historial de un producto.

## Referencias y consistencia

MongoDB no crea claves foráneas automáticamente. La API verifica que existan el cliente, proveedor y productos antes de registrar operaciones. Las transacciones aseguran que el registro de la operación y el cambio de stock se confirmen o reviertan juntos.
