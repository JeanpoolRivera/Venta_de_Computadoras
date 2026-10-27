const { ObjectId } = require('mongodb');

function parseObjectId(value) {
  if (!ObjectId.isValid(value) || String(new ObjectId(value)) !== value) {
    const error = new Error('El identificador debe ser un ObjectId válido');
    error.status = 400;
    throw error;
  }
  return new ObjectId(value);
}

function positiveNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    const error = new Error(`${fieldName} debe ser un número mayor que cero`);
    error.status = 400;
    throw error;
  }
  return number;
}

function requiredString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${fieldName} es obligatorio`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

module.exports = { parseObjectId, positiveNumber, requiredString };
