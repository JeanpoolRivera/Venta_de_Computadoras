const request = require('supertest');
const app = require('../src/app');

describe('API base', () => {
  test('GET / devuelve nombre y versión', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('API Venta de Computadoras');
    expect(response.body.version).toBe('1.0.0');
  });

  test('ruta inexistente devuelve 404 en JSON', async () => {
    const response = await request(app).get('/ruta-que-no-existe');
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
