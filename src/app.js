const express = require('express');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error-handler');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.get('/', (req, res) => res.json({
  name: 'API Venta de Computadoras',
  version: '1.0.0',
  docs: 'Consulta docs/endpoints.md en el repositorio'
}));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
