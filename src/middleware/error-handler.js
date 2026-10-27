function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` }
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || (err.code === 11000 ? 409 : 500);
  const message = err.code === 11000
    ? 'Ya existe un registro con uno de los valores únicos proporcionados'
    : (status === 500 ? 'Error interno del servidor' : err.message);

  if (status === 500) console.error(err);
  res.status(status).json({ success: false, error: { message } });
}

module.exports = { notFound, errorHandler };
