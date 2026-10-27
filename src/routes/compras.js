const router = require('express').Router();
const { ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator');
const { getDB, getClient } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const { parseObjectId } = require('../utils/validators');

function validate(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = new Error(result.array().map(e => e.msg).join('; '));
    error.status = 400;
    throw error;
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const data = await getDB().collection('compras').find({}).sort({ createdAt: -1 }).limit(100).toArray();
  res.json({ success: true, data });
}));

router.post('/', [
  body('proveedorId').isString().notEmpty(),
  body('items').isArray({ min: 1 }),
  body('items.*.productoId').isString().notEmpty(),
  body('items.*.cantidad').isInt({ gt: 0 }).toInt(),
  body('items.*.costoUnitario').isFloat({ gt: 0 }).toFloat()
], asyncHandler(async (req, res) => {
  validate(req);
  const proveedorId = parseObjectId(req.body.proveedorId);
  const db = getDB();
  const client = getClient();
  const session = client.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      const proveedor = await db.collection('proveedores').findOne({ _id: proveedorId, activo: true }, { session });
      if (!proveedor) {
        const e = new Error('Proveedor no encontrado o inactivo'); e.status = 404; throw e;
      }
      const items = [];
      let total = 0;
      for (const raw of req.body.items) {
        const productoId = parseObjectId(raw.productoId);
        const producto = await db.collection('productos').findOne({ _id: productoId, activo: true }, { session });
        if (!producto) {
          const e = new Error(`Producto no encontrado o inactivo: ${raw.productoId}`); e.status = 404; throw e;
        }
        const cantidad = Number(raw.cantidad);
        const costoUnitario = Number(raw.costoUnitario);
        const subtotal = Math.round(cantidad * costoUnitario * 100) / 100;
        total = Math.round((total + subtotal) * 100) / 100;
        items.push({ productoId, sku: producto.sku, nombre: producto.nombre, cantidad, costoUnitario, subtotal });
        await db.collection('productos').updateOne(
          { _id: productoId }, { $inc: { stock: cantidad }, $set: { costo: costoUnitario, updatedAt: new Date() } }, { session }
        );
        await db.collection('movimientos_inventario').insertOne({
          productoId, tipo: 'ENTRADA_COMPRA', cantidad, referenciaTipo: 'COMPRA',
          observacion: 'Entrada por compra a proveedor', createdAt: new Date()
        }, { session });
      }
      const doc = {
        numero: `C-${Date.now()}`,
        proveedor: { _id: proveedor._id, razonSocial: proveedor.razonSocial },
        proveedorId,
        items,
        total,
        estado: 'RECIBIDA',
        fecha: new Date(),
        createdAt: new Date()
      };
      const result = await db.collection('compras').insertOne(doc, { session });
      created = { _id: result.insertedId, ...doc };
    });
  } finally {
    await session.endSession();
  }
  res.status(201).json({ success: true, data: created });
}));

module.exports = router;
