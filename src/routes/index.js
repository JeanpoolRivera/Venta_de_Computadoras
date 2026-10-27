const router = require('express').Router();
const { getDB } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const productos = require('./productos');
const clientes = require('./clientes');
const proveedores = require('./proveedores');
const compras = require('./compras');
const ventas = require('./ventas');
const dashboard = require('./dashboard');

router.get('/health', asyncHandler(async (req, res) => {
  await getDB().command({ ping: 1 });
  res.json({ success: true, data: { status: 'ok', database: 'connected' } });
}));

router.use('/productos', productos);
router.use('/clientes', clientes);
router.use('/proveedores', proveedores);
router.use('/compras', compras);
router.use('/ventas', ventas);
router.use('/dashboard', dashboard);

module.exports = router;
