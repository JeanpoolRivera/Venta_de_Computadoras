const { MongoClient } = require('mongodb');

let client;
let db;

async function connectDB() {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'venta_computadoras';

  if (!uri) throw new Error('Falta configurar MONGODB_URI en el archivo .env');

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  await db.command({ ping: 1 });
  console.log(`MongoDB conectado: ${dbName}`);
  return db;
}

function getDB() {
  if (!db) throw new Error('La base de datos todavía no está conectada');
  return db;
}

function getClient() {
  if (!client) throw new Error('El cliente MongoDB todavía no está conectado');
  return client;
}

async function closeDB() {
  if (client) await client.close();
  client = undefined;
  db = undefined;
}

module.exports = { connectDB, getDB, getClient, closeDB };
