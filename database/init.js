require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'venta_computadoras';

const schemas = {
  productos: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sku', 'nombre', 'categoria', 'costo', 'precioVenta', 'stock', 'stockMinimo', 'activo'],
      properties: {
        sku: { bsonType: 'string', description: 'SKU único y obligatorio' },
        nombre: { bsonType: 'string', minLength: 1 },
        categoria: { bsonType: 'string' },
        costo: { bsonType: ['double', 'int', 'long', 'decimal'], minimum: 0 },
        precioVenta: { bsonType: ['double', 'int', 'long', 'decimal'], minimum: 0 },
        stock: { bsonType: ['int', 'long'], minimum: 0 },
        stockMinimo: { bsonType: ['int', 'long'], minimum: 0 },
        activo: { bsonType: 'bool' }
      }
    }
  },
  clientes: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tipoDocumento', 'documento', 'nombres', 'apellidos'],
      properties: {
        tipoDocumento: { enum: ['DNI', 'CE', 'RUC', 'OTRO'] },
        documento: { bsonType: 'string', minLength: 1 },
        nombres: { bsonType: 'string', minLength: 1 },
        apellidos: { bsonType: 'string', minLength: 1 }
      }
    }
  },
  proveedores: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['razonSocial', 'documentoFiscal', 'activo'],
      properties: {
        razonSocial: { bsonType: 'string', minLength: 1 },
        documentoFiscal: { bsonType: 'string', minLength: 1 },
        activo: { bsonType: 'bool' }
      }
    }
  },
  compras: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['numero', 'proveedorId', 'items', 'total', 'estado', 'fecha'],
      properties: {
        numero: { bsonType: 'string' },
        proveedorId: { bsonType: 'objectId' },
        items: { bsonType: 'array', minItems: 1 },
        total: { bsonType: ['double', 'int', 'long', 'decimal'], minimum: 0 },
        estado: { enum: ['RECIBIDA', 'ANULADA'] },
        fecha: { bsonType: 'date' }
      }
    }
  },
  ventas: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['numero', 'clienteId', 'items', 'total', 'metodoPago', 'estado', 'fecha'],
      properties: {
        numero: { bsonType: 'string' },
        clienteId: { bsonType: 'objectId' },
        items: { bsonType: 'array', minItems: 1 },
        total: { bsonType: ['double', 'int', 'long', 'decimal'], minimum: 0 },
        metodoPago: { enum: ['EFECTIVO', 'YAPE_PLIN', 'TARJETA', 'TRANSFERENCIA'] },
        estado: { enum: ['PAGADA', 'PENDIENTE', 'ANULADA'] },
        fecha: { bsonType: 'date' }
      }
    }
  },
  usuarios: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['nombre', 'correo', 'rol', 'activo'],
      properties: {
        nombre: { bsonType: 'string' },
        correo: { bsonType: 'string' },
        rol: { enum: ['ADMINISTRADOR', 'VENDEDOR', 'ALMACEN'] },
        activo: { bsonType: 'bool' }
      }
    }
  },
  movimientos_inventario: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['productoId', 'tipo', 'cantidad', 'referenciaTipo', 'createdAt'],
      properties: {
        productoId: { bsonType: 'objectId' },
        tipo: { enum: ['ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE'] },
        cantidad: { bsonType: ['int', 'long'] },
        referenciaTipo: { enum: ['COMPRA', 'VENTA', 'AJUSTE'] },
        createdAt: { bsonType: 'date' }
      }
    }
  }
};

async function main() {
  if (!uri) throw new Error('Configura MONGODB_URI en .env');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    for (const [name, validator] of Object.entries(schemas)) {
      const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
      if (exists) {
        await db.command({ collMod: name, validator, validationLevel: 'moderate', validationAction: 'error' });
        console.log(`Validador actualizado: ${name}`);
      } else {
        await db.createCollection(name, { validator, validationLevel: 'moderate', validationAction: 'error' });
        console.log(`Colección creada: ${name}`);
      }
    }
    await db.collection('productos').createIndex({ sku: 1 }, { unique: true });
    await db.collection('clientes').createIndex({ tipoDocumento: 1, documento: 1 }, { unique: true });
    await db.collection('proveedores').createIndex({ documentoFiscal: 1 }, { unique: true });
    await db.collection('ventas').createIndex({ numero: 1 }, { unique: true });
    await db.collection('compras').createIndex({ numero: 1 }, { unique: true });
    await db.collection('ventas').createIndex({ fecha: -1 });
    await db.collection('movimientos_inventario').createIndex({ productoId: 1, createdAt: -1 });
    console.log('Inicialización terminada.');
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
