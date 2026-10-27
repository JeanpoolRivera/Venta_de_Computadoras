const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getDB, getClient } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const { parseObjectId } = require('../utils/validators');

const METODOS_PAGO = ['EFECTIVO', 'YAPE_PLIN', 'TARJETA', 'TRANSFERENCIA'];

function validate(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = new Error(result.array().map(e => e.msg).join('; '));
    error.status = 400;
    throw error;
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.estado) filter.estado = req.query.estado;
  const data = await getDB().collection('ventas').find(filter).sort({ createdAt: -1 }).limit(100).toArray();
  res.json({ success: true, data });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const venta = await getDB().collection('ventas').findOne({ _id: parseObjectId(req.params.id) });
  if (!venta) return res.status(404).json({ success: false, error: { message: 'Venta no encontrada' } });
  res.json({ success: true, data: venta });
}));

router.post('/', [
  body('clienteId').isString().notEmpty(),
  body('metodoPago').isIn(METODOS_PAGO),
  body('items').isArray({ min: 1 }),
  body('items.*.productoId').isString().notEmpty(),
  body('items.*.cantidad').isInt({ gt: 0 }).toInt()
], asyncHandler(async (req, res) => {
  validate(req);
  const clienteId = parseObjectId(req.body.clienteId);
  const db = getDB();
  const client = getClient();
  const session = client.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      const cliente = await db.collection('clientes').findOne({ _id: clienteId }, { session });
      if (!cliente) {
        const e = new Error('Cliente no encontrado'); e.status = 404; throw e;
      }
      const items = [];
      let total = 0;
      for (const raw of req.body.items) {
        const productoId = parseObjectId(raw.productoId);
        const cantidad = Number(raw.cantidad);
        const producto = await db.collection('productos').findOne(
          { _id: productoId, activo: true, stock: { $gte: cantidad } }, { session }
        );
        if (!producto) {
          const exists = await db.collection('productos').findOne({ _id: productoId }, { session });
          const e = new Error(!exists ? `Producto no encontrado: ${raw.productoId}` : `Stock insuficiente o producto inactivo: ${productoId}`);
          e.status = !exists ? 404 : 409;
          throw e;
        }
        const precioUnitario = Number(producto.precioVenta);
        const subtotal = Math.round(cantidad * precioUnitario * 100) / 100;
        total = Math.round((total + subtotal) * 100) / 100;
        items.push({
          productoId, sku: producto.sku, nombre: producto.nombre,
          cantidad, precioUnitario, costoUnitario: Number(producto.costo), subtotal
        });
        const stockResult = await db.collection('productos').updateOne(
          { _id: productoId, stock: { $gte: cantidad } },
          { $inc: { stock: -cantidad }, $set: { updatedAt: new Date() } }, { session }
        );
        if (stockResult.modifiedCount !== 1) {
          const e = new Error(`No fue posible descontar stock del producto ${producto.sku}`); e.status = 409; throw e;
        }
        await db.collection('movimientos_inventario').insertOne({
          productoId, tipo: 'SALIDA_VENTA', cantidad: -cantidad,
          referenciaTipo: 'VENTA', observacion: 'Salida por venta', createdAt: new Date()
        }, { session });
      }
      const doc = {
        numero: `V-${Date.now()}`,
        cliente: {
          _id: cliente._id,
          nombreCompleto: `${cliente.nombres} ${cliente.apellidos}`,
          documento: cliente.documento
        },
        clienteId,
        items,
        subtotal: total,
        descuento: 0,
        total,
        moneda: 'PEN',
        metodoPago: req.body.metodoPago,
        estado: 'PAGADA',
        fecha: new Date(),
        createdAt: new Date()
      };
      const result = await db.collection('ventas').insertOne(doc, { session });
      created = { _id: result.insertedId, ...doc };
    });
  } finally {
    await session.endSession();
  }
  res.status(201).json({ success: true, data: created });
}));

module.exports = router;
