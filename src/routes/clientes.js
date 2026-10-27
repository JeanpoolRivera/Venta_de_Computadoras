const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/db');
const asyncHandler = require('../utils/async-handler');

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
  if (req.query.q) filter.$or = [
    { nombres: { $regex: String(req.query.q), $options: 'i' } },
    { apellidos: { $regex: String(req.query.q), $options: 'i' } },
    { documento: { $regex: String(req.query.q), $options: 'i' } }
  ];
  const data = await getDB().collection('clientes').find(filter).sort({ apellidos: 1 }).limit(100).toArray();
  res.json({ success: true, data });
}));

router.post('/', [
  body('nombres').isString().trim().notEmpty(),
  body('apellidos').isString().trim().notEmpty(),
  body('documento').isString().trim().notEmpty(),
  body('tipoDocumento').optional().isIn(['DNI', 'CE', 'RUC', 'OTRO']),
  body('correo').optional({ values: 'falsy' }).isEmail()
], asyncHandler(async (req, res) => {
  validate(req);
  const now = new Date();
  const doc = {
    tipoDocumento: req.body.tipoDocumento || 'DNI',
    documento: req.body.documento.trim(),
    nombres: req.body.nombres.trim(),
    apellidos: req.body.apellidos.trim(),
    correo: (req.body.correo || '').trim().toLowerCase(),
    telefono: (req.body.telefono || '').trim(),
    direccion: (req.body.direccion || '').trim(),
    createdAt: now,
    updatedAt: now
  };
  const result = await getDB().collection('clientes').insertOne(doc);
  res.status(201).json({ success: true, data: { _id: result.insertedId, ...doc } });
}));

module.exports = router;
