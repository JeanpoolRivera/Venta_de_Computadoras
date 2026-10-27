# Diagrama Entidad–Relación (DER) conceptual

MongoDB es una base de datos documental y no exige un esquema relacional. Este DER representa las entidades del negocio a nivel conceptual para mostrar sus relaciones y cardinalidades.

```mermaid
erDiagram
    CLIENTE ||--o{ VENTA : realiza
    USUARIO ||--o{ VENTA : registra
    VENTA ||--|{ DETALLE_VENTA : contiene
    PRODUCTO ||--o{ DETALLE_VENTA : aparece_en
    PROVEEDOR ||--o{ COMPRA : suministra
    COMPRA ||--|{ DETALLE_COMPRA : contiene
    PRODUCTO ||--o{ DETALLE_COMPRA : se_abastece
    PRODUCTO ||--o{ MOVIMIENTO_INVENTARIO : genera
    USUARIO ||--o{ COMPRA : registra

    CLIENTE {
        ObjectId _id PK
        string tipoDocumento
        string documento UK
        string nombres
        string apellidos
    }
    USUARIO {
        ObjectId _id PK
        string nombre
        string correo UK
        string rol
    }
    PRODUCTO {
        ObjectId _id PK
        string sku UK
        string nombre
        number costo
        number precioVenta
        int stock
        int stockMinimo
    }
    PROVEEDOR {
        ObjectId _id PK
        string razonSocial
        string documentoFiscal UK
    }
    VENTA {
        ObjectId _id PK
        string numero UK
        ObjectId clienteId FK
        number total
        string metodoPago
        date fecha
    }
    DETALLE_VENTA {
        ObjectId productoId FK
        int cantidad
        number precioUnitario
        number subtotal
    }
    COMPRA {
        ObjectId _id PK
        string numero UK
        ObjectId proveedorId FK
        number total
        date fecha
    }
    DETALLE_COMPRA {
        ObjectId productoId FK
        int cantidad
        number costoUnitario
        number subtotal
    }
    MOVIMIENTO_INVENTARIO {
        ObjectId _id PK
        ObjectId productoId FK
        string tipo
        int cantidad
        date createdAt
    }
```

## Lectura del diagrama

- Un cliente puede realizar cero o muchas ventas; cada venta corresponde a un cliente.
- Una venta contiene uno o varios ítems. En MongoDB, el detalle se guarda como un arreglo embebido `items` dentro del documento `ventas`.
- Un proveedor puede asociarse a muchas compras. El detalle de compra también se guarda embebido en `compras.items`.
- Cada compra o venta genera movimientos de inventario por producto.
- Las referencias se almacenan como `ObjectId`; las líneas de venta y compra conservan una instantánea de SKU, nombre y precio/costo para preservar el historial.

**Nota:** `DETALLE_VENTA` y `DETALLE_COMPRA` se muestran como entidades en el DER conceptual, pero no son colecciones independientes en la implementación. Sus documentos embebidos forman parte de `ventas.items` y `compras.items`.
