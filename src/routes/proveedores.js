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
  if (req.query.activo !== undefined) filter.activo = req.query.activo === 'true';
  const data = await getDB().collection('proveedores').find(filter).sort({ razonSocial: 1 }).limit(100).toArray();
  res.json({ success: true, data });
}));

router.post('/', [
  body('razonSocial').isString().trim().notEmpty(),
  body('documentoFiscal').isString().trim().notEmpty(),
  body('correo').optional({ values: 'falsy' }).isEmail()
], asyncHandler(async (req, res) => {
  validate(req);
  const now = new Date();
  const doc = {
    razonSocial: req.body.razonSocial.trim(),
    documentoFiscal: req.body.documentoFiscal.trim(),
    contacto: (req.body.contacto || '').trim(),
    correo: (req.body.correo || '').trim().toLowerCase(),
    telefono: (req.body.telefono || '').trim(),
    direccion: (req.body.direccion || '').trim(),
    activo: true,
    createdAt: now,
    updatedAt: now
  };
  const result = await getDB().collection('proveedores').insertOne(doc);
  res.status(201).json({ success: true, data: { _id: result.insertedId, ...doc } });
}));

module.exports = router;
