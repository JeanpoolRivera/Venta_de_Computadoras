require('dotenv').config();
const app = require('./app');
const { connectDB, closeDB } = require('./config/db');

const port = Number(process.env.PORT || 3000);

connectDB()
  .then(() => {
    const server = app.listen(port, () => console.log(`API disponible en http://localhost:${port}`));
    const shutdown = async () => {
      server.close(async () => {
        await closeDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch((error) => {
    console.error('No se pudo iniciar la aplicación:', error.message);
    process.exit(1);
  });
