require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Configura MONGODB_URI en .env');
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'venta_computadoras');

    console.log('\n1. Productos con stock bajo:');
    console.log(await db.collection('productos').find({
      activo: true, $expr: { $lte: ['$stock', '$stockMinimo'] }
    }, { projection: { sku: 1, nombre: 1, stock: 1, stockMinimo: 1 } }).toArray());

    console.log('\n2. Total vendido por método de pago:');
    console.log(await db.collection('ventas').aggregate([
      { $match: { estado: 'PAGADA' } },
      { $group: { _id: '$metodoPago', cantidadVentas: { $sum: 1 }, importeTotal: { $sum: '$total' } } },
      { $sort: { importeTotal: -1 } }
    ]).toArray());

    console.log('\n3. Productos más vendidos por unidades:');
    console.log(await db.collection('ventas').aggregate([
      { $match: { estado: 'PAGADA' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productoId', sku: { $first: '$items.sku' }, nombre: { $first: '$items.nombre' }, unidades: { $sum: '$items.cantidad' }, ingresos: { $sum: '$items.subtotal' } } },
      { $sort: { unidades: -1 } },
      { $limit: 10 }
    ]).toArray());

    console.log('\n4. Historial de movimientos de inventario recientes:');
    console.log(await db.collection('movimientos_inventario').find({}).sort({ createdAt: -1 }).limit(20).toArray());
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
