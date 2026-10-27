const router = require('express').Router();
const { getDB } = require('../config/db');
const asyncHandler = require('../utils/async-handler');

router.get('/resumen', asyncHandler(async (req, res) => {
  const db = getDB();
  const [productos, clientes, proveedores, ventas, stockBajo, ventasHoy] = await Promise.all([
    db.collection('productos').countDocuments({ activo: true }),
    db.collection('clientes').countDocuments({}),
    db.collection('proveedores').countDocuments({ activo: true }),
    db.collection('ventas').countDocuments({ estado: 'PAGADA' }),
    db.collection('productos').countDocuments({ activo: true, $expr: { $lte: ['$stock', '$stockMinimo'] } }),
    db.collection('ventas').aggregate([
      { $match: { estado: 'PAGADA', fecha: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
      { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } }
    ]).toArray()
  ]);
  res.json({ success: true, data: {
    productosActivos: productos, clientes, proveedoresActivos: proveedores,
    ventasRegistradas: ventas, productosConStockBajo: stockBajo,
    ventasDeHoy: ventasHoy[0] || { total: 0, cantidad: 0 }, moneda: 'PEN'
  }});
}));

module.exports = router;
