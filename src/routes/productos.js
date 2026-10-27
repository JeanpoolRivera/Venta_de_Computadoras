const router = require('express').Router();
const { ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/db');
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
  const filter = {};
  if (req.query.categoria) filter.categoria = req.query.categoria;
  if (req.query.activo !== undefined) filter.activo = req.query.activo === 'true';
  if (req.query.q) filter.$or = [
    { nombre: { $regex: String(req.query.q), $options: 'i' } },
    { sku: { $regex: String(req.query.q), $options: 'i' } },
    { marca: { $regex: String(req.query.q), $options: 'i' } }
  ];
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10)));
  const [data, total] = await Promise.all([
    getDB().collection('productos').find(filter).sort({ nombre: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
    getDB().collection('productos').countDocuments(filter)
  ]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const data = await getDB().collection('productos').findOne({ _id: parseObjectId(req.params.id) });
  if (!data) return res.status(404).json({ success: false, error: { message: 'Producto no encontrado' } });
  res.json({ success: true, data });
}));

router.post('/', [
  body('sku').isString().trim().notEmpty(),
  body('nombre').isString().trim().notEmpty(),
  body('categoria').isString().trim().notEmpty(),
  body('precioVenta').isFloat({ gt: 0 }).toFloat(),
  body('costo').isFloat({ gt: 0 }).toFloat(),
  body('stock').optional().isInt({ min: 0 }).toInt(),
  body('stockMinimo').optional().isInt({ min: 0 }).toInt()
], asyncHandler(async (req, res) => {
  validate(req);
  const now = new Date();
  const product = {
    sku: req.body.sku.trim().toUpperCase(),
    nombre: req.body.nombre.trim(),
    categoria: req.body.categoria.trim(),
    marca: (req.body.marca || '').trim(),
    modelo: (req.body.modelo || '').trim(),
    descripcion: (req.body.descripcion || '').trim(),
    costo: req.body.costo,
    precioVenta: req.body.precioVenta,
    stock: req.body.stock ?? 0,
    stockMinimo: req.body.stockMinimo ?? 3,
    activo: true,
    createdAt: now,
    updatedAt: now
  };
  const result = await getDB().collection('productos').insertOne(product);
  res.status(201).json({ success: true, data: { _id: result.insertedId, ...product } });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const allowed = ['nombre', 'categoria', 'marca', 'modelo', 'descripcion', 'precioVenta', 'costo', 'stockMinimo', 'activo'];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  if (!Object.keys(update).length) {
    return res.status(400).json({ success: false, error: { message: 'No hay campos permitidos para actualizar' } });
  }
  if (update.precioVenta !== undefined && (!Number.isFinite(Number(update.precioVenta)) || Number(update.precioVenta) <= 0)) {
    return res.status(400).json({ success: false, error: { message: 'precioVenta debe ser mayor que cero' } });
  }
  if (update.costo !== undefined && (!Number.isFinite(Number(update.costo)) || Number(update.costo) <= 0)) {
    return res.status(400).json({ success: false, error: { message: 'costo debe ser mayor que cero' } });
  }
  if (update.precioVenta !== undefined) update.precioVenta = Number(update.precioVenta);
  if (update.costo !== undefined) update.costo = Number(update.costo);
  update.updatedAt = new Date();
  const result = await getDB().collection('productos').findOneAndUpdate(
    { _id: parseObjectId(req.params.id) }, { $set: update }, { returnDocument: 'after' }
  );
  const doc = result && (result.value || result);
  if (!doc) return res.status(404).json({ success: false, error: { message: 'Producto no encontrado' } });
  res.json({ success: true, data: doc });
}));

module.exports = router;
