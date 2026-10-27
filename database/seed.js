require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Configura MONGODB_URI en .env');
  const client = new MongoClient(process.env.MONGODB_URI);
  const dbName = process.env.DB_NAME || 'venta_computadoras';
  try {
    await client.connect();
    const db = client.db(dbName);
    const names = ['movimientos_inventario', 'ventas', 'compras', 'productos', 'clientes', 'proveedores', 'usuarios'];
    for (const name of names) await db.collection(name).deleteMany({});
    const now = new Date();

    const proveedores = [
      { razonSocial: 'Distribuciones TecnoAndes S.A.C.', documentoFiscal: '20607845121', contacto: 'María Salazar', correo: 'ventas@tecnoandes.example', telefono: '064555101', direccion: 'Huancayo, Junín', activo: true, createdAt: now, updatedAt: now },
      { razonSocial: 'Importaciones Digital Perú S.R.L.', documentoFiscal: '20609123784', contacto: 'Luis Paredes', correo: 'pedidos@digitalperu.example', telefono: '015551020', direccion: 'Lima, Perú', activo: true, createdAt: now, updatedAt: now }
    ];
    const provResult = await db.collection('proveedores').insertMany(proveedores);

    const clientes = [
      { tipoDocumento: 'DNI', documento: '70451236', nombres: 'Andrea', apellidos: 'Quispe Rojas', correo: 'andrea.quispe@example.com', telefono: '987654321', direccion: 'El Tambo, Huancayo', createdAt: now, updatedAt: now },
      { tipoDocumento: 'DNI', documento: '71823645', nombres: 'Diego', apellidos: 'Huamán Soto', correo: 'diego.huaman@example.com', telefono: '986123456', direccion: 'Huancayo, Junín', createdAt: now, updatedAt: now },
      { tipoDocumento: 'RUC', documento: '20605432198', nombres: 'Comercial', apellidos: 'Los Andes S.A.C.', correo: 'compras@losandes.example', telefono: '064401020', direccion: 'Chilca, Huancayo', createdAt: now, updatedAt: now }
    ];
    const cliResult = await db.collection('clientes').insertMany(clientes);

    const productos = [
      { sku: 'CPU-R5-5600G', nombre: 'PC de escritorio Ryzen 5 5600G', categoria: 'Computadora de escritorio', marca: 'AMD', modelo: 'Ryzen 5 5600G / 16GB / 512GB SSD', descripcion: 'Equipo de escritorio para productividad y estudio', costo: 1450, precioVenta: 1799, stock: 12, stockMinimo: 3, activo: true, createdAt: now, updatedAt: now },
      { sku: 'LAP-LNV-I5-16', nombre: 'Laptop Lenovo Core i5 16GB', categoria: 'Laptop', marca: 'Lenovo', modelo: 'Core i5 / 16GB / 512GB SSD', descripcion: 'Laptop para trabajo y universidad', costo: 2100, precioVenta: 2599, stock: 8, stockMinimo: 2, activo: true, createdAt: now, updatedAt: now },
      { sku: 'GPU-RTX4060-8G', nombre: 'Tarjeta gráfica RTX 4060 8GB', categoria: 'Tarjeta gráfica', marca: 'NVIDIA', modelo: 'RTX 4060 8GB', descripcion: 'Tarjeta gráfica para equipos gamer', costo: 1180, precioVenta: 1499, stock: 5, stockMinimo: 2, activo: true, createdAt: now, updatedAt: now },
      { sku: 'RAM-DDR4-16', nombre: 'Memoria RAM DDR4 16GB', categoria: 'Memoria RAM', marca: 'Kingston', modelo: 'DDR4 3200MHz 16GB', descripcion: 'Módulo de memoria para PC compatible', costo: 95, precioVenta: 139, stock: 25, stockMinimo: 5, activo: true, createdAt: now, updatedAt: now },
      { sku: 'SSD-NVME-1TB', nombre: 'SSD NVMe 1TB', categoria: 'Almacenamiento', marca: 'Western Digital', modelo: 'Blue SN580 1TB', descripcion: 'Unidad de almacenamiento M.2 NVMe', costo: 220, precioVenta: 299, stock: 15, stockMinimo: 4, activo: true, createdAt: now, updatedAt: now },
      { sku: 'MON-24-FHD', nombre: 'Monitor 24 pulgadas Full HD', categoria: 'Monitor', marca: 'LG', modelo: '24MP400-B', descripcion: 'Monitor Full HD para oficina y hogar', costo: 360, precioVenta: 449, stock: 9, stockMinimo: 2, activo: true, createdAt: now, updatedAt: now }
    ];
    const prodResult = await db.collection('productos').insertMany(productos);

    const usuarios = [
      { nombre: 'Administrador Demo', correo: 'admin.demo@example.com', rol: 'ADMINISTRADOR', activo: true, createdAt: now, updatedAt: now },
      { nombre: 'Vendedor Demo', correo: 'vendedor.demo@example.com', rol: 'VENDEDOR', activo: true, createdAt: now, updatedAt: now }
    ];
    await db.collection('usuarios').insertMany(usuarios);

    console.log('Datos ficticios insertados correctamente.');
    console.log(`Proveedores: ${provResult.insertedCount}; clientes: ${cliResult.insertedCount}; productos: ${prodResult.insertedCount}; usuarios: ${usuarios.length}`);
    console.log('IDs de prueba para requests:');
    console.log(JSON.stringify({
      proveedorId: provResult.insertedIds[0].toString(),
      clienteId: cliResult.insertedIds[0].toString(),
      productoId: prodResult.insertedIds[0].toString()
    }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
